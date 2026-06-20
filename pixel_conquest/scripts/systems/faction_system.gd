extends Node

## 势力系统 - 管理势力相关逻辑

# 势力关系阈值
const ENEMY_THRESHOLD: int = -50
const ALLY_THRESHOLD: int = 50
const NEUTRAL_RANGE: int = 50

# 势力状态
enum FactionStatus {
	ACTIVE,
	DECLINING,
	COLLAPSED
}

func _ready() -> void:
	print("FactionSystem initialized")

## 创建新势力
func create_faction(name: String, color: Color, leader_id: String) -> Faction:
	var faction = Faction.new()
	faction.id = "faction_%d" % Time.get_ticks_msec()
	faction.name = name
	faction.color = color
	faction.leader_id = leader_id
	faction.is_active = true
	
	WorldManager.factions[faction.id] = faction
	EventManager.trigger_event("faction_created", {"faction_id": faction.id})
	
	return faction

## 删除势力
func destroy_faction(faction_id: String) -> bool:
	if not WorldManager.factions.has(faction_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	# 检查是否可以删除
	if faction.territories.size() > 0:
		return false
	
	# 移除所有成员
	for member_id in faction.members:
		if WorldManager.characters.has(member_id):
			var character = WorldManager.characters[member_id]
			character.faction_id = ""
	
	# 删除势力
	WorldManager.factions.erase(faction_id)
	EventManager.trigger_event("faction_destroyed", {"faction_id": faction_id})
	
	return true

## 加入势力
func join_faction(character_id: String, faction_id: String) -> bool:
	if not WorldManager.factions.has(faction_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	# 如果角色已有势力，先退出
	if WorldManager.characters.has(character_id):
		var character = WorldManager.characters[character_id]
		if character.faction_id != "":
			leave_faction(character_id, character.faction_id)
		
		character.faction_id = faction_id
	
	faction.add_member(character_id)
	
	return true

## 退出势力
func leave_faction(character_id: String, faction_id: String) -> bool:
	if not WorldManager.factions.has(faction_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	# 如果是领袖，需要指定新领袖
	if faction.leader_id == character_id:
		if faction.members.size() > 1:
			# 选择新领袖
			faction.members.erase(character_id)
			faction.leader_id = faction.members[0]
		else:
			# 势力只剩领袖，势力可能崩溃
			faction.is_active = false
	
	faction.remove_member(character_id)
	
	if WorldManager.characters.has(character_id):
		var character = WorldManager.characters[character_id]
		character.faction_id = ""
	
	return true

## 获取势力状态
func get_faction_status(faction_id: String) -> FactionStatus:
	if not WorldManager.factions.has(faction_id):
		return FactionStatus.COLLAPSED
	
	var faction = WorldManager.factions[faction_id]
	
	if not faction.is_active:
		return FactionStatus.COLLAPSED
	
	if faction.territories.size() == 0:
		return FactionStatus.DECLINING
	
	if faction.treasury < 0 or faction.food < 0:
		return FactionStatus.DECLINING
	
	return FactionStatus.ACTIVE

## 获取势力实力评估
func evaluate_faction_strength(faction_id: String) -> Dictionary:
	if not WorldManager.factions.has(faction_id):
		return {}
	
	var faction = WorldManager.factions[faction_id]
	
	return {
		"military": faction.get_total_military(),
		"strength": faction.get_total_strength(),
		"territories": faction.territories.size(),
		"prosperity": faction.get_total_prosperity(),
		"population": faction.get_total_population(),
		"treasury": faction.treasury,
		"food": faction.food,
		"members": faction.members.size()
	}

## 检查势力是否可以宣战
func can_declare_war(faction_id: String, target_id: String) -> bool:
	if not WorldManager.factions.has(faction_id) or not WorldManager.factions.has(target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	var target = WorldManager.factions[target_id]
	
	# 已经是敌对状态
	if faction.is_enemy(target_id):
		return false
	
	# 已经是同盟状态
	if faction.is_ally(target_id):
		return false
	
	# 势力实力不足
	if faction.get_total_strength() < 100:
		return false
	
	return true

## 检查势力是否可以议和
func can_make_peace(faction_id: String, target_id: String) -> bool:
	if not WorldManager.factions.has(faction_id) or not WorldManager.factions.has(target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	# 不是敌对状态
	if not faction.is_enemy(target_id):
		return false
	
	return true

## 检查势力是否可以结盟
func can_form_alliance(faction_id: String, target_id: String) -> bool:
	if not WorldManager.factions.has(faction_id) or not WorldManager.factions.has(target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	# 已经是同盟
	if faction.is_ally(target_id):
		return false
	
	# 是敌对状态
	if faction.is_enemy(target_id):
		return false
	
	return true

## 宣战
func declare_war(faction_id: String, target_id: String) -> bool:
	if not can_declare_war(faction_id, target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	var target = WorldManager.factions[target_id]
	
	faction.declare_war(target_id)
	
	# 宣战会影响其他势力的关系
	for other_id in WorldManager.factions:
		if other_id != faction_id and other_id != target_id:
			var other_faction = WorldManager.factions[other_id]
			
			# 同盟势力也宣战
			if faction.is_ally(other_id):
				other_faction.declare_war(target_id)
			
			# 中立势力关系下降
			if other_faction.is_neutral(faction_id):
				other_faction.modify_relation(faction_id, -10)
	
	return true

## 议和
func make_peace(faction_id: String, target_id: String, tribute: int = 0) -> bool:
	if not can_make_peace(faction_id, target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	var target = WorldManager.factions[target_id]
	
	# 议和需要支付贡金（战败方）
	if tribute > 0:
		if faction.treasury >= tribute:
			faction.treasury -= tribute
			target.treasury += tribute
		else:
			return false
	
	faction.make_peace(target_id)
	
	# 议和后关系改善
	faction.modify_relation(target_id, 20)
	
	return true

## 结盟
func form_alliance(faction_id: String, target_id: String) -> bool:
	if not can_form_alliance(faction_id, target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	var target = WorldManager.factions[target_id]
	
	faction.form_alliance(target_id)
	
	# 结盟后共享部分情报
	# TODO: 实现情报共享
	
	return true

## 解除同盟
func break_alliance(faction_id: String, target_id: String) -> bool:
	if not WorldManager.factions.has(faction_id) or not WorldManager.factions.has(target_id):
		return false
	
	var faction = WorldManager.factions[faction_id]
	
	if not faction.is_ally(target_id):
		return false
	
	faction.break_alliance(target_id)
	
	# 解除同盟会降低关系
	faction.modify_relation(target_id, -30)
	
	return true

## 获取势力关系描述
func get_relation_description(relation_value: int) -> String:
	if relation_value >= ALLY_THRESHOLD:
		return "同盟"
	elif relation_value <= ENEMY_THRESHOLD:
		return "敌对"
	else:
		return "中立"

## 获取势力间关系变化原因
func get_relation_change_reasons(faction_id: String, target_id: String) -> Array:
	var reasons = []
	
	if not WorldManager.factions.has(faction_id) or not WorldManager.factions.has(target_id):
		return reasons
	
	var faction = WorldManager.factions[faction_id]
	var target = WorldManager.factions[target_id]
	
	# 检查领土冲突
	for territory_id in faction.territories:
		var territory = WorldManager.locations.get(territory_id)
		if territory == null:
			continue
		
		# 检查是否靠近敌方领土
		for enemy_territory_id in target.territories:
			var enemy_territory = WorldManager.locations.get(enemy_territory_id)
			if enemy_territory == null:
				continue
			
			var distance = territory.position.distance_to(enemy_territory.position)
			if distance < 500:
				reasons.append("领土接近")
	
	# 检查贸易关系
	# TODO: 实现贸易关系检查
	
	# 检查战争历史
	if faction.is_enemy(target_id):
		reasons.append("正在交战")
	
	return reasons

## 计算势力外交影响力
func calculate_diplomatic_influence(faction_id: String) -> int:
	if not WorldManager.factions.has(faction_id):
		return 0
	
	var faction = WorldManager.factions[faction_id]
	
	var influence = 0
	
	# 同盟数量
	for other_id in WorldManager.factions:
		if faction.is_ally(other_id):
			influence += 10
	
	# 领土数量
	influence += faction.territories.size()
	
	# 繁荣度
	influence += faction.get_total_prosperity() / 100
	
	# 成员数量
	influence += faction.members.size() * 5
	
	return influence

## 获取势力外交建议
func get_diplomatic_advice(faction_id: String) -> Dictionary:
	var advice = {
		"alliance_targets": [],
		"war_targets": [],
		"peace_targets": [],
		"threats": []
	}
	
	if not WorldManager.factions.has(faction_id):
		return advice
	
	var faction = WorldManager.factions[faction_id]
	
	for other_id in WorldManager.factions:
		if other_id == faction_id:
			continue
		
		var other_faction = WorldManager.factions[other_id]
		var relation = faction.get_relation(other_id)
		
		# 建议结盟目标
		if relation > 30 and not faction.is_ally(other_id) and not faction.is_enemy(other_id):
			advice.alliance_targets.append(other_id)
		
		# 建议战争目标
		if relation < -30 and not faction.is_enemy(other_id):
			advice.war_targets.append(other_id)
		
		# 建议议和目标
		if faction.is_enemy(other_id):
			advice.peace_targets.append(other_id)
		
		# 威胁势力
		if other_faction.get_total_strength() > faction.get_total_strength() * 1.5:
			advice.threats.append(other_id)
	
	return advice