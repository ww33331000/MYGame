"""
玩家类
"""

from typing import List, Optional, Dict
from .character import Character, CharacterClass
from game.core.settings import Settings


class Player(Character):
    """玩家角色类"""

    def __init__(self, name: str = "玩家"):
        super().__init__(name, CharacterClass.WARRIOR)

        # 玩家特有属性
        self.gold = Settings.STARTING_GOLD
        self.renown = 0  # 声望
        self.honor = 0  # 荣誉
        self.right_to_rule = 0  # 统治权

        # 玩家部队
        self.party: List = []  # 部队成员列表
        self.party_size_limit = 20  # 部队上限

        # 俘虏
        self.prisoners: List = []  # 俘虏列表
        self.prisoner_limit = 10  # 俘虏上限

        # 隶属关系
        self.faction_id: Optional[int] = None  # 所属势力ID
        self.faction_rank = 0  # 势力中的等级

        # 领地
        self.owned_settlements: List[int] = []  # 拥有的领地ID列表

        # 商队
        self.caravans: List[int] = []  # 拥有的商队ID列表

        # 任务
        self.active_quests: List = []  # 进行中的任务
        self.completed_quests: List = []  # 已完成的任务

        # 关系
        self.relations: Dict[int, int] = {}  # 与NPC/势力的关系 (-100 到 100)

        # 地图位置
        self.world_x = 0.0
        self.world_y = 0.0
        self.world_speed = 5.0  # 地图移动速度

        # 时间
        self.play_time = 0  # 游戏时间（秒）

    def can_recruit(self) -> bool:
        """检查是否可以招募更多士兵"""
        return len(self.party) < self.party_size_limit

    def recruit_troop(self, troop) -> bool:
        """招募士兵"""
        if not self.can_recruit():
            return False

        recruit_cost = troop.get_recruit_cost()
        if self.gold >= recruit_cost:
            self.gold -= recruit_cost
            self.party.append(troop)
            return True
        return False

    def dismiss_troop(self, index: int):
        """解散士兵"""
        if 0 <= index < len(self.party):
            self.party.pop(index)

    def get_party_strength(self) -> int:
        """获取部队总战斗力"""
        total = self.get_attack_power() + self.get_defense()
        for troop in self.party:
            total += troop.get_strength()
        return total

    def get_party_size(self) -> int:
        """获取部队人数"""
        return len(self.party) + 1  # +1 是玩家自己

    def add_prisoner(self, prisoner):
        """添加俘虏"""
        if len(self.prisoners) < self.prisoner_limit:
            self.prisoners.append(prisoner)
            return True
        return False

    def sell_prisoner(self, index: int) -> int:
        """出售俘虏"""
        if 0 <= index < len(self.prisoners):
            prisoner = self.prisoners.pop(index)
            sell_price = prisoner.get_sell_price()
            self.gold += sell_price
            return sell_price
        return 0

    def recruit_prisoner(self, index: int) -> bool:
        """招募俘虏"""
        if 0 <= index < len(self.prisoners):
            if self.can_recruit():
                prisoner = self.prisoners.pop(index)
                self.party.append(prisoner)
                return True
        return False

    def change_relation(self, entity_id: int, amount: int):
        """改变关系值"""
        current = self.relations.get(entity_id, 0)
        new_value = max(-100, min(100, current + amount))
        self.relations[entity_id] = new_value

    def get_relation(self, entity_id: int) -> int:
        """获取关系值"""
        return self.relations.get(entity_id, 0)

    def add_renown(self, amount: int):
        """增加声望"""
        self.renown += amount
        # 声望影响部队上限
        self.party_size_limit = 20 + self.renown // 10

    def add_honor(self, amount: int):
        """增加/减少荣誉"""
        self.honor = max(-100, min(100, self.honor + amount))

    def join_faction(self, faction_id: int):
        """加入势力"""
        self.faction_id = faction_id
        self.faction_rank = 0

    def leave_faction(self):
        """离开势力"""
        self.faction_id = None
        self.faction_rank = 0

    def create_own_faction(self, faction_name: str) -> 'Faction':
        """创建自己的势力"""
        from game.world.faction import Faction
        self.faction_id = None  # 将在新势力创建后设置
        self.right_to_rule += 50
        # 势力创建将在外部完成
        return None

    def claim_settlement(self, settlement_id: int):
        """宣称领地"""
        if settlement_id not in self.owned_settlements:
            self.owned_settlements.append(settlement_id)

    def lose_settlement(self, settlement_id: int):
        """失去领地"""
        if settlement_id in self.owned_settlements:
            self.owned_settlements.remove(settlement_id)

    def update(self, delta_time: float):
        """更新玩家状态"""
        super().update(delta_time)
        self.play_time += delta_time

        # 更新部队
        for troop in self.party:
            if hasattr(troop, 'update'):
                troop.update(delta_time)

    def to_dict(self) -> dict:
        """序列化为字典"""
        return {
            'name': self.name,
            'level': self.level,
            'experience': self.data.experience,
            'health': self.health,
            'max_health': self.data.max_health,
            'gold': self.gold,
            'renown': self.renown,
            'honor': self.honor,
            'right_to_rule': self.right_to_rule,
            'faction_id': self.faction_id,
            'world_x': self.world_x,
            'world_y': self.world_y,
            'party_size_limit': self.party_size_limit,
            'owned_settlements': self.owned_settlements,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Player':
        """从字典反序列化"""
        player = cls(data['name'])
        player.data.level = data['level']
        player.data.experience = data['experience']
        player.data.health = data['health']
        player.data.max_health = data['max_health']
        player.gold = data['gold']
        player.renown = data['renown']
        player.honor = data['honor']
        player.right_to_rule = data['right_to_rule']
        player.faction_id = data.get('faction_id')
        player.world_x = data['world_x']
        player.world_y = data['world_y']
        player.party_size_limit = data['party_size_limit']
        player.owned_settlements = data.get('owned_settlements', [])
        return player