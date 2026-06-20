extends Node

## 任务系统 - 管理任务生成和执行

# 任务难度系数
const DIFFICULTY_MULTIPLIER = {
	1: 1.0,
	2: 1.5,
	3: 2.0,
	4: 3.0,
	5: 5.0
}

func _ready() -> void:
	print("QuestSystem initialized")

## 生成随机任务
func generate_random_quest(location_id: String, difficulty: int = 1) -> Quest:
	var quest = Quest.new()
	quest.id = "quest_%d" % Time.get_ticks_msec()
	quest.type = Quest.Type.RANDOM
	quest.difficulty = difficulty
	quest.source_location = location_id
	
	# 随机选择任务模板
	var template_ids = DataManager.quest_templates.keys()
	var template_id = template_ids[randi() % template_ids.size()]
	
	quest.initialize(quest.id, template_id)
	
	# 根据模板设置具体目标
	_setup_quest_objectives(quest, template_id, location_id)
	
	return quest

## 设置任务目标
func _setup_quest_objectives(quest: Quest, template_id: String, source_location: String) -> void:
	match template_id:
		"deliver":
			# 运送任务
			var destinations = _get_nearby_locations(source_location, 500)
			if destinations.size() > 0:
				quest.target_location = destinations[randi() % destinations.size()]
				quest.add_objective("travel", quest.target_location, 1)
				quest.add_objective("deliver", quest.target_location, 1)
		
		"escort":
			# 护送任务
			var destinations = _get_nearby_locations(source_location, 800)
			if destinations.size() > 0:
				quest.target_location = destinations[randi() % destinations.size()]
				quest.add_objective("escort", quest.target_location, 1)
		
		"hunt_bandits":
			# 剩匪任务
			var bandit_count = randi_range(5, 20) * quest.difficulty
			quest.add_objective("kill", "bandit", bandit_count)
		
		"rescue":
			# 营救任务
			var locations = WorldManager.locations.keys()
			quest.target_location = locations[randi() % locations.size()]
			quest.target_character = "npc_%d" % randi()
			quest.add_objective("travel", quest.target_location, 1)
			quest.add_objective("rescue", quest.target_character, 1)
		
		"conquer":
			# 攻城任务
			var enemy_locations = _get_enemy_locations(source_location)
			if enemy_locations.size() > 0:
				quest.target_location = enemy_locations[randi() % enemy_locations.size()]
				quest.add_objective("conquer", quest.target_location, 1)

## 获取附近的地点
func _get_nearby_locations(location_id: String, max_distance: float) -> Array:
	var nearby = []
	
	if not WorldManager.locations.has(location_id):
		return nearby
	
	var source_location = WorldManager.locations[location_id]
	
	for loc_id in WorldManager.locations:
		if loc_id == location_id:
			continue
		
		var location = WorldManager.locations[loc_id]
		var distance = source_location.position.distance_to(location.position)
		
		if distance <= max_distance:
			nearby.append(loc_id)
	
	return nearby

## 获取敌方地点
func _get_enemy_locations(location_id: String) -> Array:
	var enemy_locations = []
	
	if not WorldManager.locations.has(location_id):
		return enemy_locations
	
	var source_location = WorldManager.locations[location_id]
	var player_faction = GameManager.player.faction_id
	
	for loc_id in WorldManager.locations:
		if loc_id == location_id:
			continue
		
		var location = WorldManager.locations[loc_id]
		
		# 检查是否是敌方势力
		if location.owner_faction != player_faction:
			# 检查势力关系
			if WorldManager.factions.has(player_faction) and WorldManager.factions.has(location.owner_faction):
				var player_faction_data = WorldManager.factions[player_faction]
				if player_faction_data.is_enemy(location.owner_faction):
					enemy_locations.append(loc_id)
	
	return enemy_locations

## 接受任务
func accept_quest(quest: Quest) -> bool:
	if not quest.can_accept():
		return false
	
	if quest.accept():
		# 添加到玩家任务列表
		GameManager.player.active_quests.append(quest.to_dict())
		
		EventManager.trigger_event("quest_accepted", {"quest_id": quest.id})
		
		return true
	
	return false

## 完成任务目标
func complete_quest_objective(quest_id: String, objective_type: String, target: String, count: int = 1) -> bool:
	# 查找任务
	var quest_data = null
	for q in GameManager.player.active_quests:
		if q.id == quest_id:
			quest_data = q
			break
	
	if quest_data == null:
		return false
	
	var quest = Quest.new()
	quest.from_dict(quest_data)
	
	if quest.complete_objective(objective_type, target, count):
		# 更新任务数据
		_update_quest_data(quest)
		
		return true
	
	return false

## 更新任务数据
func _update_quest_data(quest: Quest) -> void:
	for i in range(GameManager.player.active_quests.size()):
		if GameManager.player.active_quests[i].id == quest.id:
			GameManager.player.active_quests[i] = quest.to_dict()
			break

## 获取活跃任务列表
func get_active_quests() -> Array:
	var quests = []
	
	for quest_data in GameManager.player.active_quests:
		var quest = Quest.new()
		quest.from_dict(quest_data)
		quests.append(quest)
	
	return quests

## 获取可用任务列表
func get_available_quests(location_id: String) -> Array:
	var available = []
	
	# 根据地点生成随机任务
	var difficulty = randi_range(1, 3)
	for i in range(randi_range(2, 5)):
		var quest = generate_random_quest(location_id, difficulty)
		available.append(quest)
	
	return available

## 检查任务进度
func check_quest_progress(event_type: String, event_data: Dictionary) -> void:
	for quest_data in GameManager.player.active_quests:
		var quest = Quest.new()
		quest.from_dict(quest_data)
		
		# 根据事件类型检查任务目标
		match event_type:
			"location_entered":
				# 到达地点
				complete_quest_objective(quest.id, "travel", event_data.location_id, 1)
				complete_quest_objective(quest.id, "deliver", event_data.location_id, 1)
				complete_quest_objective(quest.id, "escort", event_data.location_id, 1)
			
			"battle_ended":
				# 战斗结束
				if event_data.victory:
					# 消灭敌人
					complete_quest_objective(quest.id, "kill", "bandit", event_data.enemy_count)
					complete_quest_objective(quest.id, "kill", "enemy", event_data.enemy_count)
					
					# 攻占地点
					if event_data.has("captured_location"):
						complete_quest_objective(quest.id, "conquer", event_data.captured_location, 1)
			
			"item_picked_up":
				# 收集物品
				complete_quest_objective(quest.id, "collect", event_data.item_id, event_data.count)
			
			"recruit":
				# 招募士兵
				complete_quest_objective(quest.id, "recruit", event_data.troop_type, event_data.count)

## 获取任务奖励预览
func get_quest_reward_preview(quest: Quest) -> String:
	var preview = "奖励:\n"
	preview += "金币: %d\n" % quest.rewards.gold
	preview += "经验: %d\n" % quest.rewards.experience
	
	if quest.rewards.items.size() > 0:
		preview += "物品: %d 件\n" % quest.rewards.items.size()
	
	if quest.rewards.reputation > 0:
		preview += "声望: +%d\n" % quest.rewards.reputation
	
	return preview

## 计算任务难度评级
func calculate_quest_difficulty(quest: Quest) -> String:
	var rating = ""
	
	for i in range(quest.difficulty):
		rating += "★"
	
	return rating

## 获取任务状态描述
func get_quest_status_text(quest: Quest) -> String:
	var status_text = quest.get_status_description()
	
	if quest.status == Quest.Status.ACTIVE:
		status_text += "\n" + quest.get_progress_description()
	
	return status_text

## 创建主线任务
func create_main_quest(chapter: int) -> Quest:
	var quest = Quest.new()
	quest.id = "main_quest_%d" % chapter
	quest.type = Quest.Type.MAIN
	quest.difficulty = chapter + 2
	
	# 根据章节设置主线任务内容
	match chapter:
		1:
			quest.name = "初入江湖"
			quest.description = "你刚刚踏入这个世界，需要建立自己的基础力量。"
			quest.add_objective("recruit", "troop_0", 10)  # 招募10个新兵
			quest.add_objective("collect", "gold", 1000)   # 积累1000金币
			quest.rewards = {"gold": 500, "experience": 200, "reputation": 10}
		
		2:
			quest.name = "声名鹊起"
			quest.description = "你的名声开始传播，需要完成一些重要任务来证明自己。"
			quest.add_objective("kill", "bandit", 50)      # 消灭50个匪徒
			quest.add_objective("travel", "town_0", 1)     # 到达第一个城镇
			quest.rewards = {"gold": 1000, "experience": 500, "reputation": 20}
		
		3:
			quest.name = "势力崛起"
			quest.description = "你已经有了一定的实力，可以考虑建立自己的势力。"
			quest.add_objective("conquer", "castle_0", 1)  # 攻占一个城堡
			quest.add_objective("recruit", "troop_5", 20)   # 招募20个精锐士兵
			quest.rewards = {"gold": 2000, "experience": 1000, "reputation": 50}
		
		4:
			quest.name = "争霸天下"
			quest.description = "你已经建立了自己的势力，现在开始争霸天下。"
			quest.add_objective("conquer", "town_0", 3)    # 攻占3个城镇
			quest.add_objective("kill", "enemy", 200)      # 消灭200个敌人
			quest.rewards = {"gold": 5000, "experience": 2000, "reputation": 100}
	
	return quest

## 创建支线任务
func create_side_quest(story_id: String) -> Quest:
	var quest = Quest.new()
	quest.id = "side_quest_%s" % story_id
	quest.type = Quest.Type.SIDE
	quest.difficulty = randi_range(2, 4)
	
	# 根据故事ID设置支线任务
	# TODO: 实现更多支线任务
	
	return quest