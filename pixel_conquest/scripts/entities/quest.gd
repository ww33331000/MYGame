class_name Quest
extends Resource

## 任务类 - 管理任务数据

# 任务类型
enum Type {
	MAIN,      # 主线任务
	SIDE,      # 支线任务
	RANDOM,    # 随机任务
	REPEATABLE # 可重复任务
}

# 任务状态
enum Status {
	AVAILABLE,  # 可接受
	ACTIVE,     # 进行中
	COMPLETED,  # 已完成
	FAILED      # 已失败
}

# 基础属性
@export var id: String = ""
@export var name: String = ""
@export var description: String = ""
@export var type: Type = Type.RANDOM
@export var status: Status = Status.AVAILABLE

# 任务目标
@export var objectives: Array = []  # [{type, target, count, current}]

# 任务奖励
@export var rewards: Dictionary = {
	"gold": 0,
	"experience": 0,
	"items": [],
	"reputation": 0
}

# 时间限制
@export var time_limit: int = 0  # 天数，0表示无限制
@export var days_remaining: int = 0

# 任务来源
@export var source_location: String = ""
@export var source_character: String = ""

# 任务目标地点
@export var target_location: String = ""
@export var target_character: String = ""

# 前置任务
@export var prerequisite_quests: Array = []

# 后续任务
@export var followup_quest: String = ""

# 任务等级
@export var difficulty: int = 1  # 1-5

## 初始化任务
func initialize(quest_id: String, template_id: String) -> void:
	id = quest_id
	
	if DataManager.quest_templates.has(template_id):
		var template = DataManager.quest_templates[template_id]
		name = template.name
		description = template.description
		
		# 设置奖励范围
		rewards.gold = randi_range(template.reward_gold[0], template.reward_gold[1])
		rewards.experience = randi_range(template.reward_exp[0], template.reward_exp[1])
		
		# 设置时间限制
		time_limit = randi_range(template.time_limit[0], template.time_limit[1])
		days_remaining = time_limit

## 接受任务
func accept() -> bool:
	if status != Status.AVAILABLE:
		return false
	
	status = Status.ACTIVE
	days_remaining = time_limit
	
	return true

## 完成目标
func complete_objective(objective_type: String, target: String, count: int = 1) -> bool:
	for objective in objectives:
		if objective.type == objective_type and objective.target == target:
			objective.current = min(objective.current + count, objective.count)
			
			# 检查是否完成所有目标
			if _check_all_objectives_completed():
				complete()
			
			return true
	
	return false

## 检查所有目标是否完成
func _check_all_objectives_completed() -> bool:
	for objective in objectives:
		if objective.current < objective.count:
			return false
	return true

## 完成任务
func complete() -> void:
	status = Status.COMPLETED
	
	# 发放奖励
	_give_rewards()

## 发放奖励
func _give_rewards() -> void:
	if GameManager.player != null:
		# 金币
		GameManager.player.modify_gold(rewards.gold)
		
		# 经验
		GameManager.player.add_experience(rewards.experience)
		
		# 物品
		for item in rewards.items:
			GameManager.player.add_item_to_inventory(item)
		
		# 声望
		if source_character != "":
			GameManager.player.modify_relation(source_character, rewards.reputation)

## 失败任务
func fail() -> void:
	status = Status.FAILED
	
	# 声望惩罚
	if source_character != "":
		GameManager.player.modify_relation(source_character, -rewards.reputation)

## 每日更新
func daily_update() -> void:
	if status != Status.ACTIVE:
		return
	
	if time_limit > 0:
		days_remaining -= 1
		
		if days_remaining <= 0:
			fail()

## 添加目标
func add_objective(objective_type: String, target: String, count: int) -> void:
	objectives.append({
		"type": objective_type,
		"target": target,
		"count": count,
		"current": 0
	})

## 获取进度描述
func get_progress_description() -> String:
	var descriptions = []
	
	for objective in objectives:
		var progress = "%d/%d" % [objective.current, objective.count]
		
		match objective.type:
			"travel":
				descriptions.append("前往 %s (%s)" % [objective.target, progress])
			"kill":
				descriptions.append("消灭 %s (%s)" % [objective.target, progress])
			"collect":
				descriptions.append("收集 %s (%s)" % [objective.target, progress])
			"deliver":
				descriptions.append("运送货物到 %s (%s)" % [objective.target, progress])
			"escort":
				descriptions.append("护送到 %s (%s)" % [objective.target, progress])
			"conquer":
				descriptions.append("攻占 %s (%s)" % [objective.target, progress])
			"recruit":
				descriptions.append("招募 %s (%s)" % [objective.target, progress])
	
	return "\n".join(descriptions)

## 获取状态描述
func get_status_description() -> String:
	match status:
		Status.AVAILABLE:
			return "可接受"
		Status.ACTIVE:
			if time_limit > 0:
				return "进行中 (剩余%d天)" % days_remaining
			else:
				return "进行中"
		Status.COMPLETED:
			return "已完成"
		Status.FAILED:
			return "已失败"
	return "未知"

## 检查是否可以接受
func can_accept() -> bool:
	if status != Status.AVAILABLE:
		return false
	
	# 检查前置任务
	for prereq_id in prerequisite_quests:
		if not GameManager.player.completed_quests.has(prereq_id):
			return false
	
	return true

## 序列化为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"description": description,
		"type": type,
		"status": status,
		"objectives": objectives,
		"rewards": rewards,
		"time_limit": time_limit,
		"days_remaining": days_remaining,
		"source_location": source_location,
		"source_character": source_character,
		"target_location": target_location,
		"target_character": target_character,
		"prerequisite_quests": prerequisite_quests,
		"followup_quest": followup_quest,
		"difficulty": difficulty
	}

## 从字典反序列化
func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "")
	description = data.get("description", "")
	type = data.get("type", Type.RANDOM)
	status = data.get("status", Status.AVAILABLE)
	objectives = data.get("objectives", [])
	rewards = data.get("rewards", {})
	time_limit = data.get("time_limit", 0)
	days_remaining = data.get("days_remaining", 0)
	source_location = data.get("source_location", "")
	source_character = data.get("source_character", "")
	target_location = data.get("target_location", "")
	target_character = data.get("target_character", "")
	prerequisite_quests = data.get("prerequisite_quests", [])
	followup_quest = data.get("followup_quest", "")
	difficulty = data.get("difficulty", 1)