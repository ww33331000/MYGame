"""
任务日志状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings


class QuestLogState(BaseState):
    """任务日志状态"""

    def __init__(self, game):
        super().__init__(game)
        self.selected_index = 0
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 36)

    def enter(self, **kwargs):
        """进入状态"""
        self.selected_index = 0

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                if self.game.player and self.game.player.active_quests:
                    self.selected_index = (self.selected_index - 1) % len(self.game.player.active_quests)
            elif event.key == pygame.K_DOWN:
                if self.game.player and self.game.player.active_quests:
                    self.selected_index = (self.selected_index + 1) % len(self.game.player.active_quests)
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        # 标题
        title = "任务日志"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (50, 30))

        # 任务列表
        if self.game.player:
            if not self.game.player.active_quests:
                empty_text = "没有进行中的任务"
                empty_surface = self.font.render(empty_text, True, Settings.COLORS['white'])
                screen.blit(empty_surface, (50, 100))
            else:
                for i, quest in enumerate(self.game.player.active_quests):
                    color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
                    quest_text = str(quest) if quest else "空"
                    quest_surface = self.font.render(quest_text, True, color)
                    screen.blit(quest_surface, (50, 100 + i * 30))

                    if i == self.selected_index:
                        indicator = "> "
                        indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                        screen.blit(indicator_surface, (30, 100 + i * 30))

        # 已完成任务
        completed_title = "已完成任务"
        completed_surface = self.title_font.render(completed_title, True, Settings.COLORS['gray'])
        screen.blit(completed_surface, (50, 400))

        if self.game.player and self.game.player.completed_quests:
            for i, quest in enumerate(self.game.player.completed_quests[:5]):  # 只显示5个
                quest_text = str(quest) if quest else "空"
                quest_surface = self.font.render(quest_text, True, Settings.COLORS['gray'])
                screen.blit(quest_surface, (50, 440 + i * 25))

        # 提示
        hint = "ESC:返回"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (Settings.WINDOW_WIDTH - 100, Settings.WINDOW_HEIGHT - 30))