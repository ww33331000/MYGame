"""
村庄状态
"""

import pygame
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings
from game.world.settlement import Settlement


class VillageState(BaseState):
    """村庄状态"""

    def __init__(self, game):
        super().__init__(game)
        self.settlement: Settlement = None
        self.menu_items = [
            "招募村民",
            "购买商品",
            "出售商品",
            "与村长交谈",
            "离开村庄",
        ]
        self.selected_index = 0
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)

    def enter(self, **kwargs):
        """进入村庄"""
        settlement_id = kwargs.get('settlement_id')
        if settlement_id and self.game.world:
            self.settlement = self.game.world.get_settlement(settlement_id)
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
            # 招募村民
            self._recruit_villagers()
        elif self.selected_index == 1:
            # 购买商品
            self.game.state_manager.push_state(GameState.TRADE,
                                               settlement_id=self.settlement.id,
                                               mode='buy')
        elif self.selected_index == 2:
            # 出售商品
            self.game.state_manager.push_state(GameState.TRADE,
                                               settlement_id=self.settlement.id,
                                               mode='sell')
        elif self.selected_index == 3:
            # 与村长交谈
            # TODO: 实现对话系统
            pass
        elif self.selected_index == 4:
            # 离开村庄
            self.game.state_manager.pop_state()

    def _recruit_villagers(self):
        """招募村民"""
        if not self.settlement or not self.game.player:
            return

        recruits = self.settlement.get_recruit_pool()
        if not recruits:
            return

        # 招募一个村民
        if self.game.player.can_recruit() and recruits:
            recruit = recruits[0]
            cost = recruit.get_recruit_cost()
            if self.game.player.gold >= cost:
                self.game.player.gold -= cost
                self.game.player.party.append(recruit)

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        # 背景
        screen.fill(Settings.COLORS['dark_gray'])

        # 村庄名称
        if self.settlement:
            title = f"{self.settlement.name}"
            title_surface = self.font.render(title, True, Settings.COLORS['brown'])
            title_rect = title_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 50))
            screen.blit(title_surface, title_rect)

            # 村庄信息
            info_lines = [
                f"人口: {self.settlement.population}",
                f"繁荣度: {self.settlement.prosperity}/100",
                f"忠诚度: {self.settlement.loyalty}/100",
            ]

            for i, line in enumerate(info_lines):
                info_surface = self.small_font.render(line, True, Settings.COLORS['white'])
                screen.blit(info_surface, (50, 100 + i * 25))

            # 所属势力
            if self.settlement.faction_id is not None:
                faction = self.game.world.get_faction(self.settlement.faction_id)
                if faction:
                    faction_text = f"所属势力: {faction.name}"
                    faction_surface = self.small_font.render(faction_text, True, faction.color)
                    screen.blit(faction_surface, (50, 175))

            # 上级定居点
            if self.settlement.parent_settlement_id is not None:
                parent = self.game.world.get_settlement(self.settlement.parent_settlement_id)
                if parent:
                    parent_text = f"隶属: {parent.name}"
                    parent_surface = self.small_font.render(parent_text, True, Settings.COLORS['white'])
                    screen.blit(parent_surface, (50, 200))

        # 菜单
        for i, item in enumerate(self.menu_items):
            color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
            text_surface = self.font.render(item, True, color)
            text_rect = text_surface.get_rect(center=(Settings.WINDOW_WIDTH // 2, 300 + i * 50))
            screen.blit(text_surface, text_rect)

            if i == self.selected_index:
                indicator = "> "
                indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                indicator_rect = indicator_surface.get_rect(midright=(text_rect.left - 10, text_rect.centery))
                screen.blit(indicator_surface, indicator_rect)

        # 玩家信息
        if self.game.player:
            player_info = f"金币: {self.game.player.gold} | 部队: {self.game.player.get_party_size()}/{self.game.player.party_size_limit}"
            player_surface = self.small_font.render(player_info, True, Settings.COLORS['gold'])
            screen.blit(player_surface, (Settings.WINDOW_WIDTH - 350, Settings.WINDOW_HEIGHT - 30))