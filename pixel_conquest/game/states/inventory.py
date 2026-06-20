"""
背包状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings


class InventoryState(BaseState):
    """背包状态"""

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
                if self.game.player and self.game.player.inventory:
                    self.selected_index = (self.selected_index - 1) % len(self.game.player.inventory)
            elif event.key == pygame.K_DOWN:
                if self.game.player and self.game.player.inventory:
                    self.selected_index = (self.selected_index + 1) % len(self.game.player.inventory)
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        # 标题
        title = "背包"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (50, 30))

        # 物品列表
        if self.game.player:
            if not self.game.player.inventory:
                empty_text = "背包为空"
                empty_surface = self.font.render(empty_text, True, Settings.COLORS['white'])
                screen.blit(empty_surface, (50, 100))
            else:
                for i, item in enumerate(self.game.player.inventory):
                    color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
                    item_text = str(item) if item else "空"
                    item_surface = self.font.render(item_text, True, color)
                    screen.blit(item_surface, (50, 100 + i * 30))

                    if i == self.selected_index:
                        indicator = "> "
                        indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                        screen.blit(indicator_surface, (30, 100 + i * 30))

        # 装备栏
        self._render_equipment(screen)

        # 提示
        hint = "ESC:返回"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (Settings.WINDOW_WIDTH - 100, Settings.WINDOW_HEIGHT - 30))

    def _render_equipment(self, screen):
        """渲染装备栏"""
        equipment_title = "装备"
        equipment_surface = self.title_font.render(equipment_title, True, Settings.COLORS['gold'])
        screen.blit(equipment_surface, (Settings.WINDOW_WIDTH - 200, 30))

        if self.game.player:
            slots = ['head', 'body', 'legs', 'feet', 'gloves', 'weapon1', 'weapon2', 'shield', 'mount']
            slot_names = ['头部', '身体', '腿部', '脚部', '手套', '武器1', '武器2', '盾牌', '坐骑']

            for i, (slot, name) in enumerate(zip(slots, slot_names)):
                item = self.game.player.equipment.get(slot)
                item_text = f"{name}: {str(item) if item else '空'}"
                item_surface = self.font.render(item_text, True, Settings.COLORS['white'])
                screen.blit(item_surface, (Settings.WINDOW_WIDTH - 200, 100 + i * 30))