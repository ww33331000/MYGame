"""
世界类
"""

from typing import List, Dict, Optional, Tuple
import random
import math

from .settlement import Settlement, SettlementType
from .faction import Faction


class World:
    """游戏世界类"""

    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height

        # 地图数据
        self.terrain_map: List[List[int]] = []  # 地形图
        self.height_map: List[List[float]] = []  # 高度图

        # 定居点
        self.settlements: Dict[int, Settlement] = {}
        self.towns: List[int] = []
        self.castles: List[int] = []
        self.villages: List[int] = []

        # 势力
        self.factions: Dict[int, Faction] = {}

        # NPC
        self.npcs: Dict[int, any] = {}  # NPC ID -> NPC对象

        # 商队
        self.caravans: Dict[int, any] = {}

        # 时间
        self.day = 1
        self.hour = 6  # 从早上6点开始
        self.time_speed = 1.0  # 时间流速

        # 天气
        self.weather = "sunny"
        self.weather_duration = 0

        # 事件
        self.active_events: List = []

    def get_settlement(self, settlement_id: int) -> Optional[Settlement]:
        """获取定居点"""
        return self.settlements.get(settlement_id)

    def get_faction(self, faction_id: int) -> Optional[Faction]:
        """获取势力"""
        return self.factions.get(faction_id)

    def get_settlements_by_faction(self, faction_id: int) -> List[Settlement]:
        """获取势力的所有领地"""
        return [s for s in self.settlements.values() if s.faction_id == faction_id]

    def get_nearest_settlement(self, x: float, y: float,
                                settlement_type: Optional[SettlementType] = None) -> Optional[Settlement]:
        """获取最近的定居点"""
        nearest = None
        min_dist = float('inf')

        for settlement in self.settlements.values():
            if settlement_type and settlement.settlement_type != settlement_type:
                continue

            dist = math.sqrt((settlement.world_x - x) ** 2 + (settlement.world_y - y) ** 2)
            if dist < min_dist:
                min_dist = dist
                nearest = settlement

        return nearest

    def get_settlements_in_range(self, x: float, y: float, range_val: float) -> List[Settlement]:
        """获取范围内的定居点"""
        result = []
        for settlement in self.settlements.values():
            dist = math.sqrt((settlement.world_x - x) ** 2 + (settlement.world_y - y) ** 2)
            if dist <= range_val:
                result.append(settlement)
        return result

    def update_time(self, delta_time: float):
        """更新时间"""
        # 每60秒游戏时间增加1小时
        self.hour += delta_time * self.time_speed / 60

        if self.hour >= 24:
            self.hour -= 24
            self.day += 1
            self._on_new_day()

    def _on_new_day(self):
        """新的一天"""
        # 更新所有定居点
        for settlement in self.settlements.values():
            settlement.update_daily()

        # 更新所有势力
        for faction in self.factions.values():
            faction.update_daily()

        # 更新天气
        self._update_weather()

        # 触发随机事件
        self._trigger_random_events()

    def _update_weather(self):
        """更新天气"""
        self.weather_duration -= 1
        if self.weather_duration <= 0:
            # 随机新天气
            weathers = ["sunny", "cloudy", "rainy", "stormy", "snowy"]
            weights = [40, 30, 15, 10, 5]
            self.weather = random.choices(weathers, weights)[0]
            self.weather_duration = random.randint(1, 5)

    def _trigger_random_events(self):
        """触发随机事件"""
        # TODO: 实现随机事件系统
        pass

    def get_terrain_at(self, x: int, y: int) -> int:
        """获取指定位置的地形"""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.terrain_map[y][x]
        return 0

    def get_movement_cost(self, x: int, y: int) -> float:
        """获取移动消耗"""
        terrain = self.get_terrain_at(x, y)
        # 不同地形的移动消耗
        costs = {
            0: 1.0,   # 平原
            1: 1.5,   # 森林
            2: 2.0,   # 山地
            3: 3.0,   # 沼泽
            4: 0.8,   # 道路
            5: 999,   # 水域（不可通行）
        }
        return costs.get(terrain, 1.0)

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'width': self.width,
            'height': self.height,
            'terrain_map': self.terrain_map,
            'height_map': self.height_map,
            'settlements': {k: v.to_dict() for k, v in self.settlements.items()},
            'towns': self.towns,
            'castles': self.castles,
            'villages': self.villages,
            'factions': {k: v.to_dict() for k, v in self.factions.items()},
            'day': self.day,
            'hour': self.hour,
            'weather': self.weather,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'World':
        """反序列化"""
        world = cls(data['width'], data['height'])
        world.terrain_map = data['terrain_map']
        world.height_map = data['height_map']
        world.towns = data['towns']
        world.castles = data['castles']
        world.villages = data['villages']
        world.day = data['day']
        world.hour = data['hour']
        world.weather = data['weather']

        # 恢复定居点
        for sid, sdata in data['settlements'].items():
            world.settlements[int(sid)] = Settlement.from_dict(sdata)

        # 恢复势力
        for fid, fdata in data['factions'].items():
            world.factions[int(fid)] = Faction.from_dict(fdata)

        return world