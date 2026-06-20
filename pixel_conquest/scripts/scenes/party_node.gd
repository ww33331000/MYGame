extends Node2D
class_name PartyNode

## 队伍节点 - 大地图上的队伍显示

# 队伍ID
var party_id: String = ""

# 是否是玩家队伍
var is_player: bool = false

# 显示颜色
var color: Color = Color.WHITE

# 队伍大小（用于碰撞检测）
var radius: float = 25.0

# 子节点
var sprite: Sprite2D = null
var label: Label = null
var count_label: Label = null

# 移动动画
var move_target: Vector2 = Vector2.ZERO
var is_moving: bool = false

func _ready() -> void:
	_create_visual_elements()

## 创建视觉元素
func _create_visual_elements() -> void:
	# 创建队伍图标
	sprite = Sprite2D.new()
	sprite.name = "PartySprite"
	sprite.position = Vector2.ZERO
	sprite.scale = Vector2(1.5, 1.5)
	sprite.modulate = color
	add_child(sprite)
	
	# 创建队伍名称标签（仅玩家显示）
	if is_player:
		label = Label.new()
		label.name = "PartyLabel"
		label.position = Vector2(0, -40)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.text = "玩家队伍"
		label.add_theme_font_size_override("font_size", 14)
		label.add_theme_color_override("font_color", Color(0.2, 0.8, 0.2))
		add_child(label)
	
	# 创建队伍数量标签
	count_label = Label.new()
	count_label.name = "CountLabel"
	count_label.position = Vector2(0, 30)
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	count_label.add_theme_font_size_override("font_size", 10)
	add_child(count_label)

## 更新显示
func _update_display() -> void:
	if party_id.is_empty():
		return
	
	var party_data = null
	
	if is_player:
		# 玩家队伍数据
		party_data = {
			"troop_count": GameManager.player.get_party_count()
		}
	else:
		# 其他队伍数据
		party_data = WorldManager.parties.get(party_id)
	
	if party_data == null:
		return
	
	# 更新数量显示
	if count_label:
		if party_data.has("troop_count"):
			count_label.text = str(party_data.troop_count)
		elif party_data.has("get_troop_count"):
			count_label.text = str(party_data.get_troop_count())

## 绘制自定义图形
func _draw() -> void:
	# 绘制队伍圆形图标
	draw_circle(Vector2.ZERO, radius, color)
	
	# 玩家队伍绘制特殊边框
	if is_player:
		draw_circle(Vector2.ZERO, radius + 2, Color.WHITE, false, 2.0)
	
	# 绘制移动方向指示器
	if is_moving:
		var direction = (move_target - position).normalized()
		var arrow_pos = direction * radius * 1.5
		draw_line(Vector2.ZERO, arrow_pos, Color.WHITE, 2.0)

## 设置移动目标
func set_move_target(target: Vector2) -> void:
	move_target = target
	is_moving = true

## 停止移动
func stop_move() -> void:
	is_moving = false
	move_target = position