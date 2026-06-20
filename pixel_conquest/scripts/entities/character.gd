class_name Character
extends Resource

## 角色类 - 管理角色数据

# 基础属性
@export var id: String = ""
@export var name: String = ""
@export var is_player: bool = false
@export var is_lord: bool = false

# 等级和经验
@export var level: int = 1
@export var experience: int = 0

# 四大属性
@export var strength: int = 10      # 力量 - 影响物理伤害和负重
@export var agility: int = 10       # 敏捷 - 影响速度和闪避
@export var intelligence: int = 10  # 智力 - 影响技能学习和策略
@export var charisma: int = 10      # 魅力 - 影响说服和统御

# 派生属性
@export var health: int = 100
@export var max_health: int = 100
@export var stamina: int = 100
@export var max_stamina: int = 100

# 技能 {skill_id: level}
@export var skills: Dictionary = {}

# 装备槽位
@export var equipment: Dictionary = {
	"weapon": null,
	"head": null,
	"chest": null,
	"hands": null,
	"feet": null,
	"offhand": null,
	"accessory1": null,
	"accessory2": null
}

# 背包物品 [{item_id, count}]
@export var inventory: Array = []

# 金币
@export var gold: int = 1000

# 所属势力
@export var faction_id: String = ""

# 队伍
@export var party: Array = []  # 队伍成员 [{troop_id, count}]

# 关系 {character_id: relation}
@export var relations: Dictionary = {}

# 当前位置
@export var current_location: String = ""
@export var world_position: Vector2 = Vector2.ZERO

# 任务列表
@export var active_quests: Array = []
@export var completed_quests: Array = []

## 初始化为玩家角色
func setup_as_player() -> void:
	id = "player"
	name = "玩家"
	is_player = true
	level = 1
	experience = 0
	
	# 随机初始属性
	strength = randi_range(8, 12)
	agility = randi_range(8, 12)
	intelligence = randi_range(8, 12)
	charisma = randi_range(8, 12)
	
	# 计算派生属性
	_calculate_derived_stats()
	
	# 初始技能
	skills = {
		"sword_mastery": 1,
		"leadership": 1,
		"trade": 1
	}
	
	# 初始金币
	gold = 1000
	
	# 初始队伍
	party = [
		{"troop_id": "troop_0", "count": 5}  # 5个新兵步兵
	]

## 计算派生属性
func _calculate_derived_stats() -> void:
	max_health = 50 + strength * 5 + level * 10
	max_stamina = 50 + agility * 3 + level * 5
	health = max_health
	stamina = max_stamina

## 获取属性总值（包含装备加成）
func get_total_attribute(attr_name: String) -> int:
	var base = get(attr_name)
	var bonus = 0
	
	# 计算装备加成
	for slot in equipment:
		var item = equipment[slot]
		if item != null and item is Dictionary:
			if item.has("stat_bonus") and item.stat_bonus.has(attr_name):
				bonus += item.stat_bonus[attr_name]
	
	return base + bonus

## 获取攻击力
func get_attack() -> int:
	var base_attack = strength / 2 + level * 2
	
	# 武器加成
	if equipment.weapon != null:
		base_attack += equipment.weapon.damage
	
	return base_attack

## 获取防御力
func get_defense() -> int:
	var base_defense = agility / 3 + level
	
	# 护甲加成
	for slot in ["head", "chest", "hands", "feet", "offhand"]:
		if equipment[slot] != null:
			base_defense += equipment[slot].defense
	
	return base_defense

## 获取速度
func get_speed() -> float:
	var base_speed = 1.0 + agility * 0.02
	
	# 护甲重量影响
	if equipment.chest != null:
		base_speed *= 0.95  # 胸甲减速
	
	return base_speed

## 获取部队上限
func get_party_limit() -> int:
	var leadership_level = skills.get("leadership", 0)
	return 10 + leadership_level * 10 + charisma * 2

## 获取当前部队数量
func get_party_count() -> int:
	var total = 0
	for troop in party:
		total += troop.count
	return total

## 添加部队
func add_troops(troop_id: String, count: int) -> bool:
	var current_count = get_party_count()
	var limit = get_party_limit()
	
	if current_count + count > limit:
		return false
	
	# 查找是否已有该兵种
	for troop in party:
		if troop.troop_id == troop_id:
			troop.count += count
			return true
	
	# 添加新兵种
	party.append({"troop_id": troop_id, "count": count})
	return true

## 移除部队
func remove_troops(troop_id: String, count: int) -> bool:
	for i in range(party.size()):
		if party[i].troop_id == troop_id:
			if party[i].count <= count:
				party.remove_at(i)
			else:
				party[i].count -= count
			return true
	return false

## 添加经验
func add_experience(amount: int) -> void:
	experience += amount
	
	# 检查升级
	var exp_needed = get_experience_needed()
	while experience >= exp_needed:
		experience -= exp_needed
		level_up()
		exp_needed = get_experience_needed()

## 获取升级所需经验
func get_experience_needed() -> int:
	return level * 100 + (level - 1) * 50

## 升级
func level_up() -> void:
	level += 1
	_calculate_derived_stats()
	
	# 获得属性点
	strength += 1
	agility += 1
	intelligence += 1
	charisma += 1
	
	print("%s 升级到 %d 级！" % [name, level])

## 学习技能
func learn_skill(skill_id: String, level: int = 1) -> bool:
	if not DataManager.skills.has(skill_id):
		return false
	
	var skill_data = DataManager.skills[skill_id]
	var current_level = skills.get(skill_id, 0)
	
	if current_level >= skill_data.max_level:
		return false
	
	skills[skill_id] = min(current_level + level, skill_data.max_level)
	return true

## 装备物品
func equip_item(item: Dictionary, slot: String) -> bool:
	# 检查等级需求
	if item.has("level_requirement") and level < item.level_requirement:
		return false
	
	# 检查槽位是否有效
	if not equipment.has(slot):
		return false
	
	# 卸下当前装备
	if equipment[slot] != null:
		add_item_to_inventory(equipment[slot])
	
	# 装备新物品
	equipment[slot] = item
	return true

## 卸下装备
func unequip_item(slot: String) -> bool:
	if equipment.has(slot) and equipment[slot] != null:
		add_item_to_inventory(equipment[slot])
		equipment[slot] = null
		return true
	return false

## 添加物品到背包
func add_item_to_inventory(item: Dictionary, count: int = 1) -> bool:
	# 检查是否可堆叠
	if item.get("stackable", false):
		for inv_item in inventory:
			if inv_item.id == item.id:
				inv_item.count += count
				return true
	
	inventory.append({"id": item.id, "item": item, "count": count})
	return true

## 从背包移除物品
func remove_item_from_inventory(item_id: String, count: int = 1) -> bool:
	for i in range(inventory.size()):
		if inventory[i].id == item_id:
			if inventory[i].count <= count:
				inventory.remove_at(i)
			else:
				inventory[i].count -= count
			return true
	return false

## 检查是否有物品
func has_item(item_id: String, count: int = 1) -> bool:
	for inv_item in inventory:
		if inv_item.id == item_id and inv_item.count >= count:
			return true
	return false

## 修改金币
func modify_gold(amount: int) -> bool:
	if gold + amount < 0:
		return false
	gold += amount
	return true

## 修改关系
func modify_relation(character_id: String, change: int) -> void:
	var current = relations.get(character_id, 0)
	relations[character_id] = clamp(current + change, -100, 100)

## 获取关系
func get_relation(character_id: String) -> int:
	return relations.get(character_id, 0)

## 序列化为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"is_player": is_player,
		"is_lord": is_lord,
		"level": level,
		"experience": experience,
		"strength": strength,
		"agility": agility,
		"intelligence": intelligence,
		"charisma": charisma,
		"health": health,
		"max_health": max_health,
		"stamina": stamina,
		"max_stamina": max_stamina,
		"skills": skills,
		"equipment": equipment,
		"inventory": inventory,
		"gold": gold,
		"faction_id": faction_id,
		"party": party,
		"relations": relations,
		"current_location": current_location,
		"world_position": {"x": world_position.x, "y": world_position.y},
		"active_quests": active_quests,
		"completed_quests": completed_quests
	}

## 从字典反序列化
func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "")
	is_player = data.get("is_player", false)
	is_lord = data.get("is_lord", false)
	level = data.get("level", 1)
	experience = data.get("experience", 0)
	strength = data.get("strength", 10)
	agility = data.get("agility", 10)
	intelligence = data.get("intelligence", 10)
	charisma = data.get("charisma", 10)
	health = data.get("health", 100)
	max_health = data.get("max_health", 100)
	stamina = data.get("stamina", 100)
	max_stamina = data.get("max_stamina", 100)
	skills = data.get("skills", {})
	equipment = data.get("equipment", {})
	inventory = data.get("inventory", [])
	gold = data.get("gold", 1000)
	faction_id = data.get("faction_id", "")
	party = data.get("party", [])
	relations = data.get("relations", {})
	current_location = data.get("current_location", "")
	
	var pos = data.get("world_position", {"x": 0, "y": 0})
	world_position = Vector2(pos.x, pos.y)
	
	active_quests = data.get("active_quests", [])
	completed_quests = data.get("completed_quests", [])