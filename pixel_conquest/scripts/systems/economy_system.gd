extends Node

## 经济系统 - 管理贸易、商队和打造

# 贸易价格波动范围
const PRICE_VARIATION_MIN: float = 0.7
const PRICE_VARIATION_MAX: float = 1.3

# 商队配置
const CARAVAN_BASE_SPEED: float = 0.7
const CARAVAN_BASE_CAPACITY: int = 100
const CARAVAN_PROFIT_MARGIN: float = 0.2

# 打造材料需求
const CRAFTING_MATERIALS = {
	"weapon": {
		"material_iron": 5,
		"material_wood": 2
	},
	"armor": {
		"material_iron": 3,
		"material_leather": 2
	},
	"accessory": {
		"material_iron": 1,
		"material_wood": 1
	}
}

func _ready() -> void:
	print("EconomySystem initialized")

## 购买商品
func buy_item(location: Location, item_id: String, count: int, buyer: Character) -> Dictionary:
	if not location.market.has(item_id):
		return {"success": false, "message": "商品不存在"}
	
	var market_item = location.market[item_id]
	if market_item.count < count:
		return {"success": false, "message": "库存不足"}
	
	# 计算价格
	var trade_skill = buyer.skills.get("trade", 0)
	var price_modifier = 1.0 - trade_skill * 0.03  # 每级贸易技能减少3%价格
	var total_price = int(market_item.price * count * price_modifier)
	
	# 检查金币是否足够
	if buyer.gold < total_price:
		return {"success": false, "message": "金币不足"}
	
	# 执行购买
	var result = location.buy_item(item_id, count)
	if result.success:
		buyer.modify_gold(-total_price)
		
		# 添加到买家背包
		if market_item.has("item"):
			buyer.add_item_to_inventory(market_item.item, count)
		else:
			buyer.add_item_to_inventory({"id": item_id, "value": DataManager.items.get(item_id, {}).get("value", 50)}, count)
		
		EventManager.trigger_event("item_picked_up", {"item_id": item_id, "count": count})
	
	return {
		"success": true,
		"message": "购买成功",
		"total_price": total_price,
		"items": [{"id": item_id, "count": count}]
	}

## 出售商品
func sell_item(location: Location, item_id: String, item_data: Dictionary, count: int, seller: Character) -> Dictionary:
	# 检查是否有该物品
	if not seller.has_item(item_id, count):
		return {"success": false, "message": "物品不足"}
	
	# 计算价格
	var trade_skill = seller.skills.get("trade", 0)
	var price_modifier = 1.0 + trade_skill * 0.03  # 每级贸易技能增加3%价格
	var total_price = int(location.sell_item(item_id, item_data, count) * price_modifier)
	
	# 执行出售
	seller.remove_item_from_inventory(item_id, count)
	seller.modify_gold(total_price)
	
	EventManager.trigger_event("item_dropped", {"item_id": item_id, "count": count})
	
	return {
		"success": true,
		"message": "出售成功",
		"total_price": total_price
	}

## 获取商品价格信息
func get_price_info(location: Location, item_id: String) -> Dictionary:
	if not location.market.has(item_id):
		return {}
	
	var market_item = location.market[item_id]
	var base_price = DataManager.items.get(item_id, {}).get("value", 50)
	
	return {
		"current_price": market_item.price,
		"base_price": base_price,
		"price_ratio": market_item.price / base_price,
		"stock": market_item.count
	}

## 比较不同地点的商品价格
func compare_prices(item_id: String) -> Dictionary:
	var prices = {}
	
	for location_id in WorldManager.locations:
		var location = WorldManager.locations[location_id]
		if location.type == Location.Type.TOWN and location.market.has(item_id):
			prices[location_id] = get_price_info(location, item_id)
	
	# 找出最低和最高价格
	var min_price_location = ""
	var max_price_location = ""
	var min_price = INF
	var max_price = 0
	
	for location_id in prices:
		var price = prices[location_id].current_price
		if price < min_price:
			min_price = price
			min_price_location = location_id
		if price > max_price:
			max_price = price
			max_price_location = location_id
	
	return {
		"prices": prices,
		"min_price_location": min_price_location,
		"max_price_location": max_price_location,
		"profit_potential": max_price - min_price
	}

## 创建商队
func create_caravan(owner: Character, start_location: String) -> Party:
	var caravan = Party.new()
	caravan.id = "caravan_%d" % Time.get_ticks_msec()
	caravan.name = "%s的商队" % owner.name
	caravan.type = Party.Type.CARAVAN
	caravan.owner_id = owner.id
	caravan.faction_id = owner.faction_id
	caravan.position = WorldManager.locations[start_location].position
	caravan.base_speed = CARAVAN_BASE_SPEED
	
	# 添加护卫
	caravan.add_troops("troop_1", 5)  # 5个正规军护卫
	
	WorldManager.parties[caravan.id] = caravan
	EventManager.trigger_event("party_created", {"party_id": caravan.id})
	
	return caravan

## 商队贸易
func caravan_trade(caravan: Party, location: Location) -> Dictionary:
	var trade_result = {
		"profit": 0,
		"items_sold": [],
		"items_bought": []
	}
	
	# 出售商队携带的物品
	for item in caravan.inventory:
		var item_data = DataManager.items.get(item.item_id, {})
		if not item_data.is_empty():
			var sell_result = sell_item(location, item.item_id, item_data, item.count, GameManager.player)
			if sell_result.success:
				trade_result.profit += sell_result.total_price
				trade_result.items_sold.append({"id": item.item_id, "count": item.count, "price": sell_result.total_price})
				caravan.remove_item(item.item_id, item.count)
	
	# 购买新物品
	# 分析最佳商品
	var best_items = _analyze_best_trade_items(location)
	for item_info in best_items:
		var buy_count = min(item_info.recommended_count, CARAVAN_BASE_CAPACITY - caravan.inventory.size())
		if buy_count > 0:
			var buy_result = buy_item(location, item_info.item_id, buy_count, GameManager.player)
			if buy_result.success:
				trade_result.items_bought.append({"id": item_info.item_id, "count": buy_count})
	
	return trade_result

## 分析最佳贸易商品
func _analyze_best_trade_items(location: Location) -> Array:
	var recommendations = []
	
	for item_id in location.market:
		var price_info = get_price_info(location, item_id)
		
		# 如果价格低于基础价格，推荐购买
		if price_info.price_ratio < 0.9:
			var price_comparison = compare_prices(item_id)
			var profit_potential = price_comparison.profit_potential
			
			if profit_potential > 20:  # 有足够利润空间
				recommendations.append({
					"item_id": item_id,
					"current_price": price_info.current_price,
					"profit_potential": profit_potential,
					"recommended_count": min(price_info.stock, 20)
				})
	
	# 按利润潜力排序
	recommendations.sort_custom(func(a, b): return a.profit_potential > b.profit_potential)
	
	return recommendations

## 打造装备
func craft_equipment(crafter: Character, equipment_type: String, rarity: String) -> Dictionary:
	# 检查锻造技能
	var smithing_level = crafter.skills.get("smithing", 0)
	
	# 检查稀有度是否可达
	var rarity_levels = {"common": 0, "uncommon": 2, "rare": 4, "epic": 6, "legendary": 8}
	if smithing_level < rarity_levels.get(rarity, 0):
		return {"success": false, "message": "锻造技能不足"}
	
	# 检查材料
	var materials_needed = CRAFTING_MATERIALS.get(equipment_type, {})
	for material_id in materials_needed:
		var needed_count = materials_needed[material_id] * (rarity_levels[rarity] + 1)
		if not crafter.has_item(material_id, needed_count):
			return {"success": false, "message": "材料不足: %s" % material_id}
	
	# 消耗材料
	for material_id in materials_needed:
		var needed_count = materials_needed[material_id] * (rarity_levels[rarity] + 1)
		crafter.remove_item_from_inventory(material_id, needed_count)
	
	# 生成装备
	var equipment = EquipmentSystem.generate_random_equipment(crafter.level, rarity)
	equipment.rarity = rarity
	
	# 添加到背包
	crafter.add_item_to_inventory(equipment)
	
	# 增加锻造经验
	crafter.add_experience(50 * (rarity_levels[rarity] + 1))
	
	return {
		"success": true,
		"message": "成功打造 %s" % equipment.name,
		"equipment": equipment
	}

## 升级装备
func upgrade_equipment(crafter: Character, equipment: Dictionary) -> Dictionary:
	# 检查锻造技能
	var smithing_level = crafter.skills.get("smithing", 0)
	
	# 检查当前稀有度
	var current_rarity = equipment.get("rarity", "common")
	var rarity_levels = {"common": 0, "uncommon": 1, "rare": 2, "epic": 3, "legendary": 4}
	var current_level = rarity_levels[current_rarity]
	
	# 检查是否可以升级
	if current_level >= 4:
		return {"success": false, "message": "装备已达最高等级"}
	
	if smithing_level < current_level + 3:
		return {"success": false, "message": "锻造技能不足"}
	
	# 检查材料
	var equipment_type = "weapon" if equipment.has("damage") else "armor"
	var materials_needed = CRAFTING_MATERIALS.get(equipment_type, {})
	
	for material_id in materials_needed:
		var needed_count = materials_needed[material_id] * (current_level + 2)
		if not crafter.has_item(material_id, needed_count):
			return {"success": false, "message": "材料不足: %s" % material_id}
	
	# 消耗材料
	for material_id in materials_needed:
		var needed_count = materials_needed[material_id] * (current_level + 2)
		crafter.remove_item_from_inventory(material_id, needed_count)
	
	# 升级装备
	var new_rarity_levels = ["common", "uncommon", "rare", "epic", "legendary"]
	var new_rarity = new_rarity_levels[current_level + 1]
	
	var rarity_multipliers = [1.0, 1.2, 1.5, 2.0, 3.0]
	var new_multiplier = rarity_multipliers[current_level + 1]
	
	# 更新装备属性
	if equipment.has("damage"):
		equipment.damage = int(equipment.damage * new_multiplier / rarity_multipliers[current_level])
	if equipment.has("defense"):
		equipment.defense = int(equipment.defense * new_multiplier / rarity_multipliers[current_level])
	if equipment.has("value"):
		equipment.value = int(equipment.value * new_multiplier / rarity_multipliers[current_level])
	
	equipment.rarity = new_rarity
	
	# 增加锻造经验
	crafter.add_experience(100 * (current_level + 1))
	
	return {
		"success": true,
		"message": "装备升级成功",
		"equipment": equipment
	}

## 计算贸易路线利润
func calculate_trade_route_profit(start_location: Location, end_location: Location) -> int:
	var total_profit = 0
	
	# 分析两地商品价格差异
	for item_id in start_location.market:
		if end_location.market.has(item_id):
			var start_price = start_location.market[item_id].price
			var end_price = end_location.market[item_id].price
			
			if end_price > start_price:
				var profit_per_item = end_price - start_price
				var max_quantity = min(start_location.market[item_id].count, CARAVAN_BASE_CAPACITY)
				total_profit += profit_per_item * max_quantity
	
	return total_profit

## 获取最佳贸易路线
func find_best_trade_route() -> Dictionary:
	var best_route = {
		"start_location": "",
		"end_location": "",
		"profit": 0,
		"distance": 0
	}
	
	var towns = WorldManager.locations.values().filter(func(loc): return loc.type == Location.Type.TOWN)
	
	for start_town in towns:
		for end_town in towns:
			if start_town.id == end_town.id:
				continue
			
			var profit = calculate_trade_route_profit(start_town, end_town)
			var distance = start_town.position.distance_to(end_town.position)
			
			# 考虑距离成本
			var net_profit = profit - distance * 0.1  # 每单位距离成本0.1金币
			
			if net_profit > best_route.profit:
				best_route.start_location = start_town.id
				best_route.end_location = end_town.id
				best_route.profit = net_profit
				best_route.distance = distance
	
	return best_route