"""
NPC类
"""

from typing import Optional, List
from enum import Enum
from .character import Character, CharacterClass


class NPCType(Enum):
    """NPC类型"""
    LORD = "领主"  # 贵族领主
    MERCHANT = "商人"  # 商人
    QUEST_GIVER = "任务发布者"  # 任务NPC
    TRAINER = "训练师"  # 技能训练师
    BLACKSMITH = "铁匠"  # 装备打造
    TAVERN_KEEPER = "酒馆老板"  # 招募士兵
    PRISON_GUARD = "监狱守卫"  # 监狱
    VILLAGE_ELDER = "村长"  # 村庄
    BANDIT = "土匪"  # 敌对NPC
    WANDERER = "流浪者"  # 可招募同伴


class NPC(Character):
    """NPC类"""

    def __init__(self, name: str, npc_type: NPCType, character_class: CharacterClass = CharacterClass.WARRIOR):
        super().__init__(name, character_class)
        self.npc_type = npc_type
        self.dialogue_id: Optional[str] = None  # 对话ID
        self.quest_ids: List[str] = []  # 可提供的任务ID
        self.shop_inventory: List = []  # 商店物品
        self.recruit_pool: List = []  # 可招募士兵池
        self.home_settlement_id: Optional[int] = None  # 所属领地
        self.faction_id: Optional[int] = None  # 所属势力
        self.patrol_route: List = []  # 巡逻路线
        self.is_hostile = False  # 是否敌对
        self.ai_state = "idle"  # AI状态

        # 领主特有属性
        self.owned_fiefs: List[int] = []  # 拥有的封地
        self.army: List = []  # 军队
        self.wealth = 1000  # 财富

    def get_dialogue(self) -> Optional[str]:
        """获取对话"""
        # TODO: 从对话系统获取
        return self.dialogue_id

    def can_give_quest(self) -> bool:
        """是否可以提供任务"""
        return len(self.quest_ids) > 0

    def get_available_quests(self, player) -> List:
        """获取可用任务"""
        # TODO: 检查任务条件
        return self.quest_ids

    def has_shop(self) -> bool:
        """是否有商店"""
        return len(self.shop_inventory) > 0

    def can_recruit(self) -> bool:
        """是否可以招募"""
        return len(self.recruit_pool) > 0

    def update_ai(self, delta_time: float, world):
        """更新AI"""
        if self.npc_type == NPCType.LORD:
            self._update_lord_ai(delta_time, world)
        elif self.npc_type == NPCType.BANDIT:
            self._update_bandit_ai(delta_time, world)
        elif self.npc_type == NPCType.MERCHANT:
            self._update_merchant_ai(delta_time, world)

    def _update_lord_ai(self, delta_time: float, world):
        """领主AI"""
        # TODO: 实现领主AI逻辑
        # - 巡逻领地
        # - 参与战争
        # - 举办宴会
        pass

    def _update_bandit_ai(self, delta_time: float, world):
        """土匪AI"""
        # TODO: 实现土匪AI逻辑
        # - 拦截商队
        # - 袭击村庄
        # - 逃避强大敌人
        pass

    def _update_merchant_ai(self, delta_time: float, world):
        """商人AI"""
        # TODO: 实现商人AI逻辑
        # - 在城镇间移动
        # - 买卖商品
        pass

    def to_dict(self) -> dict:
        """序列化"""
        return {
            'name': self.name,
            'npc_type': self.npc_type.value,
            'level': self.level,
            'health': self.health,
            'faction_id': self.faction_id,
            'home_settlement_id': self.home_settlement_id,
            'is_hostile': self.is_hostile,
            'wealth': self.wealth,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'NPC':
        """反序列化"""
        npc_type = NPCType(data['npc_type'])
        npc = cls(data['name'], npc_type)
        npc.data.level = data['level']
        npc.data.health = data['health']
        npc.faction_id = data.get('faction_id')
        npc.home_settlement_id = data.get('home_settlement_id')
        npc.is_hostile = data.get('is_hostile', False)
        npc.wealth = data.get('wealth', 1000)
        return npc