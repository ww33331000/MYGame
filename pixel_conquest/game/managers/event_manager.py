"""
事件管理器
"""

import random
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum


class EventType(Enum):
    """事件类型"""
    WAR = "战争"
    PEACE = "和平"
    ECONOMIC = "经济"
    POLITICAL = "政治"
    NATURAL = "自然"
    RANDOM = "随机"


@dataclass
class GameEvent:
    """游戏事件"""
    id: str
    name: str
    description: str
    event_type: EventType

    # 效果
    effects: Dict = None

    # 持续时间
    duration: int = 0  # 天数

    # 影响范围
    affected_factions: List[int] = None
    affected_settlements: List[int] = None


class EventManager:
    """事件管理器"""

    def __init__(self, game):
        self.game = game
        self.active_events: List[GameEvent] = []
        self.event_history: List[GameEvent] = []

        # 事件概率配置
        self.daily_event_chance = 0.3  # 每日事件概率

    def generate_random_event(self) -> Optional[GameEvent]:
        """生成随机事件"""
        events = [
            GameEvent(
                id='war_declaration',
                name='战争爆发',
                description='两个势力之间爆发了战争。',
                event_type=EventType.WAR,
                effects={'war': True},
            ),
            GameEvent(
                id='peace_talks',
                name='和平谈判',
                description='势力之间开始和平谈判。',
                event_type=EventType.PEACE,
                effects={'peace': True},
            ),
            GameEvent(
                id='economic_boom',
                name='经济繁荣',
                description='某地区的经济繁荣起来。',
                event_type=EventType.ECONOMIC,
                effects={'prosperity': 10},
                duration=30,
            ),
            GameEvent(
                id='economic_crisis',
                name='经济危机',
                description='某地区遭遇经济危机。',
                event_type=EventType.ECONOMIC,
                effects={'prosperity': -10},
                duration=30,
            ),
            GameEvent(
                id='bandit_attack',
                name='土匪袭击',
                description='土匪袭击了村庄。',
                event_type=EventType.RANDOM,
                effects={'population': -50, 'prosperity': -5},
            ),
            GameEvent(
                id='harvest_failure',
                name='歉收',
                description='农作物歉收。',
                event_type=EventType.NATURAL,
                effects={'food_price': 2},
                duration=60,
            ),
            GameEvent(
                id='good_harvest',
                name='丰收',
                description='农作物丰收。',
                event_type=EventType.NATURAL,
                effects={'food_price': 0.5},
                duration=60,
            ),
            GameEvent(
                id='plague',
                name='瘟疫',
                description='瘟疫蔓延。',
                event_type=EventType.NATURAL,
                effects={'population': -100, 'health': -20},
                duration=90,
            ),
            GameEvent(
                id='festival',
                name='节日庆典',
                description='举办节日庆典。',
                event_type=EventType.POLITICAL,
                effects={'loyalty': 10, 'prosperity': 5},
                duration=7,
            ),
            GameEvent(
                id='lord_death',
                name='领主去世',
                description='一位领主去世了。',
                event_type=EventType.POLITICAL,
                effects={'political_change': True},
            ),
        ]

        return random.choice(events)

    def trigger_event(self, event: GameEvent):
        """触发事件"""
        self.active_events.append(event)
        self._apply_event_effects(event)

    def _apply_event_effects(self, event: GameEvent):
        """应用事件效果"""
        effects = event.effects or {}

        # 战争效果
        if effects.get('war'):
            if self.game.world:
                factions = list(self.game.world.factions.values())
                if len(factions) >= 2:
                    f1 = random.choice(factions)
                    f2 = random.choice([f for f in factions if f.id != f1.id])
                    f1.declare_war(f2.id)

        # 和平效果
        if effects.get('peace'):
            if self.game.world:
                for faction in self.game.world.factions.values():
                    for enemy_id in faction.at_war[:]:
                        if random.random() < 0.3:
                            faction.make_peace(enemy_id)

        # 繁荣度效果
        if 'prosperity' in effects:
            if event.affected_settlements:
                for settlement_id in event.affected_settlements:
                    settlement = self.game.world.get_settlement(settlement_id)
                    if settlement:
                        settlement.prosperity = max(0, min(100,
                            settlement.prosperity + effects['prosperity']))

        # 人口效果
        if 'population' in effects:
            if event.affected_settlements:
                for settlement_id in event.affected_settlements:
                    settlement = self.game.world.get_settlement(settlement_id)
                    if settlement:
                        settlement.population = max(0,
                            settlement.population + effects['population'])

        # 物价效果
        if 'food_price' in effects:
            # TODO: 实现物价系统
            pass

        # 忠诚度效果
        if 'loyalty' in effects:
            if event.affected_settlements:
                for settlement_id in event.affected_settlements:
                    settlement = self.game.world.get_settlement(settlement_id)
                    if settlement:
                        settlement.loyalty = max(0, min(100,
                            settlement.loyalty + effects['loyalty']))

    def update_daily(self):
        """每日更新"""
        # 检查是否触发新事件
        if random.random() < self.daily_event_chance:
            event = self.generate_random_event()
            if event:
                # 选择影响的势力/定居点
                if self.game.world:
                    factions = list(self.game.world.factions.values())
                    settlements = list(self.game.world.settlements.values())

                    if factions:
                        event.affected_factions = [random.choice(factions).id]
                    if settlements:
                        event.affected_settlements = [random.choice(settlements).id]

                self.trigger_event(event)

        # 更新持续事件
        for event in self.active_events[:]:
            if event.duration > 0:
                event.duration -= 1
                if event.duration <= 0:
                    # 事件结束，移除效果
                    self.active_events.remove(event)
                    self.event_history.append(event)

    def get_active_events(self) -> List[GameEvent]:
        """获取活跃事件"""
        return self.active_events

    def get_event_history(self) -> List[GameEvent]:
        """获取事件历史"""
        return self.event_history[-20:]  # 最近20个事件