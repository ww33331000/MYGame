"""
定居点类（城镇、城堡、村庄）
"""

from typing import List, Optional, Dict
from dataclasses import dataclass, field
from enum import Enum


class SettlementType(Enum):
    """定居点类型"""
    TOWN = "城镇"
    CASTLE = "城堡"
    VILLAGE = "村庄"


@dataclass
class Settlement:
    """定居点类"""
    id: int
    name: str
    settlement_type: SettlementType
    world_x: int  # 世界地图X坐标
    world_y: int  # 世界地图Y坐标

    # 隶属关系
    faction_id: Optional[int] = None  # 所属势力
    owner_id: Optional[int] = None  # 领主ID
    parent_settlement_id: Optional[int] = None  # 上级定居点（村庄属于城堡或城镇）

    # 人口和经济
    population: int = 100
    prosperity: int = 50  # 繁荣度 0-100
    loyalty: int = 50  # 忠诚度 0-100

    # 资源
    resources: Dict[str, int] = field(default_factory=dict)  # 资源产量
    goods: Dict[int, int] = field(default_factory=dict)  # 商品库存
    prices: Dict[int, int] = field(default_factory=dict)  # 商品价格

    # 军事
    garrison: List = field(default_factory=list)  # 驻军
    garrison_limit: int = 100  # 驻军上限

    # 建筑
    buildings: List[str] = field(default_factory=list)  # 已建造的建筑

    # 村庄列表（城镇/城堡管辖的村庄）
    villages: List[int] = field(default_factory=list)

    # 围城状态
    is_under_siege: bool = False
    siege_days: int = 0

    def get_garrison_strength(self) -> int:
        """获取驻军战斗力"""
        return sum(troop.get_strength() for troop in self.garrison)

    def get_daily_income(self) -> int:
        """获取每日收入"""
        base_income = {
            SettlementType.TOWN: 500,
            SettlementType.CASTLE: 200,
            SettlementType.VILLAGE: 50,
        }
        income = base_income.get(self.settlement_type, 50)
        income *= (self.prosperity / 50)  # 繁荣度影响
        income *= (self.population / 100)  # 人口影响
        return int(income)

    def get_recruit_pool(self) -> List:
        """获取可招募士兵池"""
        if self.settlement_type == SettlementType.VILLAGE:
            # 村庄提供基础兵
            return self._generate_village_recruits()
        elif self.settlement_type == SettlementType.TOWN:
            # 城镇提供更高级的兵
            return self._generate_town_recruits()
        return []

    def _generate_village_recruits(self) -> List:
        """生成村庄招募池"""
        from game.entities.army import Troop, TroopType
        recruits = []
        num_recruits = min(self.population // 20, 10)
        for _ in range(num_recruits):
            recruits.append(Troop(
                name="农民",
                troop_type=TroopType.INFANTRY,
                tier=1,
                health=30,
                max_health=30,
                attack=5,
                defense=2,
                cost=5,
            ))
        return recruits

    def _generate_town_recruits(self) -> List:
        """生成城镇招募池"""
        from game.entities.army import Troop, TroopType
        recruits = []
        num_recruits = min(self.population // 50, 20)
        for _ in range(num_recruits // 2):
            recruits.append(Troop(
                name="民兵",
                troop_type=TroopType.INFANTRY,
                tier=1,
                health=40,
                max_health=40,
                attack=8,
                defense=5,
                cost=8,
            ))
        for _ in range(num_recruits // 4):
            recruits.append(Troop(
                name="弓箭手",
                troop_type=TroopType.ARCHER,
                tier=1,
                health=35,
                max_health=35,
                attack=10,
                defense=3,
                cost=10,
            ))
        return recruits

    def update_daily(self):
        """每日更新"""
        # 人口增长
        growth_rate = 0.001 * (self.prosperity / 50)
        self.population = int(self.population * (1 + growth_rate))

        # 繁荣度变化
        if self.is_under_siege:
            self.prosperity = max(0, self.prosperity - 1)
        else:
            # 缓慢恢复
            self.prosperity = min(100, self.prosperity + 0.1)

        # 忠诚度变化
        if self.faction_id is None:
            self.loyalty = max(0, self.loyalty - 1)
        else:
            self.loyalty = min(100, self.loyalty + 0.1)

        # 驻军维护费
        garrison_cost = sum(troop.cost for troop in self.garrison)

    def add_garrison(self, troop) -> bool:
        """添加驻军"""
        if len(self.garrison) < self.garrison_limit:
            self.garrison.append(troop)
            return True
        return False

    def remove_garrison(self, index: int):
        """移除驻军"""
        if 0 <= index < len(self.garrison):
            return self.garrison.pop(index)
        return None

    def can_build(self, building_name: str) -> bool:
        """检查是否可以建造建筑"""
        # TODO: 实现建筑系统
        return building_name not in self.buildings

    def build(self, building_name: str) -> bool:
        """建造建筑"""
        if self.can_build(building_name):
            self.buildings.append(building_name)
            return True
        return False

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'id': self.id,
            'name': self.name,
            'settlement_type': self.settlement_type.value,
            'world_x': self.world_x,
            'world_y': self.world_y,
            'faction_id': self.faction_id,
            'owner_id': self.owner_id,
            'parent_settlement_id': self.parent_settlement_id,
            'population': self.population,
            'prosperity': self.prosperity,
            'loyalty': self.loyalty,
            'resources': self.resources,
            'goods': self.goods,
            'prices': self.prices,
            'garrison_limit': self.garrison_limit,
            'buildings': self.buildings,
            'villages': self.villages,
            'is_under_siege': self.is_under_siege,
            'siege_days': self.siege_days,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Settlement':
        """反序列化"""
        settlement = cls(
            id=data['id'],
            name=data['name'],
            settlement_type=SettlementType(data['settlement_type']),
            world_x=data['world_x'],
            world_y=data['world_y'],
        )
        settlement.faction_id = data.get('faction_id')
        settlement.owner_id = data.get('owner_id')
        settlement.parent_settlement_id = data.get('parent_settlement_id')
        settlement.population = data['population']
        settlement.prosperity = data['prosperity']
        settlement.loyalty = data['loyalty']
        settlement.resources = data.get('resources', {})
        settlement.goods = data.get('goods', {})
        settlement.prices = data.get('prices', {})
        settlement.garrison_limit = data['garrison_limit']
        settlement.buildings = data.get('buildings', [])
        settlement.villages = data.get('villages', [])
        settlement.is_under_siege = data.get('is_under_siege', False)
        settlement.siege_days = data.get('siege_days', 0)
        return settlement