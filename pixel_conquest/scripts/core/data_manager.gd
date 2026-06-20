extends Node

## 数据管理器 - 管理游戏静态数据
## 单例自动加载

# 装备数据
var weapons: Dictionary = {}
var armors: Dictionary = {}
var accessories: Dictionary = {}
var items: Dictionary = {}

# 技能数据
var skills: Dictionary = {}

# 兵种数据
var troops: Dictionary = {}

# 任务模板
var quest_templates: Dictionary = {}

func _ready() -> void:
	load_all_data()
	print("DataManager initialized")

## 加载所有数据
func load_all_data() -> void:
	_load_weapons()
	_load_armors()
	_load_accessories()
	_load_items()
	_load_skills()
	_load_troops()
	_load_quest_templates()

## 加载武器数据
func _load_weapons() -> void:
	# 武器类型：剑、枪、斧、弓、弩、法杖
	var weapon_types = {
		"sword": {"damage": 25, "speed": 1.0, "range": 1.0, "two_handed": false},
		"spear": {"damage": 30, "speed": 0.8, "range": 1.5, "two_handed": true},
		"axe": {"damage": 35, "speed": 0.7, "range": 0.9, "two_handed": false},
		"bow": {"damage": 20, "speed": 0.9, "range": 3.0, "two_handed": true, "ranged": true},
		"crossbow": {"damage": 40, "speed": 0.5, "range": 3.5, "two_handed": true, "ranged": true},
		"staff": {"damage": 15, "speed": 1.1, "range": 1.2, "two_handed": true, "magic": true}
	}
	
	var rarities = ["common", "uncommon", "rare", "epic", "legendary"]
	var rarity_multipliers = [1.0, 1.2, 1.5, 2.0, 3.0]
	
	var weapon_id = 0
	for type in weapon_types:
		for rarity_index in range(rarities.size()):
			var weapon = {
				"id": "weapon_%d" % weapon_id,
				"name": _generate_weapon_name(type, rarities[rarity_index]),
				"type": type,
				"rarity": rarities[rarity_index],
				"damage": int(weapon_types[type].damage * rarity_multipliers[rarity_index]),
				"speed": weapon_types[type].speed,
				"range": weapon_types[type].range,
				"two_handed": weapon_types[type].two_handed,
				"ranged": weapon_types[type].get("ranged", false),
				"magic": weapon_types[type].get("magic", false),
				"value": int(100 * rarity_multipliers[rarity_index]),
				"level_requirement": rarity_index * 5
			}
			weapons[weapon.id] = weapon
			weapon_id += 1

## 加载护甲数据
func _load_armors() -> void:
	var armor_types = {
		"helmet": {"defense": 10, "slot": "head"},
		"chestplate": {"defense": 30, "slot": "chest"},
		"gauntlets": {"defense": 8, "slot": "hands"},
		"boots": {"defense": 12, "slot": "feet"},
		"shield": {"defense": 20, "slot": "offhand"}
	}
	
	var rarities = ["common", "uncommon", "rare", "epic", "legendary"]
	var rarity_multipliers = [1.0, 1.2, 1.5, 2.0, 3.0]
	
	var armor_id = 0
	for type in armor_types:
		for rarity_index in range(rarities.size()):
			var armor = {
				"id": "armor_%d" % armor_id,
				"name": _generate_armor_name(type, rarities[rarity_index]),
				"type": type,
				"rarity": rarities[rarity_index],
				"defense": int(armor_types[type].defense * rarity_multipliers[rarity_index]),
				"slot": armor_types[type].slot,
				"value": int(80 * rarity_multipliers[rarity_index]),
				"level_requirement": rarity_index * 5
			}
			armors[armor.id] = armor
			armor_id += 1

## 加载饰品数据
func _load_accessories() -> void:
	var accessory_types = ["ring", "amulet", "belt", "cloak"]
	var stats = ["strength", "agility", "intelligence", "charisma"]
	
	var rarities = ["common", "uncommon", "rare", "epic", "legendary"]
	var rarity_multipliers = [1.0, 1.5, 2.0, 3.0, 4.0]
	
	var acc_id = 0
	for type in accessory_types:
		for stat in stats:
			for rarity_index in range(rarities.size()):
				var accessory = {
					"id": "accessory_%d" % acc_id,
					"name": "%s的%s" % [stat.capitalize(), _get_accessory_name(type)],
					"type": type,
					"rarity": rarities[rarity_index],
					"stat_bonus": {stat: int(3 * rarity_multipliers[rarity_index])},
					"value": int(60 * rarity_multipliers[rarity_index]),
					"level_requirement": rarity_index * 3
				}
				accessories[accessory.id] = accessory
				acc_id += 1

## 加载物品数据
func _load_items() -> void:
	var item_types = {
		"food": {"name": "食物", "value": 10, "stackable": true},
		"medicine": {"name": "药品", "value": 50, "stackable": true},
		"material_iron": {"name": "铁矿石", "value": 30, "stackable": true},
		"material_wood": {"name": "木材", "value": 20, "stackable": true},
		"material_leather": {"name": "皮革", "value": 25, "stackable": true},
		"trade_good_spice": {"name": "香料", "value": 200, "stackable": true},
		"trade_good_silk": {"name": "丝绸", "value": 150, "stackable": true},
		"trade_good_wine": {"name": "葡萄酒", "value": 100, "stackable": true}
	}
	
	for id in item_types:
		items[id] = {
			"id": id,
			"name": item_types[id].name,
			"value": item_types[id].value,
			"stackable": item_types[id].stackable
		}

## 加载技能数据
func _load_skills() -> void:
	var skill_categories = {
		"combat": {
			"sword_mastery": {"name": "剑术精通", "max_level": 10, "effect": "剑类武器伤害+5%/级"},
			"archery": {"name": "箭术", "max_level": 10, "effect": "弓箭伤害+5%/级"},
			"riding": {"name": "骑术", "max_level": 10, "effect": "骑马速度+3%/级"},
			"athletics": {"name": "运动", "max_level": 10, "effect": "移动速度+2%/级"},
			"shield": {"name": "盾牌", "max_level": 10, "effect": "盾牌防御+5%/级"}
		},
		"leader": {
			"leadership": {"name": "统御", "max_level": 10, "effect": "部队上限+10/级"},
			"persuasion": {"name": "说服", "max_level": 10, "effect": "说服成功率+5%/级"},
			"tactics": {"name": "战术", "max_level": 10, "effect": "战斗优势+3%/级"},
			"trade": {"name": "贸易", "max_level": 10, "effect": "买卖价格+3%/级"}
		},
		"craft": {
			"smithing": {"name": "锻造", "max_level": 10, "effect": "可打造更高级装备"},
			"engineering": {"name": "工程", "max_level": 10, "effect": "建造速度+5%/级"}
		}
	}
	
	for category in skill_categories:
		for skill_id in skill_categories[category]:
			skills[skill_id] = {
				"id": skill_id,
				"category": category,
				"name": skill_categories[category][skill_id].name,
				"max_level": skill_categories[category][skill_id].max_level,
				"effect": skill_categories[category][skill_id].effect
			}

## 加载兵种数据
func _load_troops() -> void:
	var troop_tiers = ["recruit", "regular", "veteran", "elite", "champion"]
	var troop_types = ["infantry", "archer", "cavalry"]
	
	var troop_id = 0
	for type in troop_types:
		for tier_index in range(troop_tiers.size()):
			var troop = {
				"id": "troop_%d" % troop_id,
				"name": _get_troop_name(type, troop_tiers[tier_index]),
				"type": type,
				"tier": tier_index + 1,
				"level": (tier_index + 1) * 5,
				"health": 50 + tier_index * 20,
				"attack": 10 + tier_index * 5,
				"defense": 5 + tier_index * 3,
				"speed": 1.0 + tier_index * 0.1,
				"cost": 10 + tier_index * 10,
				"upgrade_cost": 50 + tier_index * 50
			}
			troops[troop.id] = troop
			troop_id += 1

## 加载任务模板
func _load_quest_templates() -> void:
	quest_templates = {
		"deliver": {
			"id": "deliver",
			"name": "运送货物",
			"description": "将货物从{from}运送到{to}",
			"reward_gold": [100, 500],
			"reward_exp": [50, 200],
			"time_limit": [3, 7]
		},
		"escort": {
			"id": "escort",
			"name": "护送任务",
			"description": "护送商队安全到达{destination}",
			"reward_gold": [200, 800],
			"reward_exp": [100, 300],
			"time_limit": [5, 10]
		},
		"hunt_bandits": {
			"id": "hunt_bandits",
			"name": "剿匪任务",
			"description": "消灭在{location}附近活动的匪徒",
			"reward_gold": [300, 1000],
			"reward_exp": [150, 400],
			"time_limit": [7, 14]
		},
		"rescue": {
			"id": "rescue",
			"name": "营救任务",
			"description": "从{location}营救被俘的{npc_name}",
			"reward_gold": [500, 1500],
			"reward_exp": [200, 500],
			"time_limit": [5, 10]
		},
		"conquer": {
			"id": "conquer",
			"name": "攻城任务",
			"description": "攻占{location}",
			"reward_gold": [1000, 5000],
			"reward_exp": [500, 1500],
			"time_limit": [14, 30]
		}
	}

## 生成武器名称
func _generate_weapon_name(type: String, rarity: String) -> String:
	var prefixes = {
		"common": "",
		"uncommon": "精制",
		"rare": "稀有",
		"epic": "史诗",
		"legendary": "传说"
	}
	
	var type_names = {
		"sword": "长剑",
		"spear": "长矛",
		"axe": "战斧",
		"bow": "长弓",
		"crossbow": "弩",
		"staff": "法杖"
	}
	
	return prefixes[rarity] + type_names[type]

## 生成护甲名称
func _generate_armor_name(type: String, rarity: String) -> String:
	var prefixes = {
		"common": "",
		"uncommon": "精制",
		"rare": "稀有",
		"epic": "史诗",
		"legendary": "传说"
	}
	
	var type_names = {
		"helmet": "头盔",
		"chestplate": "胸甲",
		"gauntlets": "护手",
		"boots": "战靴",
		"shield": "盾牌"
	}
	
	return prefixes[rarity] + type_names[type]

## 获取饰品名称
func _get_accessory_name(type: String) -> String:
	var names = {
		"ring": "戒指",
		"amulet": "项链",
		"belt": "腰带",
		"cloak": "披风"
	}
	return names[type]

## 获取兵种名称
func _get_troop_name(type: String, tier: String) -> String:
	var tier_names = {
		"recruit": "新兵",
		"regular": "正规军",
		"veteran": "老兵",
		"elite": "精锐",
		"champion": "冠军"
	}
	
	var type_names = {
		"infantry": "步兵",
		"archer": "弓箭手",
		"cavalry": "骑兵"
	}
	
	return tier_names[tier] + type_names[type]

## 获取随机武器
func get_random_weapon(rarity: String = "") -> Dictionary:
	if rarity.is_empty():
		return weapons.values()[randi() % weapons.size()]
	
	var filtered = weapons.values().filter(func(w): return w.rarity == rarity)
	if filtered.is_empty():
		return {}
	return filtered[randi() % filtered.size()]

## 获取随机护甲
func get_random_armor(rarity: String = "") -> Dictionary:
	if rarity.is_empty():
		return armors.values()[randi() % armors.size()]
	
	var filtered = armors.values().filter(func(a): return a.rarity == rarity)
	if filtered.is_empty():
		return {}
	return filtered[randi() % filtered.size()]