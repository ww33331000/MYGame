extends Node

## 主场景 - 游戏入口点

# 当前场景
var current_scene: Node = null

# 场景路径
const SCENE_PATHS = {
	"main_menu": "res://scenes/ui/main_menu.tscn",
	"world_map": "res://scenes/world_map.tscn",
	"battle": "res://scenes/battle_scene.tscn",
	"location": "res://scenes/location_scene.tscn"
}

func _ready() -> void:
	# 初始化所有系统
	_initialize_systems()
	
	# 加载主菜单
	load_scene("main_menu")
	
	print("Main scene ready")

## 初始化系统
func _initialize_systems() -> void:
	# 系统已经在autoload中自动加载
	# 这里只需要确保它们正确初始化
	
	# 加载游戏数据
	DataManager.load_all_data()
	
	# 初始化事件系统
	EventManager._ready()

## 加载场景
func load_scene(scene_name: String) -> void:
	if not SCENE_PATHS.has(scene_name):
		push_error("Scene not found: %s" % scene_name)
		return
	
	# 卸载当前场景
	if current_scene != null:
		current_scene.queue_free()
	
	# 加载新场景
	var scene_resource = load(SCENE_PATHS[scene_name])
	current_scene = scene_resource.instantiate()
	add_child(current_scene)
	
	# 更新游戏状态
	match scene_name:
		"main_menu":
			GameManager.change_state(GameManager.GameState.MENU)
		"world_map":
			GameManager.change_state(GameManager.GameState.WORLD_MAP)
		"battle":
			GameManager.change_state(GameManager.GameState.BATTLE)
		"location":
			GameManager.change_state(GameManager.GameState.LOCATION)

## 切换到世界地图
func go_to_world_map() -> void:
	load_scene("world_map")

## 切换到战斗场景
func go_to_battle(battle_data: Dictionary) -> void:
	# 设置战斗数据
	# TODO: 实现战斗数据传递
	load_scene("battle")

## 切换到地点场景
func go_to_location(location_id: String) -> void:
	# 设置地点数据
	GameManager.player.current_location = location_id
	load_scene("location")

## 返回主菜单
func go_to_main_menu() -> void:
	load_scene("main_menu")

## 处理全局输入
func _input(event: InputEvent) -> void:
	# 全局快捷键
	if event is InputEventKey:
		if event.pressed:
			# F1 - 显示帮助
			if event.keycode == KEY_F1:
				show_help()
			
			# F5 - 快速保存
			if event.keycode == KEY_F5:
				quick_save()
			
			# F9 - 快速加载
			if event.keycode == KEY_F9:
				quick_load()

## 显示帮助
func show_help() -> void:
	var help_text = """
	游戏帮助:
	
	移动: WASD 或 方向键
	攻击: 左键点击
	防御: 右键点击
	背包: I
	任务: J
	地图: M
	暂停: ESC
	
	F1: 显示帮助
	F5: 快速保存
	F9: 快速加载
	"""
	
	print(help_text)

## 快速保存
func quick_save() -> void:
	if GameManager.player != null:
		GameManager.quick_save()
		EventManager.trigger_event("notification", {"text": "快速保存成功", "color": Color(0.2, 0.8, 0.2)})

## 快速加载
func quick_load() -> void:
	if GameManager.load_quick_save():
		load_scene("world_map")
		EventManager.trigger_event("notification", {"text": "快速加载成功", "color": Color(0.2, 0.8, 0.2)})