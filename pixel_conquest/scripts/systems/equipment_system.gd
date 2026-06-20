extends Node

## 装备系统 - 管理装备逻辑

# 装备槽位定义
const EQUIPMENT_SLOTS = {
	"weapon": "武器",
	"head": "头部",
	"chest": "胸部",
	"hands": "手部",
	"feet": "脚部",
	"offhand": "副手",
	"accessory1": "饰品1",
	"accessory2": "饰品2"
}

# 装备稀有度定义
const RARITIES = {
	"common": {"name": "普通", "color": Color.WHITE, "multiplier": 1.0},
	"uncommon": {"name": "优秀", "color": Color(0.2, 0.8, 0.2), "multiplier": 1.2},
	"rare": {"name": "稀有", "color": Color(0.2, 0.4, 0.8), "multiplier": 1.5},
	"epic": {"name": "史诗", "color": Color(0.8, 0.4, 0.8), "multiplier": 2.0},
	"legendary": {"name": "传说", "color": Color(0.8, 0.6, 0.2), "multiplier": 3.0}
}

# 装备类型定义
const WEAPON_TYPES = {
	"sword": {"name": "剑", "category": "melee"},
	"spear": {"name": "矛", "category": "melee"},
	"axe": {"name": "斧", "category": "melee"},
	"bow": {"name": "弓", "category": "ranged"},
	"crossbow": {"name": "弩", "category": "ranged"},
	"staff": {"name": "杖", "category": "magic"}
}

const ARMOR_TYPES = {
	"helmet": {"name": "头盔", "slot": "head"},
	"chestplate": {"name": "胸甲", "slot": "chest"},
	"gauntlets": {"name": "护手", "slot": "hands"},
	"boots": {"name": "战靴", "slot": "feet"},
	"shield": {"name": "盾牌", "slot": "offhand"}
}

func _ready() -> void:
	print("EquipmentSystem initialized")

## 检查是否可以装备
func can_equip(character: Character, item: Dictionary, slot: String) -> bool:
	# 检查槽位是否有效
	if not EQUIPMENT_SLOTS.has(slot):
		return false
	
	# 检查等级需求
	if item.has("level_requirement"):
		if character.level < item.level_requirement:
			return false
	
	# 检查物品类型与槽位匹配
	if item.has("slot"):
		if item.slot != slot:
			return false
	
	# 检查双手武器
	if item.has("two_handed") and item.two_handed:
		if slot == "weapon":
			# 双手武器需要副手空置
			if character.equipment.offhand != null:
				return false
	
	return true

## 装备物品
func equip(character: Character, item: Dictionary, slot: String) -> Dictionary:
	if not can_equip(character, item, slot):
		return {"success": false, "message": "无法装备此物品"}
	
	# 从背包移除物品
	var item_id = item.get("id", "")
	if not character.has_item(item_id):
		return {"success": false, "message": "物品不在背包中"}
	
	# 卸下当前装备
	var old_equipment = character.equipment[slot]
	if old_equipment != null:
		character.add_item_to_inventory(old_equipment)
	
	# 装备新物品
	character.equipment[slot] = item
	character.remove_item_from_inventory(item_id)
	
	# 应用装备效果
	_apply_equipment_effects(character, item, slot)
	
	return {
		"success": true,
		"message": "成功装备 %s" % item.name,
		"old_equipment": old_equipment
	}

## 卸下装备
func unequip(character: Character, slot: String) -> Dictionary:
	if not EQUIPMENT_SLOTS.has(slot):
		return {"success": false, "message": "无效的槽位"}
	
	var equipment = character.equipment[slot]
	if equipment == null:
		return {"success": false, "message": "该槽位没有装备"}
	
	# 检查背包空间
	if character.inventory.size() >= 50:  # 最大背包容量
		return {"success": false, "message": "背包空间不足"}
	
	# 移除装备效果
	_remove_equipment_effects(character, equipment, slot)
	
	# 添加到背包
	character.add_item_to_inventory(equipment)
	character.equipment[slot] = null
	
	return {
		"success": true,
		"message": "成功卸下 %s" % equipment.name
	}

## 应用装备效果
func _apply_equipment_effects(character: Character, item: Dictionary, slot: String) -> void:
	# 武器效果
	if slot == "weapon":
		if item.has("damage"):
			# 攻击力加成已通过get_attack()计算
			pass
	
	# 护甲效果
	if ["head", "chest", "hands", "feet", "offhand"].has(slot):
		if item.has("defense"):
			# 防御力加成已通过get_defense()计算
			pass
	
	# 饰品效果
	if ["accessory1", "accessory2"].has(slot):
		if item.has("stat_bonus"):
			for stat in item.stat_bonus:
				# 属性加成已通过get_total_attribute()计算
				pass

## 移除装备效果
func _remove_equipment_effects(character: Character, item: Dictionary, slot: String) -> void:
	# 效果移除逻辑（实际上属性计算是动态的，不需要手动移除）
	pass

## 获取装备信息
func get_equipment_info(item: Dictionary) -> String:
	var info = item.name + "\n"
	
	# 稀有度
	if item.has("rarity"):
		info += "稀有度: " + RARITIES[item.rarity].name + "\n"
	
	# 属性
	if item.has("damage"):
		info += "攻击力: " + str(item.damage) + "\n"
	
	if item.has("defense"):
		info += "防御力: " + str(item.defense) + "\n"
	
	if item.has("speed"):
		info += "速度: " + str(item.speed) + "\n"
	
	if item.has("range"):
		info += "范围: " + str(item.range) + "\n"
	
	# 属性加成
	if item.has("stat_bonus"):
		info += "属性加成:\n"
		for stat in item.stat_bonus:
			info += "  " + stat + ": +" + str(item.stat_bonus[stat]) + "\n"
	
	# 等级需求
	if item.has("level_requirement"):
		info += "等级需求: " + str(item.level_requirement) + "\n"
	
	# 价值
	if item.has("value"):
		info += "价值: " + str(item.value) + " 金币\n"
	
	return info

## 获取角色总属性
func get_character_total_stats(character: Character) -> Dictionary:
	return {
		"attack": character.get_attack(),
		"defense": character.get_defense(),
		"speed": character.get_speed(),
		"strength": character.get_total_attribute("strength"),
		"agility": character.get_total_attribute("agility"),
		"intelligence": character.get_total_attribute("intelligence"),
		"charisma": character.get_total_attribute("charisma")
	}

## 比较装备
func compare_equipment(old_item: Dictionary, new_item: Dictionary) -> Dictionary:
	var comparison = {
		"damage_change": 0,
		"defense_change": 0,
		"speed_change": 0
	}
	
	if old_item != null and new_item != null:
		comparison.damage_change = new_item.get("damage", 0) - old_item.get("damage", 0)
		comparison.defense_change = new_item.get("defense", 0) - old_item.get("defense", 0)
		comparison.speed_change = new_item.get("speed", 1.0) - old_item.get("speed", 1.0)
	
	return comparison

## 生成随机装备
func generate_random_equipment(level: int, rarity: String = "") -> Dictionary:
	# 根据等级选择稀有度
	if rarity.is_empty():
		var rarity_roll = randf()
		if rarity_roll < 0.5:
			rarity = "common"
		elif rarity_roll < 0.8:
			rarity = "uncommon"
		elif rarity_roll < 0.95:
			rarity = "rare"
		elif rarity_roll < 0.99:
			rarity = "epic"
		else:
			rarity = "legendary"
	
	# 随机选择装备类型
	var type_roll = randf()
	if type_roll < 0.4:
		# 武器
		return DataManager.get_random_weapon(rarity)
	elif type_roll < 0.8:
		# 护甲
		return DataManager.get_random_armor(rarity)
	else:
		# 饰品
		return DataManager.accessories.values()[randi() % DataManager.accessories.size()]

## 销毁装备（获取材料）
func destroy_equipment(item: Dictionary) -> Dictionary:
	var materials = {}
	
	# 根据稀有度返回材料
	var rarity = item.get("rarity", "common")
	var multiplier = RARITIES[rarity].multiplier
	
	materials["material_iron"] = int(5 * multiplier)
	materials["material_wood"] = int(2 * multiplier)
	materials["material_leather"] = int(1 * multiplier)
	
	return materials