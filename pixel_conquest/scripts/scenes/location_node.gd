extends Node2D
class_name LocationNode

## 地点节点 - 大地图上的地点显示

# 地点ID
var location_id: String = ""

# 显示属性
var size: Vector2 = Vector2(16, 16)
var color: Color = Color.WHITE
var faction_color: Color = Color.WHITE

# 是否被选中
var is_selected: bool = false

# 子节点
var sprite: Sprite2D = null
var label: Label = null
var faction_indicator: Sprite2D = null

func _ready() -> void:
	_create_visual_elements()

## 创建视觉元素
func _create_visual_elements() -> void:
	# 创建地点图标（使用像素风格的矩形）
	sprite = Sprite2D.new()
	sprite.name = "LocationSprite"
	sprite.position = Vector2.ZERO
	sprite.scale = size / Vector2(16, 16)  # 基础大小16x16
	sprite.modulate = color
	add_child(sprite)
	
	# 创建地点名称标签
	label = Label.new()
	label.name = "LocationLabel"
	label.position = Vector2(0, -size.y / 2 - 10)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 12)
	add_child(label)
	
	# 创建势力指示器
	faction_indicator = Sprite2D.new()
	faction_indicator.name = "FactionIndicator"
	faction_indicator.position = Vector2(size.x / 2 + 5, 0)
	faction_indicator.scale = Vector2(0.5, 0.5)
	faction_indicator.modulate = faction_color
	add_child(faction_indicator)
	
	# 更新显示
	_update_display()

## 更新显示
func _update_display() -> void:
	if location_id.is_empty():
		return
	
	var location = WorldManager.locations.get(location_id)
	if location == null:
		return
	
	# 更新标签
	if label:
		label.text = location.name
	
	# 更新颜色
	if sprite:
		sprite.modulate = color
	
	# 更新势力颜色
	if faction_indicator and WorldManager.factions.has(location.owner_faction):
		var faction = WorldManager.factions[location.owner_faction]
		faction_indicator.modulate = faction.color

## 设置选中状态
func set_selected(selected: bool) -> void:
	is_selected = selected
	
	if sprite:
		if selected:
			sprite.modulate = Color.WHITE
			sprite.scale = size / Vector2(16, 16) * 1.2  # 放大选中效果
		else:
			sprite.modulate = color
			sprite.scale = size / Vector2(16, 16)

## 绘制自定义图形（用于像素风格）
func _draw() -> void:
	# 绘制地点图标
	var rect = Rect2(-size / 2, size)
	draw_rect(rect, color)
	
	# 绘制边框
	if is_selected:
		draw_rect(rect, Color.WHITE, false, 2.0)
	
	# 绘制势力旗帜
	if not faction_color == Color.WHITE:
		var flag_pos = Vector2(size.x / 2 + 5, 0)
		draw_circle(flag_pos, 5, faction_color)