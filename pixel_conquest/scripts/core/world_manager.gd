extends Node

## 世界管理器 - 管理游戏世界数据
## 单例自动加载

# 世界配置
const TOWN_COUNT: int = 40
const CASTLE_COUNT: int = 120
const VILLAGE_COUNT: int = 300

# 世界数据
var locations: Dictionary = {}  # id -> Location
var factions: Dictionary = {}    # id -> Faction
var characters: Dictionary = {}  # id -> Character
var parties: Dictionary = {}      # id -> Party

# 地图尺寸
var world_size: Vector2 = Vector2(8000, 6000)

# 信号
signal location_captured(location_id: String, new_faction_id: String)
signal faction_created(faction_id: String)
signal faction_destroyed(faction_id: String)

func _ready() -> void:
	print("WorldManager initialized")

## 生成新世界
func generate_world() -> void:
	locations.clear()
	factions.clear()
	characters.clear()
	parties.clear()
	
	# 生成初始势力
	_generate_initial_factions()
	
	# 生成城镇
	_generate_towns()
	
	# 生成城堡
	_generate_castles()
	
	# 生成村庄并关联
	_generate_villages()
	
	# 生成NPC领主
	_generate_lords()
	
	print("World generated: %d towns, %d castles, %d villages" % [TOWN_COUNT, CASTLE_COUNT, VILLAGE_COUNT])

## 生成初始势力
func _generate_initial_factions() -> void:
	var faction_names = [
		"北境王国", "东方帝国", "西海联盟", "南方联邦",
		"中央王国", "山地部落", "草原汗国", "海岛联邦"
	]
	
	var faction_colors = [
		Color(0.2, 0.4, 0.8),   # 蓝色
		Color(0.8, 0.2, 0.2),   # 红色
		Color(0.2, 0.8, 0.2),   # 绿色
		Color(0.8, 0.8, 0.2),   # 黄色
		Color(0.8, 0.4, 0.8),   # 紫色
		Color(0.6, 0.4, 0.2),   # 棕色
		Color(0.2, 0.8, 0.8),   # 青色
		Color(0.8, 0.6, 0.2)    # 橙色
	]
	
	for i in range(faction_names.size()):
		var faction = Faction.new()
		faction.id = "faction_%d" % i
		faction.name = faction_names[i]
		faction.color = faction_colors[i]
		factions[faction.id] = faction
		faction_created.emit(faction.id)

## 生成城镇
func _generate_towns() -> void:
	var town_names = _generate_location_names("town", TOWN_COUNT)
	
	for i in range(TOWN_COUNT):
		var town = Location.new()
		town.id = "town_%d" % i
		town.name = town_names[i]
		town.type = Location.Type.TOWN
		town.position = _get_random_position(i, TOWN_COUNT, 0.15)
		town.prosperity = randi_range(60, 100)
		
		# 分配势力
		var faction_index = i % factions.size()
		town.owner_faction = factions.values()[faction_index].id
		
		# 初始驻军
		town.garrison = _generate_garrison(50, 100)
		
		locations[town.id] = town

## 生成城堡
func _generate_castles() -> void:
	var castle_names = _generate_location_names("castle", CASTLE_COUNT)
	
	for i in range(CASTLE_COUNT):
		var castle = Location.new()
		castle.id = "castle_%d" % i
		castle.name = castle_names[i]
		castle.type = Location.Type.CASTLE
		castle.position = _get_random_position(i, CASTLE_COUNT, 0.3)
		castle.prosperity = randi_range(30, 60)
		
		# 分配势力
		var faction_index = i % factions.size()
		castle.owner_faction = factions.values()[faction_index].id
		
		# 初始驻军
		castle.garrison = _generate_garrison(20, 50)
		
		locations[castle.id] = castle

## 生成村庄
func _generate_villages() -> void:
	var village_names = _generate_location_names("village", VILLAGE_COUNT)
	
	# 获取所有城镇和城堡
	var towns_and_castles = locations.values().filter(func(loc): return loc.type != Location.Type.VILLAGE)
	
	for i in range(VILLAGE_COUNT):
		var village = Location.new()
		village.id = "village_%d" % i
		village.name = village_names[i]
		village.type = Location.Type.VILLAGE
		village.prosperity = randi_range(10, 40)
		
		# 关联到最近的城镇或城堡
		var parent = towns_and_castles[i % towns_and_castles.size()]
		village.position = parent.position + Vector2(randf_range(-300, 300), randf_range(-300, 300))
		village.position = village.position.clamp(Vector2.ZERO, world_size)
		village.owner_faction = parent.owner_faction
		village.parent_location = parent.id
		
		# 添加到父地点的关联列表
		parent.linked_villages.append(village.id)
		
		locations[village.id] = village

## 生成领主NPC
func _generate_lords() -> void:
	var lord_names = [
		"阿尔弗雷德", "贝奥武夫", "查理曼", "迪特里希",
		"爱德华", "腓特烈", "冈特", "亨利",
		"伊瓦尔", "约翰", "克努特", "利奥波德",
		"马格努斯", "诺曼", "奥托", "彼得"
	]
	
	for faction in factions.values():
		# 每个势力生成3-5个领主
		var lord_count = randi_range(3, 5)
		for i in range(lord_count):
			var lord = Character.new()
			lord.id = "lord_%d_%d" % [factions.values().find(faction), i]
			lord.name = lord_names[randi() % lord_names.size()]
			lord.faction_id = faction.id
			lord.is_lord = true
			
			characters[lord.id] = lord
			faction.members.append(lord.id)

## 获取随机位置（确保分布均匀）
func _get_random_position(index: int, total: int, margin: float) -> Vector2:
	var cols = ceil(sqrt(total * world_size.x / world_size.y))
	var rows = ceil(total / float(cols))
	
	var col = index % int(cols)
	var row = index / int(cols)
	
	var cell_width = world_size.x / cols
	var cell_height = world_size.y / rows
	
	var base_x = col * cell_width + cell_width / 2
	var base_y = row * cell_height + cell_height / 2
	
	var offset_x = randf_range(-cell_width * 0.3, cell_width * 0.3)
	var offset_y = randf_range(-cell_height * 0.3, cell_height * 0.3)
	
	var pos = Vector2(base_x + offset_x, base_y + offset_y)
	pos = pos.clamp(Vector2(world_size.x * margin, world_size.y * margin), 
					Vector2(world_size.x * (1 - margin), world_size.y * (1 - margin)))
	
	return pos

## 生成驻军
func _generate_garrison(min_count: int, max_count: int) -> Array:
	var garrison = []
	var count = randi_range(min_count, max_count)
	
	for i in range(count):
		var troop = {
			"type": randi() % 5,  # 兵种类型
			"level": randi_range(1, 5),
			"count": randi_range(5, 20)
		}
		garrison.append(troop)
	
	return garrison

## 生成地点名称
func _generate_location_names(type: String, count: int) -> Array:
	var prefixes = {
		"town": ["新", "老", "大", "小", "东", "西", "南", "北", "上", "下"],
		"castle": ["黑", "白", "红", "铁", "石", "金", "银", "风", "雷", "火"],
		"village": ["小", "老", "新", "山", "水", "林", "田", "河", "湖", "谷"]
	}
	
	var suffixes = {
		"town": ["城", "镇", "堡", "港", "都"],
		"castle": ["堡", "寨", "要塞", "堡垒", "城堡"],
		"village": ["村", "庄", "屯", "寨", "镇"]
	}
	
	var names = []
	var prefix_list = prefixes.get(type, prefixes["town"])
	var suffix_list = suffixes.get(type, suffixes["town"])
	
	for i in range(count):
		var name = prefix_list[randi() % prefix_list.size()]
		name += suffix_list[randi() % suffix_list.size()]
		name += str(randi() % 100)  # 添加数字避免重复
		names.append(name)
	
	return names

## 获取世界数据（用于存档）
func get_world_data() -> Dictionary:
	var data = {
		"locations": {},
		"factions": {},
		"characters": {},
		"parties": {}
	}
	
	for id in locations:
		data.locations[id] = locations[id].to_dict()
	
	for id in factions:
		data.factions[id] = factions[id].to_dict()
	
	for id in characters:
		data.characters[id] = characters[id].to_dict()
	
	for id in parties:
		data.parties[id] = parties[id].to_dict()
	
	return data

## 加载世界数据
func load_world_data(data: Dictionary) -> void:
	locations.clear()
	factions.clear()
	characters.clear()
	parties.clear()
	
	for id in data.locations:
		var loc = Location.new()
		loc.from_dict(data.locations[id])
		locations[id] = loc
	
	for id in data.factions:
		var fac = Faction.new()
		fac.from_dict(data.factions[id])
		factions[id] = fac
	
	for id in data.characters:
		var char = Character.new()
		char.from_dict(data.characters[id])
		characters[id] = char
	
	for id in data.parties:
		var party = Party.new()
		party.from_dict(data.parties[id])
		parties[id] = party

## 获取指定势力的所有领地
func get_faction_territories(faction_id: String) -> Array:
	return locations.values().filter(func(loc): return loc.owner_faction == faction_id)

## 获取指定地点的所有关联村庄
func get_linked_villages(location_id: String) -> Array:
	var result = []
	if locations.has(location_id):
		var loc = locations[location_id]
		for village_id in loc.linked_villages:
			if locations.has(village_id):
				result.append(locations[village_id])
	return result