"""
军队类
"""

from typing import List, Optional
from dataclasses import dataclass, field
from enum import Enum


class TroopType(Enum):
    """兵种类型"""
    INFANTRY = "步兵"
    ARCHER = "弓箭手"
    CAVALRY = "骑兵"
    CROSSBOWMAN = "弩手"


@dataclass
class Troop:
    """士兵类"""
    name: str
    troop_type: TroopType
    tier: int = 1  # 阶级 1-5
    health: int = 50
    max_health: int = 50
    attack: int = 10
    defense: int = 5
    speed: int = 5
    cost: int = 10  # 维护费
    upgrade_cost: int = 50  # 升级费用
    upgrade_target: Optional[str] = None  # 升级目标兵种

    def get_strength(self) -> int:
        """获取战斗力"""
        return int((self.attack + self.defense) * (1 + self.tier * 0.2) * (self.health / self.max_health))

    def get_recruit_cost(self) -> int:
        """获取招募费用"""
        return self.cost * 10 * self.tier

    def get_sell_price(self) -> int:
        """获取出售价格（俘虏）"""
        return self.cost * 5 * self.tier

    def can_upgrade(self) -> bool:
        """是否可以升级"""
        return self.upgrade_target is not None and self.tier < 5

    def upgrade(self) -> bool:
        """升级"""
        if self.tier < 5:
            self.tier += 1
            self.max_health += 10
            self.health = self.max_health
            self.attack += 5
            self.defense += 3
            self.cost = int(self.cost * 1.5)
            return True
        return False


class Army:
    """军队类"""

    def __init__(self, owner_id: int):
        self.owner_id = owner_id
        self.troops: List[Troop] = []
        self.formation = "standard"  # 阵型
        self.morale = 100  # 士气
        self.provisions = 100  # 补给

    def add_troop(self, troop: Troop):
        """添加士兵"""
        self.troops.append(troop)

    def remove_troop(self, index: int) -> Optional[Troop]:
        """移除士兵"""
        if 0 <= index < len(self.troops):
            return self.troops.pop(index)
        return None

    def get_total_strength(self) -> int:
        """获取总战斗力"""
        return sum(troop.get_strength() for troop in self.troops)

    def get_total_count(self) -> int:
        """获取士兵总数"""
        return len(self.troops)

    def get_troops_by_type(self, troop_type: TroopType) -> List[Troop]:
        """按类型获取士兵"""
        return [t for t in self.troops if t.troop_type == troop_type]

    def get_daily_cost(self) -> int:
        """获取每日维护费"""
        return sum(troop.cost for troop in self.troops)

    def take_losses(self, casualties: int):
        """承受伤亡"""
        for _ in range(min(casualties, len(self.troops))):
            if self.troops:
                self.troops.pop()

    def heal_troops(self, amount: int):
        """治疗士兵"""
        for troop in self.troops:
            troop.health = min(troop.health + amount, troop.max_health)

    def update_morale(self, delta: int):
        """更新士气"""
        self.morale = max(0, min(100, self.morale + delta))

    def consume_provisions(self, amount: int):
        """消耗补给"""
        self.provisions = max(0, self.provisions - amount)
        if self.provisions <= 0:
            # 补给不足，士气下降
            self.morale -= 5

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'owner_id': self.owner_id,
            'troops': [
                {
                    'name': t.name,
                    'troop_type': t.troop_type.value,
                    'tier': t.tier,
                    'health': t.health,
                    'max_health': t.max_health,
                    'attack': t.attack,
                    'defense': t.defense,
                    'speed': t.speed,
                    'cost': t.cost,
                }
                for t in self.troops
            ],
            'morale': self.morale,
            'provisions': self.provisions,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Army':
        """反序列化"""
        army = cls(data['owner_id'])
        army.morale = data['morale']
        army.provisions = data['provisions']

        for troop_data in data['troops']:
            troop = Troop(
                name=troop_data['name'],
                troop_type=TroopType(troop_data['troop_type']),
                tier=troop_data['tier'],
                health=troop_data['health'],
                max_health=troop_data['max_health'],
                attack=troop_data['attack'],
                defense=troop_data['defense'],
                speed=troop_data['speed'],
                cost=troop_data['cost'],
            )
            army.troops.append(troop)

        return army