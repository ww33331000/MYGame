"""
世界生成器
"""

import random
import math
from typing import List, Tuple, Dict
import noise  # 需要安装: pip install noise

from .world import World
from .settlement import Settlement, SettlementType
from .faction import Faction
from game.core.settings import Settings


class WorldGenerator:
    """世界生成器"""

    # 地形类型
    TERRAIN_PLAIN = 0
    TERRAIN_FOREST = 1
    TERRAIN_MOUNTAIN = 2
    TERRAIN_SWAMP = 3
    TERRAIN_ROAD = 4
    TERRAIN_WATER = 5

    # 势力名称
    FACTION_NAMES = [
        "斯瓦迪亚王国",
        "罗多克共和国",
        "诺德王国",
        "维吉亚帝国",
        "库吉特汗国",
        "萨兰德苏丹国",
    ]

    # 势力颜色
    FACTION_COLORS = [
        (255, 215, 0),   # 金色
        (0, 128, 0),     # 绿色
        (0, 0, 255),     # 蓝色
        (255, 0, 0),     # 红色
        (255, 165, 0),   # 橙色
        (128, 0, 128),   # 紫色
    ]

    # 城镇名称前缀
    TOWN_PREFIXES = [
        "新", "北", "南", "东", "西", "上", "下", "大", "小", "古",
    ]

    # 城镇名称后缀
    TOWN_SUFFIXES = [
        "堡", "城", "镇", "港", "口", "关", "寨", "营",
    ]

    # 城堡名称
    CASTLE_NAMES = [
        "铁壁堡", "龙岩堡", "鹰巢堡", "狮心堡", "暗影堡",
        "晨曦堡", "暮光堡", "风暴堡", "冰霜堡", "烈焰堡",
        "银月堡", "金阳堡", "翡翠堡", "琥珀堡", "水晶堡",
    ]

    # 村庄名称
    VILLAGE_NAMES = [
        "河边村", "山脚村", "林间村", "草原村", "湖畔村",
        "谷地村", "高地村", "平原村", "溪谷村", "松林村",
    ]

    def __init__(self, seed: int = None):
        self.seed = seed or random.randint(1, 999999)
        random.seed(self.seed)

    def generate(self) -> World:
        """生成世界"""
        world = World(Settings.WORLD_MAP_WIDTH, Settings.WORLD_MAP_HEIGHT)

        # 生成地形
        self._generate_terrain(world)

        # 生成势力
        self._generate_factions(world)

        # 生成城镇
        self._generate_towns(world)

        # 生成城堡
        self._generate_castles(world)

        # 生成村庄
        self._generate_villages(world)

        # 建立隶属关系
        self._establish_hierarchy(world)

        # 生成道路
        self._generate_roads(world)

        # 分配领地给势力
        self._assign_territories(world)

        return world

    def _generate_terrain(self, world: World):
        """生成地形"""
        # 使用柏林噪声生成地形
        scale = 50.0
        octaves = 4
        persistence = 0.5
        lacunarity = 2.0

        world.terrain_map = []
        world.height_map = []

        for y in range(world.height):
            terrain_row = []
            height_row = []
            for x in range(world.width):
                # 生成高度值
                height = noise.pnoise2(
                    x / scale,
                    y / scale,
                    octaves=octaves,
                    persistence=persistence,
                    lacunarity=lacunarity,
                    base=self.seed
                )
                height = (height + 1) / 2  # 归一化到 0-1
                height_row.append(height)

                # 根据高度确定地形
                if height < 0.3:
                    terrain = self.TERRAIN_WATER
                elif height < 0.4:
                    terrain = self.TERRAIN_SWAMP
                elif height < 0.55:
                    terrain = self.TERRAIN_PLAIN
                elif height < 0.7:
                    terrain = self.TERRAIN_FOREST
                else:
                    terrain = self.TERRAIN_MOUNTAIN

                terrain_row.append(terrain)

            world.terrain_map.append(terrain_row)
            world.height_map.append(height_row)

    def _generate_factions(self, world: World):
        """生成势力"""
        num_factions = Settings.INITIAL_FACTIONS

        for i in range(num_factions):
            faction = Faction(
                id=i,
                name=self.FACTION_NAMES[i] if i < len(self.FACTION_NAMES) else f"势力{i+1}",
                color=self.FACTION_COLORS[i] if i < len(self.FACTION_COLORS) else
                      (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
            )
            world.factions[i] = faction

        # 设置初始势力关系
        for i, faction1 in world.factions.items():
            for j, faction2 in world.factions.items():
                if i != j:
                    # 随机初始关系
                    relation = random.randint(-20, 20)
                    faction1.set_relation(j, relation)

    def _generate_towns(self, world: World):
        """生成城镇"""
        num_towns = Settings.NUM_TOWNS
        positions = self._find_good_positions(world, num_towns, min_distance=15)

        for i, (x, y) in enumerate(positions):
            name = self._generate_town_name(i)
            town = Settlement(
                id=i,
                name=name,
                settlement_type=SettlementType.TOWN,
                world_x=x,
                world_y=y,
                population=random.randint(2000, 5000),
                prosperity=random.randint(40, 80),
                garrison_limit=200,
            )
            world.settlements[i] = town
            world.towns.append(i)

    def _generate_castles(self, world: World):
        """生成城堡"""
        num_castles = Settings.NUM_CASTLES
        existing_positions = [(s.world_x, s.world_y) for s in world.settlements.values()]
        positions = self._find_good_positions(world, num_castles, min_distance=8,
                                               avoid_positions=existing_positions)

        start_id = len(world.settlements)
        for i, (x, y) in enumerate(positions):
            name = self._generate_castle_name(i)
            castle = Settlement(
                id=start_id + i,
                name=name,
                settlement_type=SettlementType.CASTLE,
                world_x=x,
                world_y=y,
                population=random.randint(200, 500),
                prosperity=random.randint(30, 60),
                garrison_limit=100,
            )
            world.settlements[start_id + i] = castle
            world.castles.append(start_id + i)

    def _generate_villages(self, world: World):
        """生成村庄"""
        num_villages = Settings.NUM_VILLAGES
        existing_positions = [(s.world_x, s.world_y) for s in world.settlements.values()]
        positions = self._find_good_positions(world, num_villages, min_distance=5,
                                               avoid_positions=existing_positions)

        start_id = len(world.settlements)
        for i, (x, y) in enumerate(positions):
            name = self._generate_village_name(i)
            village = Settlement(
                id=start_id + i,
                name=name,
                settlement_type=SettlementType.VILLAGE,
                world_x=x,
                world_y=y,
                population=random.randint(50, 200),
                prosperity=random.randint(20, 50),
                garrison_limit=30,
            )
            world.settlements[start_id + i] = village
            world.villages.append(start_id + i)

    def _find_good_positions(self, world: World, count: int, min_distance: int = 10,
                              avoid_positions: List[Tuple[int, int]] = None) -> List[Tuple[int, int]]:
        """找到合适的位置"""
        positions = []
        avoid_positions = avoid_positions or []
        attempts = 0
        max_attempts = count * 100

        while len(positions) < count and attempts < max_attempts:
            x = random.randint(5, world.width - 5)
            y = random.randint(5, world.height - 5)

            # 检查地形
            terrain = world.get_terrain_at(x, y)
            if terrain == self.TERRAIN_WATER or terrain == self.TERRAIN_MOUNTAIN:
                attempts += 1
                continue

            # 检查与其他位置的距离
            too_close = False
            for px, py in positions + avoid_positions:
                dist = math.sqrt((x - px) ** 2 + (y - py) ** 2)
                if dist < min_distance:
                    too_close = True
                    break

            if not too_close:
                positions.append((x, y))

            attempts += 1

        return positions

    def _establish_hierarchy(self, world: World):
        """建立城镇-城堡-村庄的隶属关系"""
        # 村庄归属于最近的城镇或城堡
        for village_id in world.villages:
            village = world.settlements[village_id]

            # 找最近的城镇或城堡
            min_dist = float('inf')
            nearest_parent = None

            for town_id in world.towns + world.castles:
                parent = world.settlements[town_id]
                dist = math.sqrt(
                    (village.world_x - parent.world_x) ** 2 +
                    (village.world_y - parent.world_y) ** 2
                )
                if dist < min_dist:
                    min_dist = dist
                    nearest_parent = parent

            if nearest_parent:
                village.parent_settlement_id = nearest_parent.id
                nearest_parent.villages.append(village_id)

    def _generate_roads(self, world: World):
        """生成道路（连接定居点）"""
        # 连接城镇
        for i, town_id1 in enumerate(world.towns):
            for town_id2 in world.towns[i+1:]:
                town1 = world.settlements[town_id1]
                town2 = world.settlements[town_id2]
                self._create_road(world, town1.world_x, town1.world_y,
                                 town2.world_x, town2.world_y)

        # 连接城堡到最近的城镇
        for castle_id in world.castles:
            castle = world.settlements[castle_id]
            nearest_town = world.get_nearest_settlement(
                castle.world_x, castle.world_y, SettlementType.TOWN
            )
            if nearest_town:
                self._create_road(world, castle.world_x, castle.world_y,
                                 nearest_town.world_x, nearest_town.world_y)

    def _create_road(self, world: World, x1: int, y1: int, x2: int, y2: int):
        """创建道路（简单的直线道路）"""
        # 使用Bresenham算法
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        x, y = x1, y1
        while True:
            # 设置道路地形
            if world.get_terrain_at(x, y) != self.TERRAIN_WATER:
                world.terrain_map[y][x] = self.TERRAIN_ROAD

            if x == x2 and y == y2:
                break

            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

    def _assign_territories(self, world: World):
        """分配领地给势力"""
        # 将城镇分配给不同势力
        towns_per_faction = len(world.towns) // len(world.factions)

        for i, town_id in enumerate(world.towns):
            faction_id = i // towns_per_faction
            if faction_id >= len(world.factions):
                faction_id = len(world.factions) - 1

            town = world.settlements[town_id]
            town.faction_id = faction_id
            world.factions[faction_id].add_settlement(town_id, "城镇")

        # 城堡归属最近的城镇所属势力
        for castle_id in world.castles:
            castle = world.settlements[castle_id]
            nearest_town = world.get_nearest_settlement(
                castle.world_x, castle.world_y, SettlementType.TOWN
            )
            if nearest_town and nearest_town.faction_id is not None:
                castle.faction_id = nearest_town.faction_id
                world.factions[castle.faction_id].add_settlement(castle_id, "城堡")

        # 村庄归属其上级定居点的势力
        for village_id in world.villages:
            village = world.settlements[village_id]
            if village.parent_settlement_id is not None:
                parent = world.settlements[village.parent_settlement_id]
                village.faction_id = parent.faction_id
                if village.faction_id is not None:
                    world.factions[village.faction_id].add_settlement(village_id, "村庄")

    def _generate_town_name(self, index: int) -> str:
        """生成城镇名称"""
        prefixes = ["新", "北", "南", "东", "西", "大", "小", "古", "金", "银"]
        middles = ["月", "日", "星", "云", "风", "雨", "雷", "电", "山", "河"]
        suffixes = ["城", "堡", "镇", "港", "关"]

        if index < len(prefixes) * len(middles) * len(suffixes):
            p = index // (len(middles) * len(suffixes))
            m = (index % (len(middles) * len(suffixes))) // len(suffixes)
            s = index % len(suffixes)
            return prefixes[p] + middles[m] + suffixes[s]
        return f"城镇{index + 1}"

    def _generate_castle_name(self, index: int) -> str:
        """生成城堡名称"""
        if index < len(self.CASTLE_NAMES):
            return self.CASTLE_NAMES[index]
        return f"城堡{index + 1}"

    def _generate_village_name(self, index: int) -> str:
        """生成村庄名称"""
        prefixes = ["河", "山", "林", "草", "湖", "谷", "高", "平", "溪", "松",
                    "柳", "杨", "梅", "桃", "杏", "稻", "麦", "菜", "花", "石"]
        suffixes = ["边村", "脚村", "间村", "原村", "畔村", "地村", "地村", "原村", "谷村", "林村"]

        if index < len(prefixes) * len(suffixes):
            p = index // len(suffixes)
            s = index % len(suffixes)
            return prefixes[p] + suffixes[s]
        return f"村庄{index + 1}"