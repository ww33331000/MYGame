extends Node

## 存档管理器 - 管理游戏存档
## 单例自动加载

const SAVE_DIR = "user://saves/"
const SAVE_EXTENSION = ".sav"
const MAX_SAVE_SLOTS = 10

func _ready() -> void:
	_ensure_save_directory()
	print("SaveManager initialized")

## 确保存档目录存在
func _ensure_save_directory() -> void:
	var dir = DirAccess.open("user://")
	if not dir.dir_exists("saves"):
		dir.make_dir("saves")

## 保存游戏
func save_game(slot: int, data: Dictionary) -> bool:
	if slot < 0 or slot >= MAX_SAVE_SLOTS:
		push_error("Invalid save slot: %d" % slot)
		return false
	
	var file_path = SAVE_DIR + "slot_%d%s" % [slot, SAVE_EXTENSION]
	
	# 添加保存时间戳
	data["save_time"] = Time.get_datetime_string_from_system()
	data["save_version"] = 1
	
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		push_error("Failed to open save file: %s" % file_path)
		return false
	
	var json_string = JSON.stringify(data, "  ")
	file.store_string(json_string)
	file.close()
	
	print("Game saved to slot %d" % slot)
	return true

## 加载游戏
func load_game(slot: int) -> Dictionary:
	if slot < 0 or slot >= MAX_SAVE_SLOTS:
		push_error("Invalid save slot: %d" % slot)
		return {}
	
	var file_path = SAVE_DIR + "slot_%d%s" % [slot, SAVE_EXTENSION]
	
	if not FileAccess.file_exists(file_path):
		push_warning("Save file not found: %s" % file_path)
		return {}
	
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		push_error("Failed to open save file: %s" % file_path)
		return {}
	
	var json_string = file.get_as_text()
	file.close()
	
	var json = JSON.new()
	var parse_result = json.parse(json_string)
	
	if parse_result != OK:
		push_error("Failed to parse save file: %s" % file_path)
		return {}
	
	print("Game loaded from slot %d" % slot)
	return json.data

## 删除存档
func delete_save(slot: int) -> bool:
	if slot < 0 or slot >= MAX_SAVE_SLOTS:
		push_error("Invalid save slot: %d" % slot)
		return false
	
	var file_path = SAVE_DIR + "slot_%d%s" % [slot, SAVE_EXTENSION]
	
	if not FileAccess.file_exists(file_path):
		return true
	
	var dir = DirAccess.open(SAVE_DIR)
	if dir == null:
		push_error("Failed to access save directory")
		return false
	
	var result = dir.remove(file_path)
	if result != OK:
		push_error("Failed to delete save file: %s" % file_path)
		return false
	
	print("Save slot %d deleted" % slot)
	return true

## 获取存档信息
func get_save_info(slot: int) -> Dictionary:
	var save_data = load_game(slot)
	
	if save_data.is_empty():
		return {}
	
	return {
		"slot": slot,
		"save_time": save_data.get("save_time", "Unknown"),
		"save_version": save_data.get("save_version", 0),
		"game_day": save_data.get("game_day", 1),
		"player_name": save_data.get("player", {}).get("name", "Unknown"),
		"player_level": save_data.get("player", {}).get("level", 1)
	}

## 获取所有存档信息
func get_all_save_info() -> Array:
	var saves = []
	
	for slot in range(MAX_SAVE_SLOTS):
		var info = get_save_info(slot)
		if not info.is_empty():
			saves.append(info)
	
	return saves

## 检查存档是否存在
func save_exists(slot: int) -> bool:
	var file_path = SAVE_DIR + "slot_%d%s" % [slot, SAVE_EXTENSION]
	return FileAccess.file_exists(file_path)

## 获取存档数量
func get_save_count() -> int:
	var count = 0
	for slot in range(MAX_SAVE_SLOTS):
		if save_exists(slot):
			count += 1
	return count

## 自动保存
func auto_save(data: Dictionary) -> bool:
	# 使用特殊槽位 -1 作为自动存档
	var auto_save_data = data.duplicate()
	auto_save_data["is_auto_save"] = true
	
	var file_path = SAVE_DIR + "auto_save%s" % SAVE_EXTENSION
	
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		push_error("Failed to create auto save file")
		return false
	
	var json_string = JSON.stringify(auto_save_data, "  ")
	file.store_string(json_string)
	file.close()
	
	print("Auto save completed")
	return true

## 加载自动存档
func load_auto_save() -> Dictionary:
	var file_path = SAVE_DIR + "auto_save%s" % SAVE_EXTENSION
	
	if not FileAccess.file_exists(file_path):
		return {}
	
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return {}
	
	var json_string = file.get_as_text()
	file.close()
	
	var json = JSON.new()
	var parse_result = json.parse(json_string)
	
	if parse_result != OK:
		return {}
	
	return json.data

## 快速保存
func quick_save(data: Dictionary) -> bool:
	# 使用特殊槽位 -2 作为快速存档
	var quick_save_data = data.duplicate()
	quick_save_data["is_quick_save"] = true
	
	var file_path = SAVE_DIR + "quick_save%s" % SAVE_EXTENSION
	
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		push_error("Failed to create quick save file")
		return false
	
	var json_string = JSON.stringify(quick_save_data, "  ")
	file.store_string(json_string)
	file.close()
	
	print("Quick save completed")
	return true

## 加载快速存档
func load_quick_save() -> Dictionary:
	var file_path = SAVE_DIR + "quick_save%s" % SAVE_EXTENSION
	
	if not FileAccess.file_exists(file_path):
		return {}
	
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return {}
	
	var json_string = file.get_as_text()
	file.close()
	
	var json = JSON.new()
	var parse_result = json.parse(json_string)
	
	if parse_result != OK:
		return {}
	
	return json.data