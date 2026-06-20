extends Control

## 游戏HUD界面 - 显示游戏状态信息

# UI节点
@onready var time_label: Label = $TopBar/TimeLabel
@onready var gold_label: Label = $TopBar/GoldLabel
@onready var health_bar: ProgressBar = $PlayerInfo/HealthBar
@onready var stamina_bar: ProgressBar = $PlayerInfo/StaminaBar
@onready var party_count_label: Label = $PlayerInfo/PartyCountLabel

# 快捷栏
@onready var quick_slots: HBoxContainer = $QuickSlots

# 通知区域
@onready var notification_area: VBoxContainer = $NotificationArea

# 通知队列
var notifications: Array = []

func _ready() -> void:
	_setup_ui()
	_connect_signals()
	
	print("GameHUD ready")

## 设置UI
func _setup_ui() -> void:
	# 设置顶部栏
	if time_label:
		time_label.add_theme_font_size_override("font_size", 14)
	
	if gold_label:
		gold_label.add_theme_font_size_override("font_size", 14)
	
	# 设置玩家信息
	if health_bar:
		health_bar.max_value = 100
		health_bar.value = 100
	
	if stamina_bar:
		stamina_bar.max_value = 100
		stamina_bar.value = 100
	
	# 设置快捷栏
	_setup_quick_slots()

## 设置快捷栏
func _setup_quick_slots() -> void:
	if quick_slots:
		for i in range(10):
			var slot = Button.new()
			slot.custom_minimum_size = Vector2(40, 40)
			slot.text = str(i + 1)
			slot.tooltip_text = "快捷键 %d" % (i + 1)
			quick_slots.add_child(slot)

## 连接信号
func _connect_signals() -> void:
	GameManager.time_advanced.connect(_on_time_advanced)
	GameManager.day_changed.connect(_on_day_changed)
	EventManager.gold_changed.connect(_on_gold_changed)
	EventManager.experience_gained.connect(_on_experience_gained)
	EventManager.level_up.connect(_on_level_up)
	EventManager.quest_completed.connect(_on_quest_completed)
	EventManager.quest_failed.connect(_on_quest_failed)

## 每帧更新
func _process(delta: float) -> void:
	_update_player_info()
	_process_notifications(delta)

## 更新玩家信息
func _update_player_info() -> void:
	if GameManager.player == null:
		return
	
	# 更新时间
	if time_label:
		time_label.text = GameManager.get_time_string()
	
	# 更新金币
	if gold_label:
		gold_label.text = "金币: %d" % GameManager.player.gold
	
	# 更新血条
	if health_bar:
		health_bar.max_value = GameManager.player.max_health
		health_bar.value = GameManager.player.health
	
	# 更新体力条
	if stamina_bar:
		stamina_bar.max_value = GameManager.player.max_stamina
		stamina_bar.value = GameManager.player.stamina
	
	# 更新部队数量
	if party_count_label:
		party_count_label.text = "部队: %d/%d" % [GameManager.player.get_party_count(), GameManager.player.get_party_limit()]

## 时间推进回调
func _on_time_advanced(hours: int) -> void:
	# 可以在这里添加时间相关的通知
	pass

## 天数变化回调
func _on_day_changed(new_day: int) -> void:
	add_notification("新的一天开始了 (第%d天)" % new_day)

## 金币变化回调
func _on_gold_changed(amount: int) -> void:
	if amount > 0:
		add_notification("获得 %d 金币" % amount)
	elif amount < 0:
		add_notification("花费 %d 金币" % abs(amount))

## 经验获得回调
func _on_experience_gained(amount: int) -> void:
	add_notification("获得 %d 经验" % amount)

## 升级回调
func _on_level_up(new_level: int) -> void:
	add_notification("升级到 %d 级！" % new_level, Color(0.8, 0.6, 0.2))

## 任务完成回调
func _on_quest_completed(quest_id: String) -> void:
	add_notification("任务完成！", Color(0.2, 0.8, 0.2))

## 任务失败回调
func _on_quest_failed(quest_id: String) -> void:
	add_notification("任务失败", Color(0.8, 0.2, 0.2))

## 添加通知
func add_notification(text: String, color: Color = Color.WHITE, duration: float = 3.0) -> void:
	notifications.append({
		"text": text,
		"color": color,
		"duration": duration,
		"remaining": duration
	})

## 处理通知
func _process_notifications(delta: float) -> void:
	# 更新通知时间
	for notification in notifications:
		notification.remaining -= delta
	
	# 移除过期通知
	notifications = notifications.filter(func(n): return n.remaining > 0)
	
	# 更新通知显示
	if notification_area:
		# 清除旧的通知
		for child in notification_area.get_children():
			child.queue_free()
		
		# 显示当前通知
		for notification in notifications:
			var label = Label.new()
			label.text = notification.text
			label.add_theme_color_override("font_color", notification.color)
			label.add_theme_font_size_override("font_size", 14)
			
			# 添加淡出效果
			var alpha = notification.remaining / notification.duration
			label.modulate.a = alpha
			
			notification_area.add_child(label)

## 显示地点信息面板
func show_location_panel(location: Location) -> void:
	var panel = _create_location_info_panel(location)
	add_child(panel)

## 创建地点信息面板
func _create_location_info_panel(location: Location) -> Control:
	var panel = Control.new()
	panel.position = Vector2(200, 100)
	panel.size = Vector2(300, 400)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	panel.add_child(vbox)
	
	# 地点名称
	var name_label = Label.new()
	name_label.text = location.name
	name_label.add_theme_font_size_override("font_size", 18)
	vbox.add_child(name_label)
	
	# 地点类型
	var type_label = Label.new()
	type_label.text = "类型: %s" % location.get_type_name()
	vbox.add_child(type_label)
	
	# 所属势力
	var faction_label = Label.new()
	if WorldManager.factions.has(location.owner_faction):
		var faction = WorldManager.factions[location.owner_faction]
		faction_label.text = "所属: %s" % faction.name
		faction_label.add_theme_color_override("font_color", faction.color)
	else:
		faction_label.text = "所属: 无"
	vbox.add_child(faction_label)
	
	# 繁荣度
	var prosperity_label = Label.new()
	prosperity_label.text = "繁荣度: %d" % location.prosperity
	vbox.add_child(prosperity_label)
	
	# 人口
	var population_label = Label.new()
	population_label.text = "人口: %d" % location.population
	vbox.add_child(population_label)
	
	# 驻军
	var garrison_label = Label.new()
	garrison_label.text = "驻军: %d" % location.get_garrison_count()
	vbox.add_child(garrison_label)
	
	# 按钮
	var button_box = HBoxContainer.new()
	vbox.add_child(button_box)
	
	var enter_button = Button.new()
	enter_button.text = "进入"
	enter_button.pressed.connect(_enter_location.bind(location.id))
	button_box.add_child(enter_button)
	
	var close_button = Button.new()
	close_button.text = "关闭"
	close_button.pressed.connect(panel.queue_free)
	button_box.add_child(close_button)
	
	return panel

## 进入地点
func _enter_location(location_id: String) -> void:
	GameManager.player.current_location = location_id
	GameManager.change_state(GameManager.GameState.LOCATION)

## 显示背包界面
func show_inventory() -> void:
	var inventory_panel = _create_inventory_panel()
	add_child(inventory_panel)

## 创建背包界面
func _create_inventory_panel() -> Control:
	var panel = Control.new()
	panel.position = Vector2(100, 50)
	panel.size = Vector2(600, 500)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	panel.add_child(vbox)
	
	# 标题
	var title_label = Label.new()
	title_label.text = "背包"
	title_label.add_theme_font_size_override("font_size", 20)
	vbox.add_child(title_label)
	
	# 物品列表
	var scroll_container = ScrollContainer.new()
	scroll_container.custom_minimum_size = Vector2(580, 400)
	vbox.add_child(scroll_container)
	
	var item_list = VBoxContainer.new()
	scroll_container.add_child(item_list)
	
	# 显示物品
	for item in GameManager.player.inventory:
		var item_button = Button.new()
		item_button.text = "%s (%d)" % [item.get("id", "Unknown"), item.get("count", 1)]
		item_button.tooltip_text = "点击查看详情"
		item_list.add_child(item_button)
	
	# 关闭按钮
	var close_button = Button.new()
	close_button.text = "关闭"
	close_button.pressed.connect(panel.queue_free)
	vbox.add_child(close_button)
	
	return panel

## 显示任务界面
func show_quests() -> void:
	var quest_panel = _create_quest_panel()
	add_child(quest_panel)

## 创建任务界面
func _create_quest_panel() -> Control:
	var panel = Control.new()
	panel.position = Vector2(100, 50)
	panel.size = Vector2(600, 500)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	panel.add_child(vbox)
	
	# 标题
	var title_label = Label.new()
	title_label.text = "任务"
	title_label.add_theme_font_size_override("font_size", 20)
	vbox.add_child(title_label)
	
	# 任务列表
	var scroll_container = ScrollContainer.new()
	scroll_container.custom_minimum_size = Vector2(580, 400)
	vbox.add_child(scroll_container)
	
	var quest_list = VBoxContainer.new()
	scroll_container.add_child(quest_list)
	
	# 显示活跃任务
	for quest_data in GameManager.player.active_quests:
		var quest_button = Button.new()
		quest_button.text = "%s - %s" % [quest_data.name, quest_data.status]
		quest_button.tooltip_text = quest_data.description
		quest_list.add_child(quest_button)
	
	# 关闭按钮
	var close_button = Button.new()
	close_button.text = "关闭"
	close_button.pressed.connect(panel.queue_free)
	vbox.add_child(close_button)
	
	return panel

## 处理输入
func _input(event: InputEvent) -> void:
	if event is InputEventKey:
		if event.pressed:
			match event.keycode:
				KEY_I:
					show_inventory()
				KEY_J:
					show_quests()
				KEY_ESCAPE:
					# 显示暂停菜单
					show_pause_menu()

## 显示暂停菜单
func show_pause_menu() -> void:
	var pause_panel = _create_pause_panel()
	add_child(pause_panel)
	GameManager.pause_game()

## 创建暂停面板
func _create_pause_panel() -> Control:
	var panel = Control.new()
	panel.position = Vector2(get_viewport().size.x / 2 - 150, get_viewport().size.y / 2 - 100)
	panel.size = Vector2(300, 200)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	panel.add_child(vbox)
	
	# 标题
	var title_label = Label.new()
	title_label.text = "游戏暂停"
	title_label.add_theme_font_size_override("font_size", 20)
	vbox.add_child(title_label)
	
	# 继续游戏按钮
	var resume_button = Button.new()
	resume_button.text = "继续游戏"
	resume_button.pressed.connect(_resume_game.bind(panel))
	vbox.add_child(resume_button)
	
	# 保存游戏按钮
	var save_button = Button.new()
	save_button.text = "保存游戏"
	save_button.pressed.connect(_save_game)
	vbox.add_child(save_button)
	
	# 加载游戏按钮
	var load_button = Button.new()
	load_button.text = "加载游戏"
	load_button.pressed.connect(_load_game)
	vbox.add_child(load_button)
	
	# 退出游戏按钮
	var quit_button = Button.new()
	quit_button.text = "退出游戏"
	quit_button.pressed.connect(_quit_game)
	vbox.add_child(quit_button)
	
	return panel

## 继续游戏
func _resume_game(panel: Control) -> void:
	panel.queue_free()
	GameManager.resume_game()

## 保存游戏
func _save_game() -> void:
	# 显示存档选择
	var save_dialog = ConfirmationDialog.new()
	save_dialog.dialog_text = "保存到哪个存档槽？"
	save_dialog.title = "保存游戏"
	
	# 添加存档槽选择
	var slot_option = OptionButton.new()
	for i in range(10):
		slot_option.add_item("存档槽 %d" % i)
	save_dialog.add_child(slot_option)
	
	save_dialog.confirmed.connect(_do_save.bind(slot_option.selected))
	add_child(save_dialog)
	save_dialog.popup_centered()

## 执行保存
func _do_save(slot: int) -> void:
	if GameManager.save_game(slot):
		add_notification("游戏已保存到存档槽 %d" % slot, Color(0.2, 0.8, 0.2))

## 加载游戏
func _load_game() -> void:
	# 显示加载对话框
	var load_dialog = ConfirmationDialog.new()
	load_dialog.dialog_text = "加载哪个存档？"
	load_dialog.title = "加载游戏"
	
	# 添加存档槽选择
	var slot_option = OptionButton.new()
	var saves = SaveManager.get_all_save_info()
	for save_info in saves:
		slot_option.add_item("存档 %d - 第%d天" % [save_info.slot, save_info.game_day])
	load_dialog.add_child(slot_option)
	
	load_dialog.confirmed.connect(_do_load.bind(slot_option.selected))
	add_child(load_dialog)
	load_dialog.popup_centered()

## 执行加载
func _do_load(slot_index: int) -> void:
	var saves = SaveManager.get_all_save_info()
	if slot_index < saves.size():
		var slot = saves[slot_index].slot
		if GameManager.load_game(slot):
			add_notification("游戏已加载", Color(0.2, 0.8, 0.2))

## 退出游戏
func _quit_game() -> void:
	var quit_dialog = ConfirmationDialog.new()
	quit_dialog.dialog_text = "确定要退出游戏吗？"
	quit_dialog.title = "退出游戏"
	quit_dialog.confirmed.connect(GameManager.quit_game)
	add_child(quit_dialog)
	quit_dialog.popup_centered()