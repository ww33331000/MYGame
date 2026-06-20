extends Node

## 游戏管理器 - 管理游戏全局状态和流程
## 单例自动加载

# 游戏状态枚举
enum GameState {
	MENU,
	WORLD_MAP,
	LOCATION,
	BATTLE,
	DIALOGUE,
	INVENTORY,
	PAUSED
}

# 当前游戏状态
var current_state: GameState = GameState.MENU
var previous_state: GameState = GameState.MENU

# 玩家数据
var player: Character

# 游戏时间
var game_time: float = 0.0
var game_day: int = 1
var game_hour: int = 8  # 从早上8点开始

# 游戏速度倍率
var time_speed: float = 1.0

# 信号
signal state_changed(new_state: GameState, old_state: GameState)
signal time_advanced(hours: int)
signal day_changed(new_day: int)

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	print("GameManager initialized")

func _process(delta: float) -> void:
	if current_state == GameState.WORLD_MAP:
		_advance_game_time(delta)

## 切换游戏状态
func change_state(new_state: GameState) -> void:
	if new_state == current_state:
		return
	
	previous_state = current_state
	current_state = new_state
	state_changed.emit(new_state, previous_state)
	
	# 处理状态切换逻辑
	match new_state:
		GameState.PAUSED:
			get_tree().paused = true
		GameState.MENU:
			get_tree().paused = false
		_:
			get_tree().paused = false

## 暂停游戏
func pause_game() -> void:
	if current_state != GameState.PAUSED:
		change_state(GameState.PAUSED)

## 恢复游戏
func resume_game() -> void:
	if current_state == GameState.PAUSED:
		change_state(previous_state)

## 推进游戏时间
func _advance_game_time(delta: float) -> void:
	game_time += delta * time_speed * 10  # 10x 速度倍率
	
	var new_hour = int(game_time / 3600.0) % 24
	if new_hour != game_hour:
		game_hour = new_hour
		time_advanced.emit(1)
		
		if game_hour == 0:  # 午夜，新的一天
			game_day += 1
			day_changed.emit(game_day)
		
		game_time = fmod(game_time, 86400.0)  # 保持在一天内

## 获取当前时间字符串
func get_time_string() -> String:
	var hour_str = str(game_hour).pad_zeros(2)
	return "第%d天 %s:00" % [game_day, hour_str]

## 开始新游戏
func start_new_game() -> void:
	# 初始化玩家
	player = Character.new()
	player.setup_as_player()
	
	# 初始化世界
	WorldManager.generate_world()
	
	# 进入世界地图
	change_state(GameState.WORLD_MAP)

## 加载游戏
func load_game(save_slot: int) -> bool:
	var save_data = SaveManager.load_game(save_slot)
	if save_data.is_empty():
		return false
	
	# 恢复游戏状态
	player = Character.new()
	player.from_dict(save_data.player)
	
	game_day = save_data.game_day
	game_hour = save_data.game_hour
	game_time = save_data.game_time
	
	WorldManager.load_world_data(save_data.world)
	
	change_state(GameState.WORLD_MAP)
	return true

## 保存游戏
func save_game(save_slot: int) -> bool:
	var save_data = {
		"player": player.to_dict(),
		"game_day": game_day,
		"game_hour": game_hour,
		"game_time": game_time,
		"world": WorldManager.get_world_data()
	}
	
	return SaveManager.save_game(save_slot, save_data)

## 退出游戏
func quit_game() -> void:
	get_tree().quit()