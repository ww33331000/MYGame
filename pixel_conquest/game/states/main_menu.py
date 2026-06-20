"""
主菜单状态
"""

import pygame
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings


class MainMenuState(BaseState):
    """主菜单状态"""

    def __init__(self, game):
        super().__init__(game)
        self.menu_items = [
            "开始新游戏",
            "读取存档",
            "设置",
            "退出游戏",
        ]
        self.selected_index = 0
        self.title_font = None
        self.menu_font = None
        self._init_fonts()

    def _init_fonts(self):
        """初始化字体"""
        # 使用系统默认字体
        self.title_font = pygame.font.Font(None, 74)
        self.menu_font = pygame.font.Font(None, 48)

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
                self._select_item()

    def _select_item(self):
        """选择菜单项"""
        if self.selected_index == 0:
            # 开始新游戏
            self.game.new_game()
        elif self.selected_index == 1:
            # 读取存档
            # TODO: 显示存档列表
            pass
        elif self.selected_index == 2:
            # 设置
            # TODO: 显示设置菜单
            pass
        elif self.selected_index == 3:
            # 退出游戏
            self.game.running = False

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        # 背景
        screen.fill(Settings.COLORS['dark_gray'])

        # 标题
        title_text = "像素骑士：大陆争霸"
        title_surface = self.title_font.render(title_text, True, Settings.COLORS['gold'])
        title_rect = title_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 150))
        screen.blit(title_surface, title_rect)

        # 副标题
        subtitle_text = "Pixel Conquest"
        subtitle_surface = self.menu_font.render(subtitle_text, True, Settings.COLORS['white'])
        subtitle_rect = subtitle_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 220))
        screen.blit(subtitle_surface, subtitle_rect)

        # 菜单项
        for i, item in enumerate(self.menu_items):
            color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
            text_surface = self.menu_font.render(item, True, color)
            text_rect = text_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 350 + i * 60))
            screen.blit(text_surface, text_rect)

            # 选中指示器
            if i == self.selected_index:
                indicator = "> "
                indicator_surface = self.menu_font.render(indicator, True, Settings.COLORS['gold'])
                indicator_rect = indicator_surface.get_rect(midright=(text_rect.left - 10, text_rect.centery))
                screen.blit(indicator_surface, indicator_rect)

        # 版本信息
        version_text = "v0.1.0"
        version_surface = self.menu_font.render(version_text, True, Settings.COLORS['gray'])
        version_rect = version_surface.get_rect(bottomright=(Settings.WINDOW_WIDTH - 20, Settings.WINDOW_HEIGHT - 20))
        screen.blit(version_surface, version_rect)