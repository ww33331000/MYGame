extends Node

## 测试脚本 - 验证核心系统功能

func _ready() -> void:
	print("=== 开始系统测试 ===")
	
	# 测试数据管理器
	test_data_manager()
	
	# 测试世界生成
	test_world_generation()
	
	# 测试角色系统
	test_character_system()
	
	# 测试装备系统
	test_equipment_system()
	
	# 测试战斗系统
	test_battle_system()
	
	# 测试任务系统
	test_quest_system()
	
	# 测试经济系统
	test_economy_system()
	
	print("=== 所有测试完成 ===")

## 测试数据管理器
func test_data_manager() -> void:
	print("\n--- 测试数据管理器 ---")
	
	# 检查武器数据
	var weapon_count = DataManager.weapons.size()
	print("武器数量: %d" % weapon_count)
	assert(weapon_count > 0, "武器数据应该大于0")
	
	# 检查护甲数据
	var armor_count = DataManager.armors.size()
	print("护甲数量: %d" % armor_count)
	assert(armor_count > 0, "护甲数据应该大于0")
	
	# 检查技能数据
	var skill_count = DataManager.skills.size()
	print("技能数量: %d" % skill_count)
	assert(skill_count > 0, "技能数据应该大于0")
	
	# 检查兵种数据
	var troop_count = DataManager.troops.size()
	print("兵种数量: %d" % troop_count)
	assert(troop_count > 0, "兵种数据应该大于0")
	
	print("数据管理器测试通过 ✓")

## 测试世界生成
func test_world_generation() -> void:
	print("\n--- 测试世界生成 ---")
	
	# 生成世界
	WorldManager.generate_world()
	
	# 检查地点数量
	var town_count = WorldManager.locations.values().filter(func(loc): return loc.type == Location.Type.TOWN).size()
	print("城镇数量: %d (目标: 40)" % town_count)
	assert(town_count >= 35, "城镇数量应该接近40")
	
	var castle_count = WorldManager.locations.values().filter(func(loc): return loc.type == Location.Type.CASTLE).size()
	print("城堡数量: %d (目标: 120)" % castle_count)
	assert(castle_count >= 100, "城堡数量应该接近120")
	
	var village_count = WorldManager.locations.values().filter(func(loc): return loc.type == Location.Type.VILLAGE).size()
	print("村庄数量: %d (目标: 300)" % village_count)
	assert(village_count >= 250, "村庄数量应该接近300")
	
	# 检查势力数量
	var faction_count = WorldManager.factions.size()
	print("势力数量: %d" % faction_count)
	assert(faction_count >= 8, "势力数量应该至少8个")
	
	print("世界生成测试通过 ✓")

## 测试角色系统
func test_character_system() -> void:
	print("\n--- 测试角色系统 ---")
	
	# 创建测试角色
	var character = Character.new()
	character.setup_as_player()
	
	print("角色名称: %s" % character.name)
	print("角色等级: %d" % character.level)
	print("力量: %d" % character.strength)
	print("敏捷: %d" % character.agility)
	print("智力: %d" % character.intelligence)
	print("魅力: %d" % character.charisma)
	
	# 测试属性计算
	var attack = character.get_attack()
	print("攻击力: %d" % attack)
	assert(attack > 0, "攻击力应该大于0")
	
	var defense = character.get_defense()
	print("防御力: %d" % defense)
	assert(defense > 0, "防御力应该大于0")
	
	# 测试部队管理
	character.add_troops("troop_0", 10)
	var party_count = character.get_party_count()
	print("部队数量: %d" % party_count)
	assert(party_count >= 10, "部队数量应该至少10")
	
	# 测试经验系统
	character.add_experience(100)
	print("经验值: %d" % character.experience)
	
	print("角色系统测试通过 ✓")

## 测试装备系统
func test_equipment_system() -> void:
	print("\n--- 测试装备系统 ---")
	
	# 创建测试角色
	var character = Character.new()
	character.setup_as_player()
	
	# 获取随机武器
	var weapon = DataManager.get_random_weapon()
	print("测试武器: %s" % weapon.name)
	print("武器伤害: %d" % weapon.damage)
	
	# 测试装备
	var result = EquipmentSystem.equip(character, weapon, "weapon")
	if result.success:
		print("装备成功: %s" % result.message)
		print("装备后攻击力: %d" % character.get_attack())
	else:
		print("装备失败: %s" % result.message)
	
	# 测试生成装备
	var random_equipment = EquipmentSystem.generate_random_equipment(5)
	print("生成装备: %s" % random_equipment.name)
	print("装备稀有度: %s" % random_equipment.rarity)
	
	print("装备系统测试通过 ✓")

## 测试战斗系统
func test_battle_system() -> void:
	print("\n--- 测试战斗系统 ---")
	
	# 创建测试战斗单位
	var unit1 = BattleUnit.new()
	unit1.setup_as_player_unit(DataManager.troops["troop_0"])
	
	var unit2 = BattleUnit.new()
	unit2.setup_as_enemy_unit(DataManager.troops["troop_0"])
	
	print("单位1生命值: %d" % unit1.health)
	print("单位1攻击力: %d" % unit1.attack)
	print("单位2生命值: %d" % unit2.health)
	
	# 测试战斗计算
	unit1.set_target(unit2)
	unit1._try_attack()
	print("单位2受攻击后生命值: %d" % unit2.health)
	
	print("战斗系统测试通过 ✓")

## 测试任务系统
func test_quest_system() -> void:
	print("\n--- 测试任务系统 ---")
	
	# 生成随机任务
	var quest = QuestSystem.generate_random_quest("town_0", 2)
	print("任务名称: %s" % quest.name)
	print("任务描述: %s" % quest.description)
	print("任务难度: %d" % quest.difficulty)
	print("任务奖励金币: %d" % quest.rewards.gold)
	print("任务奖励经验: %d" % quest.rewards.experience)
	
	# 测试任务接受
	if quest.can_accept():
		quest.accept()
		print("任务状态: %s" % quest.get_status_description())
	
	print("任务系统测试通过 ✓")

## 测试经济系统
func test_economy_system() -> void:
	print("\n--- 测试经济系统 ---")
	
	# 获取一个城镇
	var town = WorldManager.locations.values().filter(func(loc): return loc.type == Location.Type.TOWN)[0]
	print("测试城镇: %s" % town.name)
	
	# 检查市场
	var market_items = town.market.size()
	print("市场商品数量: %d" % market_items)
	
	# 测试价格比较
	if market_items > 0:
		var item_id = town.market.keys()[0]
		var price_info = EconomySystem.get_price_info(town, item_id)
		print("商品 %s 价格: %d" % [item_id, price_info.current_price])
		print("基础价格: %d" % price_info.base_price)
	
	# 测试打造系统
	var character = Character.new()
	character.setup_as_player()
	character.skills["smithing"] = 5
	
	# 添加材料
	character.add_item_to_inventory({"id": "material_iron", "value": 30}, 20)
	character.add_item_to_inventory({"id": "material_wood", "value": 20}, 10)
	
	var craft_result = EconomySystem.craft_equipment(character, "weapon", "rare")
	if craft_result.success:
		print("打造成功: %s" % craft_result.equipment.name)
	else:
		print("打造失败: %s" % craft_result.message)
	
	print("经济系统测试通过 ✓")