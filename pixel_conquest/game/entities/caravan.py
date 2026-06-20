"""
商队类
"""

from typing import List, Optional, Dict
from dataclasses import dataclass
from enum import Enum


class CaravanState(Enum):
    """商队状态"""
    IDLE = "idle"  # 空闲
    TRAVELING = "traveling"  # 旅行中
    TRADING = "trading"  # 交易中
    ATTACKED = "attacked"  # 被攻击


@dataclass
class TradeGood:
    """商品类"""
    id: int
    name: str
    base_price: int
    weight: int
    category: str  # food, material, luxury, weapon
    stack_size: int = 100


class Caravan:
    """商队类"""

    def __init__(self, caravan_id: int, owner_id: int):
        self.id = caravan_id
        self.owner_id = owner_id
        self.name = f"商队_{caravan_id}"

        # 位置
        self.world_x = 0.0
        self.world_y = 0.0
        self.destination_id: Optional[int] = None  # 目的地ID
        self.route: List[int] = []  # 贸易路线

        # 状态
        self.state = CaravanState.IDLE
        self.speed = 3.0  # 移动速度
        self.guards: List = []  # 护卫部队
        self.guard_capacity = 50  # 护卫容量

        # 货物
        self.goods: Dict[int, int] = {}  # 商品ID -> 数量
        self.capacity = 500  # 货物容量
        self.current_load = 0  # 当前载重

        # 资金
        self.gold = 1000
        self.profit = 0  # 累计利润

        # 统计
        self.trips_completed = 0
        self.distance_traveled = 0.0

    def add_good(self, good_id: int, quantity: int, weight: int) -> bool:
        """添加商品"""
        if self.current_load + weight * quantity <= self.capacity:
            self.goods[good_id] = self.goods.get(good_id, 0) + quantity
            self.current_load += weight * quantity
            return True
        return False

    def remove_good(self, good_id: int, quantity: int, weight: int) -> bool:
        """移除商品"""
        if good_id in self.goods and self.goods[good_id] >= quantity:
            self.goods[good_id] -= quantity
            if self.goods[good_id] <= 0:
                del self.goods[good_id]
            self.current_load -= weight * quantity
            return True
        return False

    def get_good_quantity(self, good_id: int) -> int:
        """获取商品数量"""
        return self.goods.get(good_id, 0)

    def add_guard(self, troop) -> bool:
        """添加护卫"""
        if len(self.guards) < self.guard_capacity:
            self.guards.append(troop)
            return True
        return False

    def remove_guard(self, index: int):
        """移除护卫"""
        if 0 <= index < len(self.guards):
            self.guards.pop(index)

    def get_guard_strength(self) -> int:
        """获取护卫战斗力"""
        return sum(troop.get_strength() for troop in self.guards)

    def set_destination(self, settlement_id: int):
        """设置目的地"""
        self.destination_id = settlement_id
        self.state = CaravanState.TRAVELING

    def update_position(self, target_x: float, target_y: float, delta_time: float):
        """更新位置"""
        import math

        dx = target_x - self.world_x
        dy = target_y - self.world_y
        distance = math.sqrt(dx * dx + dy * dy)

        if distance > 0.1:
            move_distance = self.speed * delta_time
            if move_distance >= distance:
                self.world_x = target_x
                self.world_y = target_y
                self.state = CaravanState.IDLE
                self.trips_completed += 1
            else:
                ratio = move_distance / distance
                self.world_x += dx * ratio
                self.world_y += dy * ratio
                self.distance_traveled += move_distance

    def calculate_trade_profit(self, buy_prices: Dict[int, int],
                                sell_prices: Dict[int, int]) -> int:
        """计算贸易利润"""
        total_profit = 0
        for good_id, quantity in self.goods.items():
            if good_id in buy_prices and good_id in sell_prices:
                profit_per_unit = sell_prices[good_id] - buy_prices[good_id]
                total_profit += profit_per_unit * quantity
        return total_profit

    def get_daily_cost(self) -> int:
        """获取每日维护费"""
        guard_cost = sum(troop.cost for troop in self.guards)
        return guard_cost + len(self.goods) * 5  # 商品维护费

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'world_x': self.world_x,
            'world_y': self.world_y,
            'destination_id': self.destination_id,
            'state': self.state.value,
            'goods': self.goods,
            'capacity': self.capacity,
            'current_load': self.current_load,
            'gold': self.gold,
            'profit': self.profit,
            'trips_completed': self.trips_completed,
            'distance_traveled': self.distance_traveled,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Caravan':
        """反序列化"""
        caravan = cls(data['id'], data['owner_id'])
        caravan.name = data['name']
        caravan.world_x = data['world_x']
        caravan.world_y = data['world_y']
        caravan.destination_id = data.get('destination_id')
        caravan.state = CaravanState(data['state'])
        caravan.goods = data['goods']
        caravan.capacity = data['capacity']
        caravan.current_load = data['current_load']
        caravan.gold = data['gold']
        caravan.profit = data['profit']
        caravan.trips_completed = data['trips_completed']
        caravan.distance_traveled = data['distance_traveled']
        return caravan