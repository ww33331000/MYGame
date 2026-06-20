extends Node2D

## 战斗场景 - 实时战斗地图

# 战斗配置
const BATTLE_MAP_SIZE: Vector2 = Vector2(2000, 1500)
const SPAWN_DISTANCE: float = 500.0

# 战斗状态
enum BattleState {
	SETUP,
	DEPLOYMENT,
	FIGHTING,
	PAUSED,
	VICTORY,
	DEFEAT,
	RETREAT
}

var current_state: BattleState = BattleState.SETUP

# 战斗数据
var player_units: Array = []
var enemy_units: Array = []

# 战斗统计
var player_casualties: int = 0
var enemy_casualties: int = 0
var battle_time: float = 0.0

# 战斗奖励
var battle_rewards: Dictionary = {}

# 节点引用
@onready var unit_layer: Node2D = $UnitLayer
@onready var terrain_layer: TileMap = $TerrainLayer
@onready var ui_layer: CanvasLayer = $UILayer

# 选中的单位
var selected_unit: BattleUnit = null

# 相机
var camera: Camera2D = null

func _ready() -> void:
	_setup_battle()
	_setup_camera()
	_create_ui()
	
	print("BattleScene ready")

## 设置战斗
func _setup_battle() -> void:
	# 从GameManager获取战斗数据
	# 这里假设已经设置了战斗数据
	
	# 创建玩家单位
	_create_player_units()
	
	# 创建敌方单位
	_create_enemy_units()
	
	# 设置初始状态
	current_state = BattleState.DEPLOYMENT

## 设置相机
func _setup_camera() -> void:
	camera = Camera2D.new()
	camera.name = "BattleCamera"
	camera.position = BATTLE_MAP_SIZE / 2
	camera.zoom = Vector2(1.0, 1.0)
	camera.limit_left = 0
	camera.limit_right = BATTLE_MAP_SIZE.x
	camera.limit_top = 0
	camera.limit_bottom = BATTLE_MAP_SIZE.y
	camera.smoothing_enabled = true
	add_child(camera)

## 创建UI
func _create_ui() -> void:
	# 战斗信息面板
	var info_panel = _create_battle_info_panel()
	ui_layer.add_child(info_panel)
	
	# 单位控制面板
	var control_panel = _create_unit_control_panel()
	ui_layer.add_child(control_panel)

## 创建玩家单位
func _create_player_units() -> void:
	var spawn_position = Vector2(100, BATTLE_MAP_SIZE.y / 2)
	
	# 从玩家队伍创建单位
	for troop in GameManager.player.party:
		var troop_data = DataManager.troops.get(troop.troop_id, {})
		if troop_data.is_empty():
			continue
		
		for i in range(troop.count):
			var unit = BattleUnit.new()
			unit.setup_as_player_unit(troop_data)
			unit.position = spawn_position + Vector2(randf_range(-50, 50), randf_range(-100, 100))
			unit_layer.add_child(unit)
			player_units.append(unit)

## 创建敌方单位
func _create_enemy_units() -> void:
	var spawn_position = Vector2(BATTLE_MAP_SIZE.x - 100, BATTLE_MAP_SIZE.y / 2)
	
	# 从敌方队伍创建单位（这里使用模拟数据）
	var enemy_party_id = "enemy_party_0"
	if WorldManager.parties.has(enemy_party_id):
		var enemy_party = WorldManager.parties[enemy_party_id]
		
		for troop in enemy_party.troops:
			var troop_data = DataManager.troops.get(troop.troop_id, {})
			if troop_data.is_empty():
				continue
			
			for i in range(troop.count):
				var unit = BattleUnit.new()
				unit.setup_as_enemy_unit(troop_data)
				unit.position = spawn_position + Vector2(randf_range(-50, 50), randf_range(-100, 100))
				unit_layer.add_child(unit)
				enemy_units.append(unit)

## 创建战斗信息面板
func _create_battle_info_panel() -> Control:
	var panel = Control.new()
	panel.name = "BattleInfoPanel"
	panel.position = Vector2(10, 10)
	
	# 添加标签
	var label = Label.new()
	label.name = "BattleStatus"
	label.text = "战斗进行中"
	label.add_theme_font_size_override("font_size", 16)
	panel.add_child(label)
	
	return panel

## 创建单位控制面板
func _create_unit_control_panel() -> Control:
	var panel = Control.new()
	panel.name = "UnitControlPanel"
	panel.position = Vector2(10, BATTLE_MAP_SIZE.y - 100)
	
	# 添加控制按钮
	var attack_btn = Button.new()
	attack_btn.name = "AttackButton"
	attack_btn.text = "进攻"
	attack_btn.position = Vector2(0, 0)
	attack_btn.pressed.connect(_on_attack_pressed)
	panel.add_child(attack_btn)
	
	var defend_btn = Button.new()
	defend_btn.name = "DefendButton"
	defend_btn.text = "防守"
	defend_btn.position = Vector2(80, 0)
	defend_btn.pressed.connect(_on_defend_pressed)
	panel.add_child(defend_btn)
	
	var retreat_btn = Button.new()
	retreat_btn.name = "RetreatButton"
	retreat_btn.text = "撤退"
	retreat_btn.position = Vector2(160, 0)
	retreat_btn.pressed.connect(_on_retreat_pressed)
	panel.add_child(retreat_btn)
	
	return panel

## 每帧更新
func _process(delta: float) -> void:
	if current_state == BattleState.FIGHTING:
		battle_time += delta
		_update_units(delta)
		_check_battle_end()
		_update_camera()
		_update_ui()

## 更新单位
func _update_units(delta: float) -> void:
	# 更新所有玩家单位
	for unit in player_units:
		if unit.is_alive():
			unit.update(delta)
			_find_target_for_unit(unit, enemy_units)
	
	# 更新所有敌方单位
	for unit in enemy_units:
		if unit.is_alive():
			unit.update(delta)
			_find_target_for_unit(unit, player_units)

## 为单位寻找目标
func _find_target_for_unit(unit: BattleUnit, targets: Array) -> void:
	if unit.has_target():
		return
	
	var closest_target = null
	var closest_distance = INF
	
	for target in targets:
		if target.is_alive():
			var distance = unit.position.distance_to(target.position)
			if distance < closest_distance:
				closest_distance = distance
				closest_target = target
	
	if closest_target != null:
		unit.set_target(closest_target)

## 检查战斗结束
func _check_battle_end() -> void:
	# 检查玩家是否获胜
	var alive_enemies = enemy_units.filter(func(u): return u.is_alive())
	if alive_enemies.is_empty():
		_end_battle(true)
		return
	
	# 检查玩家是否失败
	var alive_players = player_units.filter(func(u): return u.is_alive())
	if alive_players.is_empty():
		_end_battle(false)
		return

## 结束战斗
func _end_battle(victory: bool) -> void:
	if victory:
		current_state = BattleState.VICTORY
		_calculate_rewards()
	else:
		current_state = BattleState.DEFEAT
	
	# 触发战斗结束事件
	var rewards_data = {
		"victory": victory,
		"rewards": battle_rewards
	}
	EventManager.trigger_event("battle_ended", rewards_data)
	
	# 返回世界地图
	await get_tree().create_timer(3.0).timeout
	GameManager.change_state(GameManager.GameState.WORLD_MAP)

## 计算奖励
func _calculate_rewards() -> void:
	battle_rewards = {
		"gold": enemy_casualties * randi_range(5, 20),
		"experience": enemy_casualties * randi_range(10, 30),
		"items": []
	}
	
	# 随机掉落装备
	if randf() < 0.3:
		battle_rewards.items.append(EquipmentSystem.generate_random_equipment(GameManager.player.level))
	
	# 给玩家发放奖励
	GameManager.player.modify_gold(battle_rewards.gold)
	GameManager.player.add_experience(battle_rewards.experience)
	
	for item in battle_rewards.items:
		GameManager.player.add_item_to_inventory(item)

## 更新相机
func _update_camera() -> void:
	# 相机跟随选中单位或战斗中心
	if selected_unit != null and selected_unit.is_alive():
		camera.position = selected_unit.position
	else:
		# 相机跟随战斗中心
		var center = Vector2.ZERO
		var count = 0
		
		for unit in player_units:
			if unit.is_alive():
				center += unit.position
				count += 1
		
		if count > 0:
			camera.position = center / count

## 更新UI
func _update_ui() -> void:
	var info_panel = ui_layer.get_node_or_null("BattleInfoPanel")
	if info_panel:
		var status_label = info_panel.get_node_or_null("BattleStatus")
		if status_label:
			var player_alive = player_units.filter(func(u): return u.is_alive()).size()
			var enemy_alive = enemy_units.filter(func(u): return u.is_alive()).size()
			status_label.text = "战斗时间: %.1f秒\n玩家存活: %d\n敌方存活: %d" % [battle_time, player_alive, enemy_alive]

## 处理输入
func _input(event: InputEvent) -> void:
	if current_state != BattleState.FIGHTING:
		return
	
	# 鼠标点击选择单位
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_select_unit_at_position(get_global_mouse_position())
	
	# 键盘控制
	if event is InputEventKey:
		if event.pressed:
			match event.keycode:
				KEY_SPACE:
					_toggle_pause()
				KEY_ESCAPE:
					_on_retreat_pressed()

## 选择单位
func _select_unit_at_position(pos: Vector2) -> void:
	# 检查玩家单位
	for unit in player_units:
		if unit.is_alive() and pos.distance_to(unit.position) < 20:
			selected_unit = unit
			unit.set_selected(true)
			return
	
	selected_unit = null

## 切换暂停
func _toggle_pause() -> void:
	if current_state == BattleState.FIGHTING:
		current_state = BattleState.PAUSED
		get_tree().paused = true
	elif current_state == BattleState.PAUSED:
		current_state = BattleState.FIGHTING
		get_tree().paused = false

## 进攻按钮按下
func _on_attack_pressed() -> void:
	if selected_unit != null:
		selected_unit.set_behavior("attack")
	
	# 所有玩家单位进攻
	for unit in player_units:
		if unit.is_alive():
			unit.set_behavior("attack")

## 防守按钮按下
func _on_defend_pressed() -> void:
	if selected_unit != null:
		selected_unit.set_behavior("defend")
	
	# 所有玩家单位防守
	for unit in player_units:
		if unit.is_alive():
			unit.set_behavior("defend")

## 撤退按钮按下
func _on_retreat_pressed() -> void:
	current_state = BattleState.RETREAT
	
	# 计算撤退损失
	var retreat_loss = 0.2  # 撤退损失20%兵力
	for unit in player_units:
		if unit.is_alive() and randf() < retreat_loss:
			unit.kill()
			player_casualties += 1
	
	_end_battle(false)