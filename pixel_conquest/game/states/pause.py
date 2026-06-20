"""
暂停状态
"""

import pygame
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings


class PauseState(BaseState):
    """暂停状态"""

    def __init__(self, game):
        super().__init__(game)
        self.menu_items = [
            "继续游戏",
            "保存游戏",
            "读取存档",
            "设置",
            "返回主菜单",
        ]
        self.selected_index = 0
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 36)
        self.title_font = pygame.font.Font(None, 48)

    def enter(self, **kwargs):
        """进入状态"""
        self.selected_index = 0

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected_index = (self.selected_index - 1) % len(self.menu_items)
            elif event.key == pygame.K_DOWN:
                self.selected_index = (self.selected_index + 1) % len(self.menu_items)
            elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                self._select_menu()
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

    def _select_menu(self):
        """选择菜单项"""
        if self.selected_index == 0:
            # 继续游戏
            self.game.state_manager.pop_state()
        elif self.selected_index == 1:
            # 保存游戏
            # TODO: 实现保存功能
            pass
        elif self.selected_index == 2:
            # 读取存档
            # TODO: 实现读取功能
            pass
        elif self.selected_index == 3:
            # 设置
            # TODO: 实现设置功能
            pass
        elif self.selected_index == 4:
            # 返回主菜单
            self.game.state_manager.change_state(GameState.MAIN_MENU)

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        # 半透明背景
        overlay = pygame.Surface((Settings.WINDOW_WIDTH, Settings.WINDOW_HEIGHT))
        overlay.fill(Settings.COLORS['black'])
        overlay.set_alpha(128)
        screen.blit(overlay, (0, 0))

        # 标题
        title = "游戏暂停"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        title_rect = title_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 150))
        screen.blit(title_surface, title_rect)

        # 菜单项
        for i, item in enumerate(self.menu_items):
            color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
            text_surface = self.font.render(item, True, color)
            text_rect = text_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 250 + i * 50))
            screen.blit(text_surface, text_rect)

            if i == self.selected_index:
                indicator = "> "
                indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                indicator_rect = indicator_surface.get_rect(midright=(text_rect.left - 10, text_rect.centery))
                screen.blit(indicator_surface, indicator_rect)

        # 提示
        hint = "ESC:继续游戏"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        hint_rect = hint_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, Settings.WINDOW_HEIGHT - 50))
        screen.blit(hint_surface, hint_rect)