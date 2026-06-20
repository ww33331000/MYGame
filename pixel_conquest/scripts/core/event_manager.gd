extends Node

## 事件管理器 - 管理游戏事件系统
## 单例自动加载

# 信号定义
signal quest_accepted(quest_id: String)
signal quest_completed(quest_id: String)
signal quest_failed(quest_id: String)
signal battle_started(battle_data: Dictionary)
signal battle_ended(victory: bool, rewards: Dictionary)
signal location_entered(location_id: String)
signal location_left(location_id: String)
signal item_picked_up(item_id: String, count: int)
signal item_dropped(item_id: String, count: int)
signal gold_changed(amount: int)
signal experience_gained(amount: int)
signal level_up(new_level: int)
signal faction_relation_changed(faction_id: String, change: int)
signal party_created(party_id: String)
signal party_disbanded(party_id: String)

# 活跃事件队列
var active_events: Array = []

func _ready() -> void:
	print("EventManager initialized")

## 触发事件
func trigger_event(event_name: String, data: Dictionary = {}) -> void:
	match event_name:
		"quest_accepted":
			quest_accepted.emit(data.get("quest_id", ""))
		"quest_completed":
			quest_completed.emit(data.get("quest_id", ""))
		"quest_failed":
			quest_failed.emit(data.get("quest_id", ""))
		"battle_started":
			battle_started.emit(data)
		"battle_ended":
			battle_ended.emit(data.get("victory", false), data.get("rewards", {}))
		"location_entered":
			location_entered.emit(data.get("location_id", ""))
		"location_left":
			location_left.emit(data.get("location_id", ""))
		"item_picked_up":
			item_picked_up.emit(data.get("item_id", ""), data.get("count", 1))
		"item_dropped":
			item_dropped.emit(data.get("item_id", ""), data.get("count", 1))
		"gold_changed":
			gold_changed.emit(data.get("amount", 0))
		"experience_gained":
			experience_gained.emit(data.get("amount", 0))
		"level_up":
			level_up.emit(data.get("new_level", 1))
		"faction_relation_changed":
			faction_relation_changed.emit(data.get("faction_id", ""), data.get("change", 0))
		"party_created":
			party_created.emit(data.get("party_id", ""))
		"party_disbanded":
			party_disbanded.emit(data.get("party_id", ""))

## 添加定时事件
func add_timed_event(event_data: Dictionary, delay: float) -> void:
	event_data["trigger_time"] = Time.get_ticks_msec() / 1000.0 + delay
	active_events.append(event_data)

## 添加条件事件
func add_conditional_event(event_data: Dictionary, condition: Callable) -> void:
	event_data["condition"] = condition
	active_events.append(event_data)

## 处理活跃事件
func _process(delta: float) -> void:
	var current_time = Time.get_ticks_msec() / 1000.0
	var events_to_remove = []
	
	for event in active_events:
		# 检查定时事件
		if event.has("trigger_time") and current_time >= event.trigger_time:
			trigger_event(event.get("event_name", ""), event.get("data", {}))
			events_to_remove.append(event)
		
		# 检查条件事件
		elif event.has("condition") and event.condition.call():
			trigger_event(event.get("event_name", ""), event.get("data", {}))
			events_to_remove.append(event)
	
	# 移除已触发的事件
	for event in events_to_remove:
		active_events.erase(event)

## 生成随机事件
func generate_random_event() -> Dictionary:
	var event_types = [
		{
			"type": "bandit_ambush",
			"name": "匪徒伏击",
			"description": "一群匪徒突然出现！",
			"probability": 0.1
		},
		{
			"type": "merchant_encounter",
			"name": "商队相遇",
			"description": "你遇到了一支商队。",
			"probability": 0.15
		},
		{
			"type": "treasure_found",
			"name": "发现宝藏",
			"description": "你发现了一个隐藏的宝箱！",
			"probability": 0.05
		},
		{
			"type": "noble_encounter",
			"name": "贵族相遇",
			"description": "一位贵族向你走来。",
			"probability": 0.08
		},
		{
			"type": "weather_change",
			"name": "天气变化",
			"description": "天气突然变化了。",
			"probability": 0.2
		}
	]
	
	# 根据概率选择事件
	var roll = randf()
	var cumulative = 0.0
	
	for event in event_types:
		cumulative += event.probability
		if roll <= cumulative:
			return event
	
	return {}