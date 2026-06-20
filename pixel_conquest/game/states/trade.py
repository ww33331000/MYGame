"""
交易状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings
from game.world.settlement import Settlement


class TradeState(BaseState):
    """交易状态"""

    def __init__(self, game):
        super().__init__(game)
        self.settlement: Settlement = None
        self.mode = 'buy'  # buy or sell
        self.selected_index = 0
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 36)

    def enter(self, **kwargs):
        """进入状态"""
        settlement_id = kwargs.get('settlement_id')
        if settlement_id and self.game.world:
            self.settlement = self.game.world.get_settlement(settlement_id)
        self.mode = kwargs.get('mode', 'buy')
        self.selected_index = 0

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self._move_selection(-1)
            elif event.key == pygame.K_DOWN:
                self._move_selection(1)
            elif event.key == pygame.K_TAB:
                # 切换购买/出售
                self.mode = 'sell' if self.mode == 'buy' else 'buy'
                self.selected_index = 0
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()
            elif event.key == pygame.K_RETURN:
                self._execute_trade()

    def _move_selection(self, direction: int):
        """移动选择"""
        # TODO: 根据商品列表移动选择
        pass

    def _execute_trade(self):
        """执行交易"""
        # TODO: 实现交易逻辑
        pass

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        # 标题
        if self.settlement:
            title = f"{self.settlement.name} - 市场"
            title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
            screen.blit(title_surface, (50, 30))

        # 模式标题
        mode_title = "购买商品" if self.mode == 'buy' else "出售商品"
        mode_surface = self.title_font.render(mode_title, True,
                                               Settings.COLORS['green'] if self.mode == 'buy' else Settings.COLORS['red'])
        screen.blit(mode_surface, (50, 80))

        # 商品列表（示例）
        sample_goods = [
            "粮食 - 价格: 10金币",
            "木材 - 价格: 15金币",
            "铁矿石 - 价格: 25金币",
            "布料 - 价格: 20金币",
            "武器 - 价格: 100金币",
        ]

        for i, good in enumerate(sample_goods):
            color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
            good_surface = self.font.render(good, True, color)
            screen.blit(good_surface, (50, 140 + i * 30))

            if i == self.selected_index:
                indicator = "> "
                indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                screen.blit(indicator_surface, (30, 140 + i * 30))

        # 玩家信息
        if self.game.player:
            player_info = f"金币: {self.game.player.gold}"
            player_surface = self.font.render(player_info, True, Settings.COLORS['gold'])
            screen.blit(player_surface, (Settings.WINDOW_WIDTH - 150, 30))

        # 提示
        hints = "TAB:切换购买/出售 | Enter:交易 | ESC:返回"
        hint_surface = self.font.render(hints, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (50, Settings.WINDOW_HEIGHT - 30))