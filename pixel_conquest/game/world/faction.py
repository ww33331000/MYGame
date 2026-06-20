"""
势力类
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum
import random


class FactionRelation(Enum):
    """势力关系"""
    ENEMY = -50  # 敌对
    HOSTILE = -25  # 敌视
    NEUTRAL = 0  # 中立
    FRIENDLY = 25  # 友好
    ALLIED = 50  # 同盟


@dataclass
class Faction:
    """势力类"""
    id: int
    name: str
    color: tuple  # 势力颜色 (R, G, B)

    # 领袖
    leader_id: Optional[int] = None

    # 成员
    members: List[int] = field(default_factory=list)  # 成员NPC ID列表

    # 领地
    settlements: List[int] = field(default_factory=list)  # 领地ID列表
    towns: List[int] = field(default_factory=list)  # 城镇
    castles: List[int] = field(default_factory=list)  # 城堡
    villages: List[int] = field(default_factory=list)  # 村庄

    # 军事
    armies: List[int] = field(default_factory=list)  # 军团ID列表
    total_strength: int = 0  # 总兵力

    # 经济
    treasury: int = 10000  # 国库
    daily_income: int = 0  # 每日收入
    daily_expenses: int = 0  # 每日支出

    # 政治
    relations: Dict[int, int] = field(default_factory=dict)  # 与其他势力的关系
    at_war: List[int] = field(default_factory=list)  # 战争中的势力
    alliances: List[int] = field(default_factory=list)  # 同盟势力

    # 政策
    tax_rate: float = 0.2  # 税率
    marshal_id: Optional[int] = None  # 元帅ID

    # 统计
    total_lords: int = 0  # 领主数量
    total_settlements: int = 0  # 领地数量
    days_existed: int = 0  # 存在天数

    def add_member(self, npc_id: int):
        """添加成员"""
        if npc_id not in self.members:
            self.members.append(npc_id)
            self.total_lords = len(self.members)

    def remove_member(self, npc_id: int):
        """移除成员"""
        if npc_id in self.members:
            self.members.remove(npc_id)
            self.total_lords = len(self.members)

    def add_settlement(self, settlement_id: int, settlement_type: str):
        """添加领地"""
        if settlement_id not in self.settlements:
            self.settlements.append(settlement_id)
            if settlement_type == "城镇":
                self.towns.append(settlement_id)
            elif settlement_type == "城堡":
                self.castles.append(settlement_id)
            elif settlement_type == "村庄":
                self.villages.append(settlement_id)
            self.total_settlements = len(self.settlements)

    def remove_settlement(self, settlement_id: int):
        """移除领地"""
        if settlement_id in self.settlements:
            self.settlements.remove(settlement_id)
            if settlement_id in self.towns:
                self.towns.remove(settlement_id)
            elif settlement_id in self.castles:
                self.castles.remove(settlement_id)
            elif settlement_id in self.villages:
                self.villages.remove(settlement_id)
            self.total_settlements = len(self.settlements)

    def set_relation(self, faction_id: int, value: int):
        """设置关系值"""
        self.relations[faction_id] = max(-100, min(100, value))

        # 更新战争/同盟状态
        if value <= -50:
            if faction_id not in self.at_war:
                self.at_war.append(faction_id)
            if faction_id in self.alliances:
                self.alliances.remove(faction_id)
        elif value >= 50:
            if faction_id not in self.alliances:
                self.alliances.append(faction_id)
            if faction_id in self.at_war:
                self.at_war.remove(faction_id)
        else:
            if faction_id in self.at_war:
                self.at_war.remove(faction_id)
            if faction_id in self.alliances:
                self.alliances.remove(faction_id)

    def get_relation(self, faction_id: int) -> int:
        """获取关系值"""
        return self.relations.get(faction_id, 0)

    def is_at_war(self, faction_id: int) -> bool:
        """是否处于战争"""
        return faction_id in self.at_war

    def is_allied(self, faction_id: int) -> bool:
        """是否同盟"""
        return faction_id in self.alliances

    def declare_war(self, faction_id: int):
        """宣战"""
        self.set_relation(faction_id, -50)

    def make_peace(self, faction_id: int):
        """议和"""
        self.set_relation(faction_id, 0)

    def form_alliance(self, faction_id: int):
        """结盟"""
        self.set_relation(faction_id, 50)

    def break_alliance(self, faction_id: int):
        """解除同盟"""
        self.set_relation(faction_id, 25)

    def update_daily(self):
        """每日更新"""
        self.days_existed += 1

        # 计算收入和支出
        self.daily_income = 0
        self.daily_expenses = 0

        # TODO: 根据领地计算收入
        # TODO: 根据军队计算支出

        # 更新国库
        self.treasury += self.daily_income - self.daily_expenses

    def can_recruit_army(self, cost: int) -> bool:
        """是否可以招募军队"""
        return self.treasury >= cost

    def recruit_army(self, cost: int) -> bool:
        """招募军队"""
        if self.can_recruit_army(cost):
            self.treasury -= cost
            return True
        return False

    def get_random_lord(self) -> Optional[int]:
        """随机获取一个领主"""
        if self.members:
            return random.choice(self.members)
        return None

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'leader_id': self.leader_id,
            'members': self.members,
            'settlements': self.settlements,
            'towns': self.towns,
            'castles': self.castles,
            'villages': self.villages,
            'treasury': self.treasury,
            'relations': self.relations,
            'at_war': self.at_war,
            'alliances': self.alliances,
            'tax_rate': self.tax_rate,
            'marshal_id': self.marshal_id,
            'days_existed': self.days_existed,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Faction':
        """反序列化"""
        faction = cls(
            id=data['id'],
            name=data['name'],
            color=tuple(data['color']),
        )
        faction.leader_id = data.get('leader_id')
        faction.members = data.get('members', [])
        faction.settlements = data.get('settlements', [])
        faction.towns = data.get('towns', [])
        faction.castles = data.get('castles', [])
        faction.villages = data.get('villages', [])
        faction.treasury = data.get('treasury', 10000)
        faction.relations = data.get('relations', {})
        faction.at_war = data.get('at_war', [])
        faction.alliances = data.get('alliances', [])
        faction.tax_rate = data.get('tax_rate', 0.2)
        faction.marshal_id = data.get('marshal_id')
        faction.days_existed = data.get('days_existed', 0)
        faction.total_lords = len(faction.members)
        faction.total_settlements = len(faction.settlements)
        return faction