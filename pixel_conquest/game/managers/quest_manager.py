"""
任务管理器
"""

import random
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum


class QuestType(Enum):
    """任务类型"""
    MAIN = "主线"
    SIDE = "支线"
    RANDOM = "随机"


class QuestStatus(Enum):
    """任务状态"""
    AVAILABLE = "可用"
    IN_PROGRESS = "进行中"
    COMPLETED = "已完成"
    FAILED = "失败"


@dataclass
class Quest:
    """任务类"""
    id: str
    name: str
    description: str
    quest_type: QuestType
    status: QuestStatus = QuestStatus.AVAILABLE

    # 任务目标
    objectives: List[Dict] = field(default_factory=list)
    current_objective_index: int = 0

    # 奖励
    gold_reward: int = 0
    experience_reward: int = 0
    renown_reward: int = 0
    item_rewards: List = field(default_factory=list)

    # 时间限制
    time_limit: Optional[int] = None  # 天数
    days_remaining: Optional[int] = None

    # 前置任务
    prerequisite_quest_ids: List[str] = field(default_factory=list)

    # 发布者
    quest_giver_id: Optional[int] = None

    def is_completed(self) -> bool:
        """检查是否完成"""
        return self.current_objective_index >= len(self.objectives)

    def advance_objective(self):
        """推进目标"""
        if self.current_objective_index < len(self.objectives) - 1:
            self.current_objective_index += 1

    def get_current_objective(self) -> Optional[Dict]:
        """获取当前目标"""
        if self.current_objective_index < len(self.objectives):
            return self.objectives[self.current_objective_index]
        return None


class QuestManager:
    """任务管理器"""

    def __init__(self, game):
        self.game = game
        self.available_quests: Dict[str, Quest] = {}
        self.active_quests: Dict[str, Quest] = {}
        self.completed_quests: Dict[str, Quest] = {}
        self.failed_quests: Dict[str, Quest] = {}

        # 初始化任务模板
        self._init_quest_templates()

    def _init_quest_templates(self):
        """初始化任务模板"""
        # 主线任务模板
        self.quest_templates = {
            'main_1': Quest(
                id='main_1',
                name='初入大陆',
                description='作为新来的冒险者，你需要熟悉这片大陆的基本情况。',
                quest_type=QuestType.MAIN,
                objectives=[
                    {'type': 'visit', 'target': 'town', 'description': '访问一个城镇'},
                    {'type': 'recruit', 'count': 5, 'description': '招募5名士兵'},
                    {'type': 'battle', 'count': 1, 'description': '参加一场战斗'},
                ],
                gold_reward=500,
                experience_reward=100,
                renown_reward=10,
            ),
            'trade_1': Quest(
                id='trade_1',
                name='商人的请求',
                description='帮助商人运送货物到指定地点。',
                quest_type=QuestType.RANDOM,
                objectives=[
                    {'type': 'deliver', 'target': 'settlement', 'description': '运送货物到目标地点'},
                ],
                gold_reward=200,
                experience_reward=50,
                time_limit=7,
            ),
            'hunt_1': Quest(
                id='hunt_1',
                name='剿灭土匪',
                description='附近的村庄受到土匪骚扰，请帮助他们。',
                quest_type=QuestType.RANDOM,
                objectives=[
                    {'type': 'battle', 'target': 'bandits', 'description': '击败土匪'},
                ],
                gold_reward=300,
                experience_reward=100,
                renown_reward=15,
            ),
            'escort_1': Quest(
                id='escort_1',
                name='护送任务',
                description='护送重要人物到目的地。',
                quest_type=QuestType.RANDOM,
                objectives=[
                    {'type': 'escort', 'target': 'settlement', 'description': '护送到目的地'},
                ],
                gold_reward=400,
                experience_reward=80,
                renown_reward=20,
                time_limit=10,
            ),
            'conquer_1': Quest(
                id='conquer_1',
                name='攻城略地',
                description='攻占一个城堡或城镇。',
                quest_type=QuestType.SIDE,
                objectives=[
                    {'type': 'conquer', 'target': 'settlement', 'description': '攻占目标领地'},
                ],
                gold_reward=1000,
                experience_reward=200,
                renown_reward=50,
            ),
        }

    def generate_random_quest(self) -> Quest:
        """生成随机任务"""
        templates = ['trade_1', 'hunt_1', 'escort_1']
        template_id = random.choice(templates)
        template = self.quest_templates[template_id]

        # 创建新任务实例
        quest_id = f"{template_id}_{random.randint(1000, 9999)}"
        quest = Quest(
            id=quest_id,
            name=template.name,
            description=template.description,
            quest_type=QuestType.RANDOM,
            objectives=template.objectives.copy(),
            gold_reward=template.gold_reward + random.randint(-50, 50),
            experience_reward=template.experience_reward,
            renown_reward=template.renown_reward,
            time_limit=template.time_limit,
        )

        return quest

    def get_available_quests(self, player) -> List[Quest]:
        """获取可用任务"""
        quests = []
        for quest_id, quest in self.quest_templates.items():
            if quest.quest_type == QuestType.MAIN:
                # 检查前置任务
                if all(qid in self.completed_quests for qid in quest.prerequisite_quest_ids):
                    quests.append(quest)
            elif quest.quest_type == QuestType.RANDOM:
                # 随机任务
                quests.append(self.generate_random_quest())

        return quests

    def accept_quest(self, quest: Quest):
        """接受任务"""
        quest.status = QuestStatus.IN_PROGRESS
        if quest.time_limit:
            quest.days_remaining = quest.time_limit
        self.active_quests[quest.id] = quest

        if self.game.player:
            self.game.player.active_quests.append(quest)

    def complete_quest(self, quest_id: str):
        """完成任务"""
        if quest_id in self.active_quests:
            quest = self.active_quests[quest_id]
            quest.status = QuestStatus.COMPLETED

            # 给予奖励
            if self.game.player:
                self.game.player.gold += quest.gold_reward
                self.game.player.gain_experience(quest.experience_reward)
                self.game.player.add_renown(quest.renown_reward)

                # 移除任务
                self.game.player.active_quests.remove(quest)
                self.game.player.completed_quests.append(quest)

            # 移动到已完成列表
            self.completed_quests[quest_id] = quest
            del self.active_quests[quest_id]

    def fail_quest(self, quest_id: str):
        """任务失败"""
        if quest_id in self.active_quests:
            quest = self.active_quests[quest_id]
            quest.status = QuestStatus.FAILED

            if self.game.player:
                self.game.player.active_quests.remove(quest)

            self.failed_quests[quest_id] = quest
            del self.active_quests[quest_id]

    def update_quest_progress(self, event_type: str, **kwargs):
        """更新任务进度"""
        for quest in self.active_quests.values():
            objective = quest.get_current_objective()
            if objective and objective['type'] == event_type:
                # 检查目标是否匹配
                if self._check_objective_match(objective, kwargs):
                    quest.advance_objective()
                    if quest.is_completed():
                        self.complete_quest(quest.id)

    def _check_objective_match(self, objective: Dict, kwargs: Dict) -> bool:
        """检查目标是否匹配"""
        obj_type = objective['type']

        if obj_type == 'visit':
            return kwargs.get('visited_type') == objective.get('target')
        elif obj_type == 'recruit':
            return kwargs.get('recruit_count', 0) >= objective.get('count', 1)
        elif obj_type == 'battle':
            return kwargs.get('battle_won', False)
        elif obj_type == 'deliver':
            return kwargs.get('destination') == objective.get('target')
        elif obj_type == 'escort':
            return kwargs.get('destination') == objective.get('target')
        elif obj_type == 'conquer':
            return kwargs.get('conquered')

        return False

    def update_daily(self):
        """每日更新"""
        # 检查有时间限制的任务
        for quest in self.active_quests.values():
            if quest.days_remaining is not None:
                quest.days_remaining -= 1
                if quest.days_remaining <= 0:
                    self.fail_quest(quest.id)