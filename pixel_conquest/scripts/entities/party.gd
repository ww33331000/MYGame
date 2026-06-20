class_name Party
extends Resource

## 队伍类 - 管理移动的部队编队

# 队伍类型
enum Type {
	PLAYER,
	LORD,
	CARAVAN,
	BANDIT,
	PATROL,
	ARMY
}

# 基础属性
@export var id: String = ""
@export var name: String = ""
@export var type: Type = Type.BANDIT

# 所属角色/势力
@export var owner_id: String = ""
@export var faction_id: String = ""

# 位置
@export var position: Vector2 = Vector2.ZERO
@export var target_position: Vector2 = Vector2.ZERO
@export var is_moving: bool = false

# 移动速度
@export var base_speed: float = 1.0
@export var current_speed: float = 1.0

# 部队 [{troop_id, count}]
@export var troops: Array = []

# 物品 [{item_id, count}]
@export var inventory: Array = []

# 囚犯 [{character_id}]
@export var prisoners: Array = []

# 任务
@export var current_quest: String = ""
@export var quest_target: String = ""

# 行为状态
@export var behavior: String = "idle"  # idle, patrol, attack, flee, follow
@export var behavior_target: String = ""

# 视野范围
@export var sight_range: float = 500.0

## 初始化队伍
func initialize(party_id: String, party_name: String, party_type: Type) -> void:
	id = party_id
	name = party_name
	type = party_type
	
	# 根据类型设置速度
	match type:
		Type.PLAYER:
			base_speed = 1.0
		Type.LORD:
			base_speed = 0.9
		Type.CARAVAN:
			base_speed = 0.7
		Type.BANDIT:
			base_speed = 1.2
		Type.PATROL:
			base_speed = 1.0
		Type.ARMY:
			base_speed = 0.6
	
	current_speed = base_speed

## 获取部队总数
func get_troop_count() -> int:
	var total = 0
	for troop in troops:
		total += troop.count
	return total

## 获取部队战斗力
func get_strength() -> int:
	var total = 0
	for troop in troops:
		var troop_data = DataManager.troops.get(troop.troop_id, {})
		if not troop_data.is_empty():
			var health = troop_data.get("health", 50)
			var attack = troop_data.get("attack", 10)
			total += (health + attack) * troop.count
	return total

## 添加部队
func add_troops(troop_id: String, count: int) -> void:
	for troop in troops:
		if troop.troop_id == troop_id:
			troop.count += count
			return
	
	troops.append({"troop_id": troop_id, "count": count})

## 移除部队
func remove_troops(troop_id: String, count: int) -> bool:
	for i in range(troops.size()):
		if troops[i].troop_id == troop_id:
			if troops[i].count <= count:
				troops.remove_at(i)
			else:
				troops[i].count -= count
			return true
	return false

## 获取移动速度（考虑负重）
func get_movement_speed() -> float:
	var troop_count = get_troop_count()
	var inventory_weight = _calculate_inventory_weight()
	
	# 速度受部队数量和负重影响
	var speed_modifier = 1.0 - (troop_count * 0.001) - (inventory_weight * 0.0001)
	speed_modifier = max(0.3, speed_modifier)  # 最低30%速度
	
	return current_speed * speed_modifier

## 计算负重
func _calculate_inventory_weight() -> int:
	var weight = 0
	for item in inventory:
		weight += item.get("count", 0)
	return weight

## 移动到目标位置
func move_to(target: Vector2) -> void:
	target_position = target
	is_moving = true

## 停止移动
func stop_moving() -> void:
	is_moving = false
	target_position = position

## 更新位置
func update_position(delta: float) -> void:
	if not is_moving:
		return
	
	var direction = (target_position - position).normalized()
	var distance = position.distance_to(target_position)
	var move_distance = get_movement_speed() * delta * 100  # 100 单位/秒
	
	if distance <= move_distance:
		position = target_position
		is_moving = false
	else:
		position += direction * move_distance

## 检查是否在视野内
func is_in_sight(other_position: Vector2) -> bool:
	return position.distance_to(other_position) <= sight_range

## 检查是否可以战斗
func can_fight(other_party: Party) -> bool:
	# 玩家可以攻击任何敌对势力
	if type == Type.PLAYER:
		if other_party.faction_id != faction_id:
			return true
	
	# 商队不主动攻击
	if type == Type.CARAVAN:
		return false
	
	# 匪徒攻击所有人
	if type == Type.BANDIT:
		return true
	
	# 领主攻击敌对势力
	if type == Type.LORD:
		if WorldManager.factions.has(faction_id) and WorldManager.factions.has(other_party.faction_id):
			var my_faction = WorldManager.factions[faction_id]
			return my_faction.is_enemy(other_party.faction_id)
	
	return false

## 检查是否应该逃跑
func should_flee_from(other_party: Party) -> bool:
	# 商队遇到匪徒或敌对势力逃跑
	if type == Type.CARAVAN:
		if other_party.type == Type.BANDIT:
			return true
		if WorldManager.factions.has(faction_id) and WorldManager.factions.has(other_party.faction_id):
			var my_faction = WorldManager.factions[faction_id]
			return my_faction.is_enemy(other_party.faction_id)
	
	# 弱小队伍遇到强敌逃跑
	if get_strength() < other_party.get_strength() * 0.5:
		return randf() < 0.5  # 50% 概率逃跑
	
	return false

## 战斗后处理
func after_battle(victory: bool, enemy_party: Party) -> void:
	if victory:
		# 胜利，获得战利品
		_loot_enemy(enemy_party)
		
		# 招募俘虏
		_recruit_prisoners(enemy_party)
	else:
		# 失败，损失部队
		_take_casualties(0.5)  # 损失50%

## 掠夺敌人
func _loot_enemy(enemy: Party) -> void:
	# 获得敌人部分物品
	for item in enemy.inventory:
		var loot_count = int(item.count * randf_range(0.3, 0.7))
		if loot_count > 0:
			add_item(item.item_id, loot_count)
	
	# 获得金币
	var gold_loot = enemy.get_troop_count() * randi_range(5, 20)
	if owner_id == "player":
		GameManager.player.modify_gold(gold_loot)

## 招募俘虏
func _recruit_prisoners(enemy: Party) -> void:
	for troop in enemy.troops:
		var recruit_count = int(troop.count * randf_range(0.1, 0.3))
		if recruit_count > 0:
			add_troops(troop.troop_id, recruit_count)

## 承受伤亡
func _take_casualties(ratio: float) -> void:
	for troop in troops:
		var casualties = int(troop.count * ratio)
		troop.count = max(0, troop.count - casualties)
	
	# 移除空部队
	troops = troops.filter(func(t): return t.count > 0)

## 添加物品
func add_item(item_id: String, count: int) -> void:
	for item in inventory:
		if item.item_id == item_id:
			item.count += count
			return
	
	inventory.append({"item_id": item_id, "count": count})

## 移除物品
func remove_item(item_id: String, count: int) -> bool:
	for i in range(inventory.size()):
		if inventory[i].item_id == item_id:
			if inventory[i].count <= count:
				inventory.remove_at(i)
			else:
				inventory[i].count -= count
			return true
	return false

## 添加囚犯
func add_prisoner(character_id: String) -> void:
	if not prisoners.has(character_id):
		prisoners.append(character_id)

## 移除囚犯
func remove_prisoner(character_id: String) -> void:
	prisoners.erase(character_id)

## 序列化为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"type": type,
		"owner_id": owner_id,
		"faction_id": faction_id,
		"position": {"x": position.x, "y": position.y},
		"target_position": {"x": target_position.x, "y": target_position.y},
		"is_moving": is_moving,
		"base_speed": base_speed,
		"current_speed": current_speed,
		"troops": troops,
		"inventory": inventory,
		"prisoners": prisoners,
		"current_quest": current_quest,
		"quest_target": quest_target,
		"behavior": behavior,
		"behavior_target": behavior_target,
		"sight_range": sight_range
	}

## 从字典反序列化
func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "")
	type = data.get("type", Type.BANDIT)
	owner_id = data.get("owner_id", "")
	faction_id = data.get("faction_id", "")
	
	var pos = data.get("position", {"x": 0, "y": 0})
	position = Vector2(pos.x, pos.y)
	
	var target = data.get("target_position", {"x": 0, "y": 0})
	target_position = Vector2(target.x, target.y)
	
	is_moving = data.get("is_moving", false)
	base_speed = data.get("base_speed", 1.0)
	current_speed = data.get("current_speed", 1.0)
	troops = data.get("troops", [])
	inventory = data.get("inventory", [])
	prisoners = data.get("prisoners", [])
	current_quest = data.get("current_quest", "")
	quest_target = data.get("quest_target", "")
	behavior = data.get("behavior", "idle")
	behavior_target = data.get("behavior_target", "")
	sight_range = data.get("sight_range", 500.0)