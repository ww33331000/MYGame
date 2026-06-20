extends Node2D
class_name BattleUnit

## 战斗单位 - 战斗场景中的单个单位

# 单位状态
enum UnitState {
	IDLE,
	MOVING,
	ATTACKING,
	DEFENDING,
	DYING,
	DEAD
}

# 单位行为
enum UnitBehavior {
	ATTACK,
	DEFEND,
	FOLLOW,
	RETREAT
}

# 基础属性
var unit_id: String = ""
var is_player_unit: bool = true
var current_state: UnitState = UnitState.IDLE
var current_behavior: UnitBehavior = UnitBehavior.ATTACK

# 属性值
var health: int = 100
var max_health: int = 100
var attack: int = 10
var defense: int = 5
var speed: float = 1.0
var attack_range: float = 50.0
var attack_speed: float = 1.0  # 每秒攻击次数

# 当前目标
var target: BattleUnit = null

# 攻击冷却
var attack_cooldown: float = 0.0

# 移动目标
var move_target: Vector2 = Vector2.ZERO

# 是否被选中
var is_selected: bool = false

# 视觉元素
var sprite: Sprite2D = null
var health_bar: ProgressBar = null
var selection_indicator: Sprite2D = null

func _ready() -> void:
	_create_visual_elements()

## 创建视觉元素
func _create_visual_elements() -> void:
	# 创建单位精灵
	sprite = Sprite2D.new()
	sprite.name = "UnitSprite"
	sprite.position = Vector2.ZERO
	sprite.modulate = Color.WHITE if is_player_unit else Color.RED
	add_child(sprite)
	
	# 创建血条
	health_bar = ProgressBar.new()
	health_bar.name = "HealthBar"
	health_bar.position = Vector2(-15, -25)
	health_bar.size = Vector2(30, 5)
	health_bar.max_value = max_health
	health_bar.value = health
	health_bar.show_percentage = false
	add_child(health_bar)
	
	# 创建选中指示器
	selection_indicator = Sprite2D.new()
	selection_indicator.name = "SelectionIndicator"
	selection_indicator.position = Vector2.ZERO
	selection_indicator.visible = false
	add_child(selection_indicator)

## 设置为玩家单位
func setup_as_player_unit(troop_data: Dictionary) -> void:
	is_player_unit = true
	unit_id = "player_unit_%d" % randi()
	
	health = troop_data.get("health", 100)
	max_health = health
	attack = troop_data.get("attack", 10)
	defense = troop_data.get("defense", 5)
	speed = troop_data.get("speed", 1.0)
	
	# 根据类型设置攻击范围
	var troop_type = troop_data.get("type", "infantry")
	if troop_type == "archer":
		attack_range = 150.0
	elif troop_type == "cavalry":
		attack_range = 60.0
		speed *= 1.5
	else:
		attack_range = 50.0
	
	_update_visual()

## 设置为敌方单位
func setup_as_enemy_unit(troop_data: Dictionary) -> void:
	is_player_unit = false
	unit_id = "enemy_unit_%d" % randi()
	
	health = troop_data.get("health", 100)
	max_health = health
	attack = troop_data.get("attack", 10)
	defense = troop_data.get("defense", 5)
	speed = troop_data.get("speed", 1.0)
	
	# 根据类型设置攻击范围
	var troop_type = troop_data.get("type", "infantry")
	if troop_type == "archer":
		attack_range = 150.0
	elif troop_type == "cavalry":
		attack_range = 60.0
		speed *= 1.5
	else:
		attack_range = 50.0
	
	_update_visual()

## 更新视觉
func _update_visual() -> void:
	if sprite:
		sprite.modulate = Color(0.2, 0.8, 0.2) if is_player_unit else Color(0.8, 0.2, 0.2)
	
	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = health

## 单位更新
func update(delta: float) -> void:
	if not is_alive():
		return
	
	# 更新攻击冷却
	if attack_cooldown > 0:
		attack_cooldown -= delta
	
	# 根据行为执行动作
	match current_behavior:
		UnitBehavior.ATTACK:
			_attack_behavior(delta)
		UnitBehavior.DEFEND:
			_defend_behavior(delta)
		UnitBehavior.FOLLOW:
			_follow_behavior(delta)
		UnitBehavior.RETREAT:
			_retreat_behavior(delta)
	
	# 更新血条
	if health_bar:
		health_bar.value = health

## 进攻行为
func _attack_behavior(delta: float) -> void:
	if target == null or not target.is_alive():
		current_state = UnitState.IDLE
		return
	
	var distance = position.distance_to(target.position)
	
	if distance <= attack_range:
		# 在攻击范围内，执行攻击
		current_state = UnitState.ATTACKING
		_try_attack()
	else:
		# 移动到目标
		current_state = UnitState.MOVING
		_move_to_target(delta)

## 防守行为
func _defend_behavior(delta: float) -> void:
	current_state = UnitState.DEFENDING
	
	# 防守时增加防御力
	# 如果有敌人接近，反击
	if target != null and target.is_alive():
		var distance = position.distance_to(target.position)
		if distance <= attack_range:
			_try_attack()

## 跟随行为
func _follow_behavior(delta: float) -> void:
	if target == null:
		return
	
	var distance = position.distance_to(target.position)
	if distance > 100:
		_move_to_target(delta)

## 撤退行为
func _retreat_behavior(delta: float) -> void:
	# 向远离敌人的方向移动
	if target != null:
		var direction = (position - target.position).normalized()
		position += direction * speed * 100 * delta

## 移动到目标
func _move_to_target(delta: float) -> void:
	if target == null:
		return
	
	var direction = (target.position - position).normalized()
	position += direction * speed * 100 * delta

## 尝试攻击
func _try_attack() -> void:
	if attack_cooldown > 0:
		return
	
	if target == null or not target.is_alive():
		return
	
	# 执行攻击
	var damage = _calculate_damage()
	target.take_damage(damage, self)
	
	# 设置冷却时间
	attack_cooldown = 1.0 / attack_speed

## 计算伤害
func _calculate_damage() -> int:
	var base_damage = attack
	
	# 防守行为减少伤害
	if current_behavior == UnitBehavior.DEFEND:
		base_damage *= 0.5
	
	# 目标防御减少伤害
	if target != null:
		var target_defense = target.defense
		if target.current_behavior == UnitBehavior.DEFEND:
			target_defense *= 2
		
		base_damage = max(1, base_damage - target_defense)
	
	return int(base_damage)

## 受到伤害
func take_damage(damage: int, attacker: BattleUnit) -> void:
	health -= damage
	
	if health <= 0:
		kill()
	else:
		# 受到攻击后反击
		if target == null:
			target = attacker

## 死亡
func kill() -> void:
	current_state = UnitState.DEAD
	health = 0
	
	# 移除视觉元素
	if sprite:
		sprite.modulate = Color(0.3, 0.3, 0.3)
	
	if health_bar:
		health_bar.visible = false
	
	if selection_indicator:
		selection_indicator.visible = false

## 检查是否存活
func is_alive() -> bool:
	return current_state != UnitState.DEAD and health > 0

## 设置目标
func set_target(new_target: BattleUnit) -> void:
	target = new_target

## 检查是否有目标
func has_target() -> bool:
	return target != null and target.is_alive()

## 设置行为
func set_behavior(behavior: UnitBehavior) -> void:
	current_behavior = behavior

## 设置选中状态
func set_selected(selected: bool) -> void:
	is_selected = selected
	
	if selection_indicator:
		selection_indicator.visible = selected

## 绘制自定义图形
func _draw() -> void:
	# 绘制单位圆形
	var color = Color(0.2, 0.8, 0.2) if is_player_unit else Color(0.8, 0.2, 0.2)
	draw_circle(Vector2.ZERO, 15, color)
	
	# 绘制选中边框
	if is_selected:
		draw_circle(Vector2.ZERO, 18, Color.WHITE, false, 2.0)
	
	# 绘制状态指示
	match current_state:
		UnitState.ATTACKING:
			draw_line(Vector2.ZERO, Vector2(20, 0), Color.RED, 2.0)
		UnitState.DEFENDING:
			draw_rect(Rect2(-10, -10, 20, 20), Color.BLUE, false, 2.0)