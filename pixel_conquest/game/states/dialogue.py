"""
对话状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings


class DialogueState(BaseState):
    """对话状态"""

    def __init__(self, game):
        super().__init__(game)
        self.npc = None
        self.dialogue_lines = []
        self.current_line = 0
        self.options = []
        self.selected_option = 0
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 36)

    def enter(self, **kwargs):
        """进入状态"""
        self.npc = kwargs.get('npc')
        self.dialogue_lines = kwargs.get('dialogue_lines', ["你好，有什么需要帮助的吗？"])
        self.current_line = 0
        self.options = kwargs.get('options', ["继续", "离开"])
        self.selected_option = 0

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected_option = (self.selected_option - 1) % len(self.options)
            elif event.key == pygame.K_DOWN:
                self.selected_option = (self.selected_option + 1) % len(self.options)
            elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                self._select_option()
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

    def _select_option(self):
        """选择选项"""
        if self.selected_option == 0:
            # 继续对话
            self.current_line += 1
            if self.current_line >= len(self.dialogue_lines):
                self.current_line = len(self.dialogue_lines) - 1
        elif self.selected_option == len(self.options) - 1:
            # 离开
            self.game.state_manager.pop_state()

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        # NPC名称
        if self.npc:
            name = self.npc.name
            name_surface = self.title_font.render(name, True, Settings.COLORS['gold'])
            screen.blit(name_surface, (50, 30))

        # 对话框背景
        dialogue_box = pygame.Rect(50, 100, Settings.WINDOW_WIDTH - 100, 200)
        pygame.draw.rect(screen, Settings.COLORS['black'], dialogue_box)
        pygame.draw.rect(screen, Settings.COLORS['white'], dialogue_box, 2)

        # 对话内容
        if self.dialogue_lines and self.current_line < len(self.dialogue_lines):
            dialogue_text = self.dialogue_lines[self.current_line]
            dialogue_surface = self.font.render(dialogue_text, True, Settings.COLORS['white'])
            screen.blit(dialogue_surface, (70, 120))

        # 选项
        options_y = 350
        for i, option in enumerate(self.options):
            color = Settings.COLORS['gold'] if i == self.selected_option else Settings.COLORS['white']
            option_surface = self.font.render(option, True, color)
            screen.blit(option_surface, (50, options_y + i * 30))

            if i == self.selected_option:
                indicator = "> "
                indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                screen.blit(indicator_surface, (30, options_y + i * 30))

        # 提示
        hint = "ESC:离开对话"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (Settings.WINDOW_WIDTH - 150, Settings.WINDOW_HEIGHT - 30))