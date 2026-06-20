"""
角色基类
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum


class CharacterClass(Enum):
    """角色职业"""
    WARRIOR = "战士"
    MAGE = "法师"
    ARCHER = "弓箭手"
    ROGUE = "盗贼"
    MERCHANT = "商人"
    LEADER = "领袖"


@dataclass
class Stats:
    """角色属性"""
    strength: int = 10  # 力量 - 影响近战伤害
    agility: int = 10  # 敏捷 - 影响攻击速度和闪避
    intelligence: int = 10  # 智力 - 影响技能和魔法
    charisma: int = 10  # 魅力 - 影响领导和交易
    endurance: int = 10  # 耐力 - 影响生命值和负重
    luck: int = 10  # 运气 - 影响暴击和随机事件


@dataclass
class Skills:
    """角色技能"""
    # 战斗技能
    one_handed: int = 0  # 单手武器
    two_handed: int = 0  # 双手武器
    polearm: int = 0  # 长柄武器
    archery: int = 0  # 弓箭
    crossbow: int = 0  # 弩
    throwing: int = 0  # 投掷

    # 辅助技能
    riding: int = 0  # 骑术
    athletics: int = 0  # 跑动
    shield: int = 0  # 盾牌
    tactics: int = 0  # 战术
    looting: int = 0  # 掠夺

    # 社交技能
    trading: int = 0  # 交易
    leadership: int = 0  # 统御
    prisoner_management: int = 0  # 俘虏管理
    persuasion: int = 0  # 说服

    # 技术技能
    engineering: int = 0  # 工程
    surgery: int = 0  # 手术
    first_aid: int = 0  # 急救
    wound_treatment: int = 0  # 疗伤
    inventory_management: int = 0  # 物品管理
    spotting: int = 0  # 侦查
    tracking: int = 0  # 追踪
    trainer: int = 0  # 教练


@dataclass
class CharacterData:
    """角色数据"""
    name: str
    level: int = 1
    experience: int = 0
    health: int = 100
    max_health: int = 100
    stamina: int = 100
    max_stamina: int = 100
    gold: int = 0
    stats: Stats = field(default_factory=Stats)
    skills: Skills = field(default_factory=Skills)
    character_class: CharacterClass = CharacterClass.WARRIOR


class Character:
    """角色基类"""

    def __init__(self, name: str, character_class: CharacterClass = CharacterClass.WARRIOR):
        self.data = CharacterData(name=name, character_class=character_class)
        self.inventory: List = []  # 物品栏
        self.equipment: Dict = {  # 装备栏
            'head': None,
            'body': None,
            'legs': None,
            'feet': None,
            'gloves': None,
            'weapon1': None,
            'weapon2': None,
            'shield': None,
            'mount': None,
        }
        self.buffs: List = []  # 增益/减益效果
        self.is_alive = True

    @property
    def name(self) -> str:
        return self.data.name

    @property
    def level(self) -> int:
        return self.data.level

    @property
    def health(self) -> int:
        return self.data.health

    @health.setter
    def health(self, value: int):
        self.data.health = max(0, min(value, self.data.max_health))
        if self.data.health <= 0:
            self.is_alive = False

    @property
    def stamina(self) -> int:
        return self.data.stamina

    @stamina.setter
    def stamina(self, value: int):
        self.data.stamina = max(0, min(value, self.data.max_stamina))

    def gain_experience(self, amount: int):
        """获得经验"""
        self.data.experience += amount
        self._check_level_up()

    def _check_level_up(self):
        """检查升级"""
        exp_needed = self._get_exp_for_level(self.data.level + 1)
        while self.data.experience >= exp_needed:
            self.data.experience -= exp_needed
            self._level_up()
            exp_needed = self._get_exp_for_level(self.data.level + 1)

    def _get_exp_for_level(self, level: int) -> int:
        """获取指定等级所需经验"""
        return int(100 * (level ** 1.5))

    def _level_up(self):
        """升级"""
        self.data.level += 1
        self.data.max_health += 10 + self.data.stats.endurance // 2
        self.data.max_stamina += 5 + self.data.stats.endurance // 4
        self.data.health = self.data.max_health
        self.data.stamina = self.data.max_stamina
        # TODO: 属性点分配

    def equip_item(self, item, slot: str) -> bool:
        """装备物品"""
        if slot not in self.equipment:
            return False

        # 如果该槽位已有装备，放入背包
        if self.equipment[slot]:
            self.inventory.append(self.equipment[slot])

        # 从背包移除新装备
        if item in self.inventory:
            self.inventory.remove(item)

        self.equipment[slot] = item
        return True

    def unequip_item(self, slot: str) -> bool:
        """卸下装备"""
        if slot not in self.equipment or not self.equipment[slot]:
            return False

        self.inventory.append(self.equipment[slot])
        self.equipment[slot] = None
        return True

    def get_attack_power(self) -> int:
        """计算攻击力"""
        base_attack = 10 + self.data.stats.strength

        # 加上武器攻击力
        weapon = self.equipment.get('weapon1')
        if weapon:
            base_attack += weapon.attack

        # 技能加成
        if weapon:
            if weapon.weapon_type == 'one_handed':
                base_attack += self.data.skills.one_handed * 2
            elif weapon.weapon_type == 'two_handed':
                base_attack += self.data.skills.two_handed * 2
            elif weapon.weapon_type == 'polearm':
                base_attack += self.data.skills.polearm * 2

        return base_attack

    def get_defense(self) -> int:
        """计算防御力"""
        base_defense = 5 + self.data.stats.endurance // 2

        # 加上装备防御力
        for slot, item in self.equipment.items():
            if item and hasattr(item, 'defense'):
                base_defense += item.defense

        return base_defense

    def take_damage(self, damage: int) -> int:
        """受到伤害"""
        defense = self.get_defense()
        actual_damage = max(1, damage - defense)
        self.health -= actual_damage
        return actual_damage

    def heal(self, amount: int):
        """恢复生命"""
        self.health = min(self.health + amount, self.data.max_health)

    def restore_stamina(self, amount: int):
        """恢复体力"""
        self.stamina = min(self.stamina + amount, self.data.max_stamina)

    def update(self, delta_time: float):
        """更新角色状态"""
        # 体力恢复
        self.restore_stamina(int(delta_time * 2))

        # 更新buff
        for buff in self.buffs[:]:
            buff.duration -= delta_time
            if buff.duration <= 0:
                self.buffs.remove(buff)