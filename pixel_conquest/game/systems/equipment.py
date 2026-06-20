"""
装备系统
"""

from typing import Dict, Optional
from dataclasses import dataclass
from enum import Enum


class EquipmentType(Enum):
    """装备类型"""
    HEAD = "头部"
    BODY = "身体"
    LEGS = "腿部"
    FEET = "脚部"
    GLOVES = "手套"
    ONE_HANDED = "单手武器"
    TWO_HANDED = "双手武器"
    POLEARM = "长柄武器"
    BOW = "弓"
    CROSSBOW = "弩"
    SHIELD = "盾牌"
    MOUNT = "坐骑"


class WeaponType(Enum):
    """武器类型"""
    SWORD = "剑"
    AXE = "斧"
    MACE = "锤"
    SPEAR = "矛"
    LANCE = "骑枪"
    BOW = "弓"
    CROSSBOW = "弩"
    DAGGER = "匕首"


@dataclass
class Equipment:
    """装备类"""
    id: int
    name: str
    equipment_type: EquipmentType
    weapon_type: Optional[WeaponType] = None

    # 基础属性
    attack: int = 0
    defense: int = 0
    speed: int = 0
    range: int = 0
    weight: int = 0

    # 特殊属性
    bonus_health: int = 0
    bonus_stamina: int = 0
    bonus_strength: int = 0
    bonus_agility: int = 0
    bonus_intelligence: int = 0
    bonus_charisma: int = 0

    # 价格
    base_price: int = 0
    current_price: int = 0

    # 等级和品质
    tier: int = 1
    quality: int = 100  # 品质 0-100

    # 需求
    required_strength: int = 0
    required_agility: int = 0

    # 描述
    description: str = ""

    def get_total_attack(self) -> int:
        """获取总攻击力"""
        base = self.attack
        quality_bonus = int(base * (self.quality / 100 - 1) * 0.5)
        return base + quality_bonus

    def get_total_defense(self) -> int:
        """获取总防御力"""
        base = self.defense
        quality_bonus = int(base * (self.quality / 100 - 1) * 0.5)
        return base + quality_bonus

    def get_repair_cost(self) -> int:
        """获取修理费用"""
        damage = 100 - self.quality
        return int(self.base_price * damage / 100 * 0.3)

    def repair(self, amount: int = 10):
        """修理装备"""
        self.quality = min(100, self.quality + amount)

    def degrade(self, amount: int = 1):
        """装备磨损"""
        self.quality = max(0, self.quality - amount)

    def can_upgrade(self) -> bool:
        """是否可以升级"""
        return self.tier < 5

    def get_upgrade_cost(self) -> int:
        """获取升级费用"""
        return int(self.base_price * self.tier * 0.5)

    def upgrade(self) -> bool:
        """升级装备"""
        if self.can_upgrade():
            self.tier += 1
            self.attack = int(self.attack * 1.2)
            self.defense = int(self.defense * 1.2)
            self.base_price = int(self.base_price * 1.5)
            self.current_price = self.base_price
            return True
        return False

    def get_sell_price(self) -> int:
        """获取出售价格"""
        return int(self.current_price * self.quality / 100 * 0.5)

    def __str__(self) -> str:
        return f"{self.name} (Lv.{self.tier})"


class EquipmentFactory:
    """装备工厂"""

    @staticmethod
    def create_weapon(name: str, weapon_type: WeaponType, tier: int = 1) -> Equipment:
        """创建武器"""
        base_stats = {
            WeaponType.SWORD: {'attack': 15, 'defense': 0, 'speed': 10, 'weight': 3},
            WeaponType.AXE: {'attack': 20, 'defense': 0, 'speed': 8, 'weight': 4},
            WeaponType.MACE: {'attack': 18, 'defense': 0, 'speed': 7, 'weight': 5},
            WeaponType.SPEAR: {'attack': 12, 'defense': 5, 'speed': 9, 'weight': 4, 'range': 2},
            WeaponType.LANCE: {'attack': 25, 'defense': 0, 'speed': 6, 'weight': 6, 'range': 3},
            WeaponType.BOW: {'attack': 10, 'defense': 0, 'speed': 12, 'weight': 2, 'range': 10},
            WeaponType.CROSSBOW: {'attack': 15, 'defense': 0, 'speed': 5, 'weight': 5, 'range': 8},
            WeaponType.DAGGER: {'attack': 8, 'defense': 0, 'speed': 15, 'weight': 1},
        }

        stats = base_stats.get(weapon_type, {'attack': 10, 'defense': 0, 'speed': 10, 'weight': 2})

        # 根据等级调整属性
        multiplier = 1 + (tier - 1) * 0.2

        return Equipment(
            id=0,  # ID将在创建时分配
            name=name,
            equipment_type=EquipmentType.ONE_HANDED if weapon_type not in
                [WeaponType.BOW, WeaponType.CROSSBOW, WeaponType.LANCE] else EquipmentType.BOW,
            weapon_type=weapon_type,
            attack=int(stats['attack'] * multiplier),
            defense=int(stats.get('defense', 0) * multiplier),
            speed=int(stats['speed'] * multiplier),
            range=stats.get('range', 1),
            weight=stats['weight'],
            tier=tier,
            base_price=int(100 * multiplier * tier),
            current_price=int(100 * multiplier * tier),
            description=f"{tier}级{weapon_type.value}",
        )

    @staticmethod
    def create_armor(name: str, equipment_type: EquipmentType, tier: int = 1) -> Equipment:
        """创建护甲"""
        base_stats = {
            EquipmentType.HEAD: {'defense': 5, 'weight': 2},
            EquipmentType.BODY: {'defense': 15, 'weight': 10},
            EquipmentType.LEGS: {'defense': 8, 'weight': 5},
            EquipmentType.FEET: {'defense': 3, 'weight': 2},
            EquipmentType.GLOVES: {'defense': 2, 'weight': 1},
        }

        stats = base_stats.get(equipment_type, {'defense': 5, 'weight': 3})

        multiplier = 1 + (tier - 1) * 0.2

        return Equipment(
            id=0,
            name=name,
            equipment_type=equipment_type,
            defense=int(stats['defense'] * multiplier),
            weight=stats['weight'],
            bonus_health=int(5 * tier),
            tier=tier,
            base_price=int(50 * multiplier * tier),
            current_price=int(50 * multiplier * tier),
            description=f"{tier}级{equipment_type.value}护甲",
        )

    @staticmethod
    def create_shield(name: str, tier: int = 1) -> Equipment:
        """创建盾牌"""
        multiplier = 1 + (tier - 1) * 0.2

        return Equipment(
            id=0,
            name=name,
            equipment_type=EquipmentType.SHIELD,
            defense=int(10 * multiplier),
            weight=5,
            tier=tier,
            base_price=int(30 * multiplier * tier),
            current_price=int(30 * multiplier * tier),
            description=f"{tier}级盾牌",
        )

    @staticmethod
    def create_mount(name: str, tier: int = 1) -> Equipment:
        """创建坐骑"""
        multiplier = 1 + (tier - 1) * 0.2

        return Equipment(
            id=0,
            name=name,
            equipment_type=EquipmentType.MOUNT,
            speed=int(20 * multiplier),
            weight=0,
            bonus_health=int(20 * tier),
            tier=tier,
            base_price=int(200 * multiplier * tier),
            current_price=int(200 * multiplier * tier),
            description=f"{tier}级坐骑",
        )


class Blacksmith:
    """铁匠铺"""

    def __init__(self):
        self.crafting_queue: list = []
        self.available_recipes: Dict[str, Dict] = {}

    def get_craft_cost(self, equipment_type: EquipmentType, tier: int) -> int:
        """获取打造费用"""
        base_costs = {
            EquipmentType.ONE_HANDED: 50,
            EquipmentType.TWO_HANDED: 80,
            EquipmentType.BOW: 60,
            EquipmentType.CROSSBOW: 70,
            EquipmentType.HEAD: 30,
            EquipmentType.BODY: 100,
            EquipmentType.LEGS: 50,
            EquipmentType.FEET: 20,
            EquipmentType.GLOVES: 15,
            EquipmentType.SHIELD: 40,
            EquipmentType.MOUNT: 150,
        }

        base_cost = base_costs.get(equipment_type, 50)
        return int(base_cost * tier)

    def craft_equipment(self, name: str, equipment_type: EquipmentType,
                        tier: int = 1, weapon_type: Optional[WeaponType] = None) -> Equipment:
        """打造装备"""
        if equipment_type in [EquipmentType.ONE_HANDED, EquipmentType.TWO_HANDED,
                              EquipmentType.POLEARM, EquipmentType.BOW, EquipmentType.CROSSBOW]:
            if weapon_type:
                return EquipmentFactory.create_weapon(name, weapon_type, tier)
        elif equipment_type == EquipmentType.SHIELD:
            return EquipmentFactory.create_shield(name, tier)
        elif equipment_type == EquipmentType.MOUNT:
            return EquipmentFactory.create_mount(name, tier)
        else:
            return EquipmentFactory.create_armor(name, equipment_type, tier)

    def upgrade_equipment(self, equipment: Equipment, gold: int) -> tuple:
        """升级装备"""
        cost = equipment.get_upgrade_cost()
        if gold >= cost and equipment.can_upgrade():
            equipment.upgrade()
            return equipment, cost
        return equipment, 0

    def repair_equipment(self, equipment: Equipment, gold: int) -> tuple:
        """修理装备"""
        cost = equipment.get_repair_cost()
        if gold >= cost:
            equipment.repair(20)
            return equipment, cost
        return equipment, 0