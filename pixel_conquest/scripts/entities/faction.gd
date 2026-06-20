class_name Faction
extends Resource

## 势力类 - 管理势力数据

# 基础属性
@export var id: String = ""
@export var name: String = ""
@export var color: Color = Color.WHITE

# 领袖
@export var leader_id: String = ""

# 成员列表 [character_id]
@export var members: Array = []

# 领土列表 [location_id]
@export var territories: Array = []

# 与其他势力的关系 {faction_id: relation}
# -100: 敌对, 0: 中立, 100: 同盟
@export var relations: Dictionary = {}

# 势力资源
@export var treasury: int = 10000  # 金库
@export var food: int = 1000       # 粮食
@export var materials: int = 500   # 材料

# 势力政策
@export var policy: Dictionary = {
	"tax_rate": 0.1,           # 税率
	"military_focus": 0.5,     # 军事重心
	"trade_focus": 0.5,       # 贸易重心
	"expansion_policy": "balanced"  # 扩张政策
}

# 势力状态
@export var is_active: bool = true
@export var days_existed: int = 0

## 初始化势力
func initialize(faction_id: String, faction_name: String, faction_color: Color) -> void:
	id = faction_id
	name = faction_name
	color = faction_color
	is_active = true

## 添加成员
func add_member(character_id: String) -> void:
	if not members.has(character_id):
		members.append(character_id)

## 移除成员
func remove_member(character_id: String) -> void:
	members.erase(character_id)

## 添加领土
func add_territory(location_id: String) -> void:
	if not territories.has(location_id):
		territories.append(location_id)

## 移除领土
func remove_territory(location_id: String) -> void:
	territories.erase(location_id)

## 获取关系
func get_relation(faction_id: String) -> int:
	return relations.get(faction_id, 0)

## 设置关系
func set_relation(faction_id: String, value: int) -> void:
	relations[faction_id] = clamp(value, -100, 100)

## 修改关系
func modify_relation(faction_id: String, change: int) -> void:
	var current = get_relation(faction_id)
	set_relation(faction_id, current + change)

## 检查是否敌对
func is_enemy(faction_id: String) -> bool:
	return get_relation(faction_id) < -50

## 检查是否同盟
func is_ally(faction_id: String) -> bool:
	return get_relation(faction_id) > 50

## 检查是否中立
func is_neutral(faction_id: String) -> bool:
	var relation = get_relation(faction_id)
	return relation >= -50 and relation <= 50

## 宣战
func declare_war(faction_id: String) -> void:
	set_relation(faction_id, -100)
	
	# 通知对方
	if WorldManager.factions.has(faction_id):
		var enemy_faction = WorldManager.factions[faction_id]
		enemy_faction.set_relation(id, -100)

## 议和
func make_peace(faction_id: String) -> void:
	set_relation(faction_id, 0)
	
	# 通知对方
	if WorldManager.factions.has(faction_id):
		var enemy_faction = WorldManager.factions[faction_id]
		enemy_faction.set_relation(id, 0)

## 结盟
func form_alliance(faction_id: String) -> void:
	set_relation(faction_id, 100)
	
	# 通知对方
	if WorldManager.factions.has(faction_id):
		var ally_faction = WorldManager.factions[faction_id]
		ally_faction.set_relation(id, 100)

## 解除同盟
func break_alliance(faction_id: String) -> void:
	set_relation(faction_id, 0)
	
	# 通知对方
	if WorldManager.factions.has(faction_id):
		var ally_faction = WorldManager.factions[faction_id]
		ally_faction.set_relation(id, 0)

## 每日更新
func daily_update() -> void:
	if not is_active:
		return
	
	days_existed += 1
	
	# 收税
	var tax_income = _calculate_tax_income()
	treasury += tax_income
	
	# 支出
	var expenses = _calculate_expenses()
	treasury -= expenses
	
	# 粮食消耗
	var food_consumption = _calculate_food_consumption()
	food -= food_consumption
	
	# 粮食不足，士气下降
	if food < 0:
		food = 0
		_morale_penalty()
	
	# 检查是否灭亡
	if territories.is_empty() and members.is_empty():
		is_active = false

## 计算税收收入
func _calculate_tax_income() -> int:
	var total_tax = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			total_tax += location.collect_tax()
	
	return total_tax

## 计算支出
func _calculate_expenses() -> int:
	var total_expenses = 0
	
	# 驻军维护费
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			var garrison_count = location.get_garrison_count()
			total_expenses += garrison_count * 2  # 每个士兵每天2金币
	
	# 成员薪水
	total_expenses += members.size() * 50  # 每个领主每天50金币
	
	return total_expenses

## 计算粮食消耗
func _calculate_food_consumption() -> int:
	var total_consumption = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			var garrison_count = location.get_garrison_count()
			total_consumption += garrison_count
			total_consumption += int(location.population * 0.01)
	
	return total_consumption

## 士气惩罚
func _morale_penalty() -> void:
	# 粮食不足，关系下降
	for faction_id in relations:
		if relations[faction_id] > 0:
			modify_relation(faction_id, -1)

## 获取总兵力
func get_total_military() -> int:
	var total = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			total += location.get_garrison_count()
	
	return total

## 获取总战斗力
func get_total_strength() -> int:
	var total = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			total += location.get_garrison_strength()
	
	return total

## 获取总繁荣度
func get_total_prosperity() -> int:
	var total = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			total += location.prosperity
	
	return total

## 获取总人口
func get_total_population() -> int:
	var total = 0
	
	for location_id in territories:
		if WorldManager.locations.has(location_id):
			var location = WorldManager.locations[location_id]
			total += location.population
	
	return total

## 序列化为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"color": {"r": color.r, "g": color.g, "b": color.b, "a": color.a},
		"leader_id": leader_id,
		"members": members,
		"territories": territories,
		"relations": relations,
		"treasury": treasury,
		"food": food,
		"materials": materials,
		"policy": policy,
		"is_active": is_active,
		"days_existed": days_existed
	}

## 从字典反序列化
func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "")
	
	var color_data = data.get("color", {"r": 1, "g": 1, "b": 1, "a": 1})
	color = Color(color_data.r, color_data.g, color_data.b, color_data.a)
	
	leader_id = data.get("leader_id", "")
	members = data.get("members", [])
	territories = data.get("territories", [])
	relations = data.get("relations", {})
	treasury = data.get("treasury", 10000)
	food = data.get("food", 1000)
	materials = data.get("materials", 500)
	policy = data.get("policy", {})
	is_active = data.get("is_active", true)
	days_existed = data.get("days_existed", 0)