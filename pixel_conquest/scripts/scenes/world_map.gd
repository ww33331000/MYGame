extends Node2D

## 世界地图场景 - 大地图旅行模式

# 地图配置
const MAP_WIDTH: int = 8000
const MAP_HEIGHT: int = 6000

# 地图节点
@onready var location_layer: Node2D = $LocationLayer
@onready var party_layer: Node2D = $PartyLayer
@onready var terrain_layer: TileMap = $TerrainLayer

# UI节点
@onready var ui_layer: CanvasLayer = $UILayer
@onready var location_info_panel: Control = $UILayer/LocationInfoPanel
@onready var party_info_panel: Control = $UILayer/PartyInfoPanel
@onready var time_display: Label = $UILayer/TimeDisplay

# 玩家队伍节点
var player_party_node: Node2D = null

# 地点节点缓存
var location_nodes: Dictionary = {}

# 其他队伍节点缓存
var party_nodes: Dictionary = {}

# 当前选中的地点
var selected_location: String = ""

# 当前选中的队伍
var selected_party: String = ""

# 地图缩放
var zoom_level: float = 1.0
const MIN_ZOOM: float = 0.5
const MAX_ZOOM: float = 2.0

# 相机跟随
var camera_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	_setup_camera()
	_create_location_nodes()
	_create_player_party_node()
	_create_other_party_nodes()
	_connect_signals()
	
	print("WorldMap scene ready")

## 设置相机
func _setup_camera() -> void:
	# 创建相机
	var camera = Camera2D.new()
	camera.name = "MapCamera"
	camera.position = GameManager.player.world_position
	camera.zoom = Vector2(zoom_level, zoom_level)
	camera.limit_left = 0
	camera.limit_right = MAP_WIDTH
	camera.limit_top = 0
	camera.limit_bottom = MAP_HEIGHT
	camera.smoothing_enabled = true
	camera.smoothing_speed = 5.0
	add_child(camera)

## 创建地点节点
func _create_location_nodes() -> void:
	for location_id in WorldManager.locations:
		var location = WorldManager.locations[location_id]
		var node = _create_location_node(location)
		location_layer.add_child(node)
		location_nodes[location_id] = node

## 创建单个地点节点
func _create_location_node(location: Location) -> Node2D:
	var node = LocationNode.new()
	node.location_id = location.id
	node.position = location.position
	
	# 根据类型设置大小和颜色
	match location.type:
		Location.Type.TOWN:
			node.size = Vector2(32, 32)
			node.color = Color(0.8, 0.6, 0.2)
		Location.Type.CASTLE:
			node.size = Vector2(24, 24)
			node.color = Color(0.5, 0.5, 0.5)
		Location.Type.VILLAGE:
			node.size = Vector2(16, 16)
			node.color = Color(0.4, 0.7, 0.4)
	
	# 设置势力颜色
	if WorldManager.factions.has(location.owner_faction):
		var faction = WorldManager.factions[location.owner_faction]
		node.faction_color = faction.color
	
	return node

## 创建玩家队伍节点
func _create_player_party_node() -> void:
	player_party_node = PartyNode.new()
	player_party_node.party_id = "player_party"
	player_party_node.is_player = true
	player_party_node.position = GameManager.player.world_position
	player_party_node.color = Color(0.2, 0.8, 0.2)
	party_layer.add_child(player_party_node)

## 创建其他队伍节点
func _create_other_party_nodes() -> void:
	for party_id in WorldManager.parties:
		var party = WorldManager.parties[party_id]
		var node = _create_party_node(party)
		party_layer.add_child(node)
		party_nodes[party_id] = node

## 创建单个队伍节点
func _create_party_node(party: Party) -> PartyNode:
	var node = PartyNode.new()
	node.party_id = party.id
	node.position = party.position
	node.is_player = false
	
	# 根据类型设置颜色
	match party.type:
		Party.Type.LORD:
			node.color = Color(0.8, 0.2, 0.2)
		Party.Type.CARAVAN:
			node.color = Color(0.6, 0.6, 0.2)
		Party.Type.BANDIT:
			node.color = Color(0.3, 0.3, 0.3)
		Party.Type.PATROL:
			node.color = Color(0.2, 0.5, 0.8)
		_:
			node.color = Color(0.5, 0.5, 0.5)
	
	return node

## 连接信号
func _connect_signals() -> void:
	GameManager.time_advanced.connect(_on_time_advanced)
	GameManager.day_changed.connect(_on_day_changed)
	EventManager.location_entered.connect(_on_location_entered)
	EventManager.battle_started.connect(_on_battle_started)

## 每帧更新
func _process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.WORLD_MAP:
		return
	
	# 更新玩家位置
	_update_player_position(delta)
	
	# 更新其他队伍
	_update_other_parties(delta)
	
	# 检查碰撞
	_check_collisions()
	
	# 更新UI
	_update_ui()

## 更新玩家位置
func _update_player_position(delta: float) -> void:
	# 处理移动输入
	var move_direction = Vector2.ZERO
	
	if Input.is_action_pressed("move_up"):
		move_direction.y -= 1
	if Input.is_action_pressed("move_down"):
		move_direction.y += 1
	if Input.is_action_pressed("move_left"):
		move_direction.x -= 1
	if Input.is_action_pressed("move_right"):
		move_direction.x += 1
	
	if move_direction != Vector2.ZERO:
		move_direction = move_direction.normalized()
		var speed = GameManager.player.get_speed() * 100  # 100 单位/秒
		var new_position = player_party_node.position + move_direction * speed * delta
		
		# 边界检查
		new_position.x = clamp(new_position.x, 0, MAP_WIDTH)
		new_position.y = clamp(new_position.y, 0, MAP_HEIGHT)
		
		player_party_node.position = new_position
		GameManager.player.world_position = new_position
		
		# 更新相机位置
		var camera = get_node_or_null("MapCamera")
		if camera:
			camera.position = new_position

## 更新其他队伍
func _update_other_parties(delta: float) -> void:
	for party_id in WorldManager.parties:
		var party = WorldManager.parties[party_id]
		party.update_position(delta)
		
		if party_nodes.has(party_id):
			party_nodes[party_id].position = party.position

## 检查碰撞
func _check_collisions() -> void:
	# 检查与地点碰撞
	for location_id in location_nodes:
		var node = location_nodes[location_id]
		var distance = player_party_node.position.distance_to(node.position)
		
		# 进入地点范围
		if distance < node.size.x:
			_enter_location(location_id)
	
	# 检查与其他队伍碰撞
	for party_id in party_nodes:
		var node = party_nodes[party_id]
		var distance = player_party_node.position.distance_to(node.position)
		
		# 遇到队伍
		if distance < 50:
			_encounter_party(party_id)

## 进入地点
func _enter_location(location_id: String) -> void:
	if selected_location == location_id:
		return
	
	selected_location = location_id
	EventManager.trigger_event("location_entered", {"location_id": location_id})
	
	# 显示地点信息
	_show_location_info(location_id)

## 遇到队伍
func _encounter_party(party_id: String) -> void:
	var party = WorldManager.parties.get(party_id)
	if party == null:
		return
	
	# 检查是否可以战斗
	if party.can_fight(WorldManager.parties.get("player_party", null)):
		_start_battle(party_id)

## 开始战斗
func _start_battle(enemy_party_id: String) -> void:
	var enemy_party = WorldManager.parties.get(enemy_party_id)
	if enemy_party == null:
		return
	
	var battle_data = {
		"enemy_party_id": enemy_party_id,
		"enemy_party": enemy_party.to_dict()
	}
	
	EventManager.trigger_event("battle_started", battle_data)
	GameManager.change_state(GameManager.GameState.BATTLE)

## 显示地点信息
func _show_location_info(location_id: String) -> void:
	var location = WorldManager.locations.get(location_id)
	if location == null:
		return
	
	if location_info_panel:
		location_info_panel.show_location(location)

## 更新UI
func _update_ui() -> void:
	if time_display:
		time_display.text = GameManager.get_time_string()

## 时间推进回调
func _on_time_advanced(hours: int) -> void:
	# 更新地点状态
	for location_id in WorldManager.locations:
		var location = WorldManager.locations[location_id]
		location.daily_update()

## 天数变化回调
func _on_day_changed(new_day: int) -> void:
	# 更新势力状态
	for faction_id in WorldManager.factions:
		var faction = WorldManager.factions[faction_id]
		faction.daily_update()
	
	# 更新任务状态
	for quest_id in GameManager.player.active_quests:
		var quest = Quest.new()
		quest.from_dict(GameManager.player.active_quests[quest_id])
		quest.daily_update()

## 进入地点回调
func _on_location_entered(location_id: String) -> void:
	print("Entered location: %s" % location_id)

## 战斗开始回调
func _on_battle_started(battle_data: Dictionary) -> void:
	print("Battle started with: %s" % battle_data.enemy_party_id)

## 处理输入事件
func _input(event: InputEvent) -> void:
	if GameManager.current_state != GameManager.GameState.WORLD_MAP:
		return
	
	# 鼠标点击
	if event is InputEventMouseButton:
		if event.pressed:
			_handle_mouse_click(event)
	
	# 缩放
	if event is InputEventKey:
		if event.pressed:
			if event.keycode == KEY_PLUS or event.keycode == KEY_EQUAL:
				_zoom_in()
			elif event.keycode == KEY_MINUS:
				_zoom_out()
			elif event.keycode == KEY_M:
				# 打开菜单
				GameManager.change_state(GameManager.GameState.MENU)
			elif event.keycode == KEY_I:
				# 打开背包
				GameManager.change_state(GameManager.GameState.INVENTORY)

## 处理鼠标点击
func _handle_mouse_click(event: InputEventMouseButton) -> void:
	var mouse_pos = get_global_mouse_position()
	
	# 左键点击 - 选择或移动
	if event.button_index == MOUSE_BUTTON_LEFT:
		# 检查是否点击地点
		for location_id in location_nodes:
			var node = location_nodes[location_id]
			if mouse_pos.distance_to(node.position) < node.size.x:
				selected_location = location_id
				_show_location_info(location_id)
				return
		
		# 检查是否点击队伍
		for party_id in party_nodes:
			var node = party_nodes[party_id]
			if mouse_pos.distance_to(node.position) < 25:
				selected_party = party_id
				return
	
	# 右键点击 - 移动玩家
	if event.button_index == MOUSE_BUTTON_RIGHT:
		player_party_node.position = mouse_pos.clamp(Vector2.ZERO, Vector2(MAP_WIDTH, MAP_HEIGHT))
		GameManager.player.world_position = player_party_node.position

## 缩放地图
func _zoom_in() -> void:
	zoom_level = min(zoom_level + 0.1, MAX_ZOOM)
	var camera = get_node_or_null("MapCamera")
	if camera:
		camera.zoom = Vector2(zoom_level, zoom_level)

func _zoom_out() -> void:
	zoom_level = max(zoom_level - 0.1, MIN_ZOOM)
	var camera = get_node_or_null("MapCamera")
	if camera:
		camera.zoom = Vector2(zoom_level, zoom_level)