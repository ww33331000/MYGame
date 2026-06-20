"""
部队状态
"""

import pygame
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings


class PartyState(BaseState):
    """部队状态"""

    def __init__(self, game):
        super().__init__(game)
        self.selected_index = 0
        self.mode = 'party'  # party or prisoners
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 36)

    def enter(self, **kwargs):
        """进入状态"""
        self.selected_index = 0
        self.mode = kwargs.get('mode', 'party')

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self._move_selection(-1)
            elif event.key == pygame.K_DOWN:
                self._move_selection(1)
            elif event.key == pygame.K_TAB:
                # 切换部队/俘虏视图
                self.mode = 'prisoners' if self.mode == 'party' else 'party'
                self.selected_index = 0
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()
            elif event.key == pygame.K_RETURN:
                self._select_troop()

    def _move_selection(self, direction: int):
        """移动选择"""
        if self.mode == 'party':
            if self.game.player and self.game.player.party:
                self.selected_index = (self.selected_index + direction) % len(self.game.player.party)
        else:
            if self.game.player and self.game.player.prisoners:
                self.selected_index = (self.selected_index + direction) % len(self.game.player.prisoners)

    def _select_troop(self):
        """选择士兵"""
        # TODO: 实现士兵详情/升级功能
        pass

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        if not self.game.player:
            return

        player = self.game.player

        # 标题
        title = "部队" if self.mode == 'party' else "俘虏"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (50, 30))

        # 部队信息
        info_text = f"人数: {player.get_party_size()}/{player.party_size_limit}"
        info_surface = self.font.render(info_text, True, Settings.COLORS['white'])
        screen.blit(info_surface, (50, 70))

        strength_text = f"战斗力: {player.get_party_strength()}"
        strength_surface = self.font.render(strength_text, True, Settings.COLORS['white'])
        screen.blit(strength_surface, (200, 70))

        # 士兵列表
        if self.mode == 'party':
            if not player.party:
                empty_text = "部队为空"
                empty_surface = self.font.render(empty_text, True, Settings.COLORS['white'])
                screen.blit(empty_surface, (50, 120))
            else:
                for i, troop in enumerate(player.party):
                    color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
                    troop_text = f"{troop.name} (Lv.{troop.tier}) HP:{troop.health}/{troop.max_health} ATK:{troop.attack} DEF:{troop.defense}"
                    troop_surface = self.font.render(troop_text, True, color)
                    screen.blit(troop_surface, (50, 120 + i * 30))

                    if i == self.selected_index:
                        indicator = "> "
                        indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                        screen.blit(indicator_surface, (30, 120 + i * 30))
        else:
            # 俘虏列表
            if not player.prisoners:
                empty_text = "没有俘虏"
                empty_surface = self.font.render(empty_text, True, Settings.COLORS['white'])
                screen.blit(empty_surface, (50, 120))
            else:
                for i, prisoner in enumerate(player.prisoners):
                    color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
                    prisoner_text = f"{prisoner.name} (Lv.{prisoner.tier}) 售价:{prisoner.get_sell_price()}"
                    prisoner_surface = self.font.render(prisoner_text, True, color)
                    screen.blit(prisoner_surface, (50, 120 + i * 30))

                    if i == self.selected_index:
                        indicator = "> "
                        indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                        screen.blit(indicator_surface, (30, 120 + i * 30))

        # 提示
        hints = "TAB:切换部队/俘虏 | ESC:返回"
        hint_surface = self.font.render(hints, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (50, Settings.WINDOW_HEIGHT - 30))