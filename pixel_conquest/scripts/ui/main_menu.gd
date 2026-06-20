extends Control

## 主菜单场景

# UI节点
@onready var new_game_button: Button = $VBoxContainer/NewGameButton
@onready var load_game_button: Button = $VBoxContainer/LoadGameButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var quit_button: Button = $VBoxContainer/QuitButton

# 游戏标题
@onready var title_label: Label = $TitleLabel

func _ready() -> void:
	_setup_ui()
	_connect_buttons()
	
	print("MainMenu ready")

## 设置UI
func _setup_ui() -> void:
	# 设置标题
	if title_label:
		title_label.text = "像素征服"
		title_label.add_theme_font_size_override("font_size", 48)
		title_label.add_theme_color_override("font_color", Color(0.8, 0.6, 0.2))
	
	# 设置按钮样式
	for button in get_tree().get_nodes_in_group("menu_buttons"):
		button.custom_minimum_size = Vector2(200, 50)
		button.add_theme_font_size_override("font_size", 20)

## 连接按钮信号
func _connect_buttons() -> void:
	if new_game_button:
		new_game_button.pressed.connect(_on_new_game_pressed)
	
	if load_game_button:
		load_game_button.pressed.connect(_on_load_game_pressed)
	
	if settings_button:
		settings_button.pressed.connect(_on_settings_pressed)
	
	if quit_button:
		quit_button.pressed.connect(_on_quit_pressed)

## 新游戏按钮
func _on_new_game_pressed() -> void:
	# 显示新游戏设置界面
	var new_game_dialog = _create_new_game_dialog()
	add_child(new_game_dialog)
	new_game_dialog.popup_centered()

## 创建新游戏对话框
func _create_new_game_dialog() -> ConfirmationDialog:
	var dialog = ConfirmationDialog.new()
	dialog.dialog_text = "开始新游戏？\n这将创建一个新的世界。"
	dialog.title = "新游戏"
	dialog.confirmed.connect(_start_new_game)
	
	return dialog

## 开始新游戏
func _start_new_game() -> void:
	GameManager.start_new_game()
	
	# 切换到世界地图场景
	get_tree().change_scene_to_file("res://scenes/world_map.tscn")

## 加载游戏按钮
func _on_load_game_pressed() -> void:
	# 显示加载游戏界面
	var load_dialog = _create_load_game_dialog()
	add_child(load_dialog)
	load_dialog.popup_centered()

## 创建加载游戏对话框
func _create_load_game_dialog() -> Window:
	var window = Window.new()
	window.title = "加载游戏"
	window.size = Vector2(400, 300)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(20, 20)
	window.add_child(vbox)
	
	# 显示存档列表
	var saves = SaveManager.get_all_save_info()
	
	for save_info in saves:
		var save_button = Button.new()
		save_button.text = "存档 %d - 第%d天 %s" % [save_info.slot, save_info.game_day, save_info.save_time]
		save_button.pressed.connect(_load_game.bind(save_info.slot))
		vbox.add_child(save_button)
	
	if saves.is_empty():
		var no_save_label = Label.new()
		no_save_label.text = "没有存档"
		vbox.add_child(no_save_label)
	
	return window

## 加载游戏
func _load_game(slot: int) -> void:
	if GameManager.load_game(slot):
		get_tree().change_scene_to_file("res://scenes/world_map.tscn")

## 设置按钮
func _on_settings_pressed() -> void:
	# 显示设置界面
	var settings_dialog = _create_settings_dialog()
	add_child(settings_dialog)
	settings_dialog.popup_centered()

## 创建设置对话框
func _create_settings_dialog() -> Window:
	var window = Window.new()
	window.title = "设置"
	window.size = Vector2(400, 300)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(20, 20)
	window.add_child(vbox)
	
	# 音量设置
	var volume_label = Label.new()
	volume_label.text = "音量"
	vbox.add_child(volume_label)
	
	var volume_slider = HSlider.new()
	volume_slider.min_value = 0
	volume_slider.max_value = 100
	volume_slider.value = 80
	vbox.add_child(volume_slider)
	
	# 语言设置
	var language_label = Label.new()
	language_label.text = "语言"
	vbox.add_child(language_label)
	
	var language_option = OptionButton.new()
	language_option.add_item("中文")
	language_option.add_item("英文")
	vbox.add_child(language_option)
	
	# 关闭按钮
	var close_button = Button.new()
	close_button.text = "关闭"
	close_button.pressed.connect(window.hide)
	vbox.add_child(close_button)
	
	return window

## 退出按钮
func _on_quit_pressed() -> void:
	# 显示退出确认
	var quit_dialog = ConfirmationDialog.new()
	quit_dialog.dialog_text = "确定要退出游戏吗？"
	quit_dialog.title = "退出"
	quit_dialog.confirmed.connect(GameManager.quit_game)
	add_child(quit_dialog)
	quit_dialog.popup_centered()