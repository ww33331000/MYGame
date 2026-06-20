class_name Location
extends Resource

## 地点类 - 管理城镇、城堡、村庄数据

# 地点类型
enum Type {
	TOWN,
	CASTLE,
	VILLAGE
}

# 基础属性
@export var id: String = ""
@export var name: String = ""
@export var type: Type = Type.VILLAGE

# 位置
@export var position: Vector2 = Vector2.ZERO

# 所属势力
@export var owner_faction: String = ""

# 父地点（村庄所属的城镇/城堡）
@export var parent_location: String = ""

# 关联村庄（城镇/城堡关联的村庄）
@export var linked_villages: Array = []

# 繁荣度 (0-100)
@export var prosperity: int = 50

# 人口
@export var population: int = 100

# 驻军 [{troop_id, level, count}]
@export var garrison: Array = []

# 商品库存 {item_id: {price, count}}
@export var market: Dictionary = {}

# 生产资源
@export var production: Dictionary = {}

# 建筑列表
@export var buildings: Array = []

# 领主ID
@export var lord_id: String = ""

# 税收
@export var tax_rate: float = 0.1

# 被围攻状态
@export var is_under_siege: bool = false
@export var siege_days: int = 0

## 初始化地点
func initialize(loc_id: String, loc_name: String, loc_type: Type) -> void:
	id = loc_id
	name = loc_name
	type = loc_type
	
	# 根据类型设置默认值
	match type:
		Type.TOWN:
			population = randi_range(1000, 5000)
			prosperity = randi_range(60, 100)
			_initialize_town_market()
		Type.CASTLE:
			population = randi_range(200, 800)
			prosperity = randi_range(30, 60)
		Type.VILLAGE:
			population = randi_range(50, 300)
			prosperity = randi_range(10, 40)
			_initialize_village_production()

## 初始化城镇市场
func _initialize_town_market() -> void:
	# 添加基础商品
	for item_id in DataManager.items:
		var item = DataManager.items[item_id]
		market[item_id] = {
			"price": int(item.value * randf_range(0.8, 1.2)),
			"count": randi_range(10, 50)
		}
	
	# 添加装备
	for i in range(5):
		var weapon = DataManager.get_random_weapon()
		if not weapon.is_empty():
			market[weapon.id] = {
				"price": weapon.value,
				"count": 1,
				"item": weapon
			}
		
		var armor = DataManager.get_random_armor()
		if not armor.is_empty():
			market[armor.id] = {
				"price": armor.value,
				"count": 1,
				"item": armor
			}

## 初始化村庄生产
func _initialize_village_production() -> void:
	# 随机选择生产类型
	var production_types = ["food", "material_iron", "material_wood", "material_leather"]
	var selected = production_types[randi() % production_types.size()]
	
	production[selected] = {
		"rate": randi_range(5, 15),  # 每天产量
		"stored": randi_range(0, 50)
	}

## 获取类型名称
func get_type_name() -> String:
	match type:
		Type.TOWN:
			return "城镇"
		Type.CASTLE:
			return "城堡"
		Type.VILLAGE:
			return "村庄"
	return "未知"

## 获取驻军总数
func get_garrison_count() -> int:
	var total = 0
	for troop in garrison:
		total += troop.count
	return total

## 获取驻军战斗力
func get_garrison_strength() -> int:
	var strength = 0
	for troop in garrison:
		var troop_data = DataManager.troops.get(troop.troop_id, {})
		if not troop_data.is_empty():
			strength += troop_data.get("health", 50) * troop.count
			strength += troop_data.get("attack", 10) * troop.count
	return strength

## 添加驻军
func add_garrison(troop_id: String, count: int) -> void:
	for troop in garrison:
		if troop.troop_id == troop_id:
			troop.count += count
			return
	
	garrison.append({"troop_id": troop_id, "count": count})

## 移除驻军
func remove_garrison(troop_id: String, count: int) -> bool:
	for i in range(garrison.size()):
		if garrison[i].troop_id == troop_id:
			if garrison[i].count <= count:
				garrison.remove_at(i)
			else:
				garrison[i].count -= count
			return true
	return false

## 每日更新
func daily_update() -> void:
	# 繁荣度变化
	var prosperity_change = randi_range(-2, 3)
	if is_under_siege:
		prosperity_change -= 5
	
	prosperity = clamp(prosperity + prosperity_change, 0, 100)
	
	# 人口变化
	var population_change = int(population * 0.001 * (prosperity - 50) / 100.0)
	population = max(10, population + population_change)
	
	# 生产资源
	for prod_type in production:
		production[prod_type].stored += production[prod_type].rate
	
	# 市场更新
	_update_market()

## 更新市场
func _update_market() -> void:
	if type != Type.TOWN:
		return
	
	# 补充商品
	for item_id in market:
		market[item_id].count = min(market[item_id].count + randi_range(1, 5), 100)
	
	# 价格波动
	for item_id in market:
		var price_change = randf_range(-0.1, 0.1)
		var base_price = DataManager.items.get(item_id, {}).get("value", 100)
		market[item_id].price = int(base_price * (1.0 + price_change))

## 购买商品
func buy_item(item_id: String, count: int) -> Dictionary:
	if not market.has(item_id):
		return {"success": false, "message": "商品不存在"}
	
	if market[item_id].count < count:
		return {"success": false, "message": "库存不足"}
	
	var total_price = market[item_id].price * count
	
	market[item_id].count -= count
	if market[item_id].count <= 0:
		market.erase(item_id)
	
	return {
		"success": true,
		"total_price": total_price,
		"item_id": item_id,
		"count": count
	}

## 出售商品
func sell_item(item_id: String, item_data: Dictionary, count: int) -> int:
	var base_price = item_data.get("value", 50)
	var sell_price = int(base_price * 0.7)  # 70% 基础价格
	
	if market.has(item_id):
		market[item_id].count += count
	else:
		market[item_id] = {
			"price": sell_price,
			"count": count,
			"item": item_data
		}
	
	return sell_price * count

## 收税
func collect_tax() -> int:
	var tax = int(population * prosperity * tax_rate / 100.0)
	return tax

## 开始围攻
func start_siege() -> void:
	is_under_siege = true
	siege_days = 0

## 结束围攻
func end_siege() -> void:
	is_under_siege = false
	siege_days = 0

## 围攻更新
func siege_update() -> void:
	if is_under_siege:
		siege_days += 1
		# 驻军士气下降，可能投降
		if siege_days > 30:
			# 长期围攻，驻军可能投降
			if randf() < 0.1:
				surrender()

## 投降
func surrender() -> void:
	is_under_siege = false
	siege_days = 0
	garrison.clear()

## 检查是否可以建造
func can_build(building_id: String) -> bool:
	if buildings.has(building_id):
		return false
	return true

## 建造建筑
func build(building_id: String) -> bool:
	if not can_build(building_id):
		return false
	
	buildings.append(building_id)
	
	# 建筑效果
	match building_id:
		"market":
			prosperity += 10
		"barracks":
			pass  # 增加驻军上限
		"wall":
			pass  # 增加防御
	
	return true

## 序列化为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"type": type,
		"position": {"x": position.x, "y": position.y},
		"owner_faction": owner_faction,
		"parent_location": parent_location,
		"linked_villages": linked_villages,
		"prosperity": prosperity,
		"population": population,
		"garrison": garrison,
		"market": market,
		"production": production,
		"buildings": buildings,
		"lord_id": lord_id,
		"tax_rate": tax_rate,
		"is_under_siege": is_under_siege,
		"siege_days": siege_days
	}

## 从字典反序列化
func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "")
	type = data.get("type", Type.VILLAGE)
	
	var pos = data.get("position", {"x": 0, "y": 0})
	position = Vector2(pos.x, pos.y)
	
	owner_faction = data.get("owner_faction", "")
	parent_location = data.get("parent_location", "")
	linked_villages = data.get("linked_villages", [])
	prosperity = data.get("prosperity", 50)
	population = data.get("population", 100)
	garrison = data.get("garrison", [])
	market = data.get("market", {})
	production = data.get("production", {})
	buildings = data.get("buildings", [])
	lord_id = data.get("lord_id", "")
	tax_rate = data.get("tax_rate", 0.1)
	is_under_siege = data.get("is_under_siege", false)
	siege_days = data.get("siege_days", 0)