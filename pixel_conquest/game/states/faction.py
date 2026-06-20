"""
势力状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings


class FactionState(BaseState):
    """势力状态"""

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
                if self.game.world:
                    self.selected_index = (self.selected_index - 1) % len(self.game.world.factions)
            elif event.key == pygame.K_DOWN:
                if self.game.world:
                    self.selected_index = (self.selected_index + 1) % len(self.game.world.factions)
            elif event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

    def update(self, delta_time: float):
        """更新"""
        pass

    def render(self, screen):
        """渲染"""
        screen.fill(Settings.COLORS['dark_gray'])

        # 标题
        title = "势力一览"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (50, 30))

        # 势力列表
        if self.game.world:
            factions = list(self.game.world.factions.values())

            for i, faction in enumerate(factions):
                color = Settings.COLORS['gold'] if i == self.selected_index else Settings.COLORS['white']
                faction_text = f"{faction.name} - 领主:{faction.total_lords} 领地:{faction.total_settlements} 国库:{faction.treasury}"
                faction_surface = self.font.render(faction_text, True, color)
                screen.blit(faction_surface, (50, 100 + i * 40))

                if i == self.selected_index:
                    indicator = "> "
                    indicator_surface = self.font.render(indicator, True, Settings.COLORS['gold'])
                    screen.blit(indicator_surface, (30, 100 + i * 40))

            # 显示选中势力的详细信息
            if factions and self.selected_index < len(factions):
                selected_faction = factions[self.selected_index]
                self._render_faction_details(screen, selected_faction)

        # 提示
        hint = "ESC:返回"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (Settings.WINDOW_WIDTH - 100, Settings.WINDOW_HEIGHT - 30))

    def _render_faction_details(self, screen, faction):
        """渲染势力详细信息"""
        details_title = "势力详情"
        details_surface = self.title_font.render(details_title, True, faction.color)
        screen.blit(details_surface, (500, 30))

        details_lines = [
            f"名称: {faction.name}",
            f"领主数量: {faction.total_lords}",
            f"城镇: {len(faction.towns)}",
            f"城堡: {len(faction.castles)}",
            f"村庄: {len(faction.villages)}",
            f"国库: {faction.treasury}",
            f"税率: {faction.tax_rate * 100:.0f}%",
            f"存在天数: {faction.days_existed}",
        ]

        for i, line in enumerate(details_lines):
            line_surface = self.font.render(line, True, Settings.COLORS['white'])
            screen.blit(line_surface, (500, 80 + i * 25))

        # 战争状态
        if faction.at_war:
            war_title = "战争状态"
            war_surface = self.font.render(war_title, True, Settings.COLORS['red'])
            screen.blit(war_surface, (500, 280))

            for i, enemy_id in enumerate(faction.at_war[:3]):
                enemy = self.game.world.factions.get(enemy_id)
                if enemy:
                    enemy_text = f"与 {enemy.name} 交战"
                    enemy_surface = self.font.render(enemy_text, True, Settings.COLORS['red'])
                    screen.blit(enemy_surface, (500, 310 + i * 25))

        # 同盟状态
        if faction.alliances:
            ally_title = "同盟状态"
            ally_surface = self.font.render(ally_title, True, Settings.COLORS['green'])
            screen.blit(ally_surface, (500, 380))

            for i, ally_id in enumerate(faction.alliances[:3]):
                ally = self.game.world.factions.get(ally_id)
                if ally:
                    ally_text = f"与 {ally.name} 同盟"
                    ally_surface = self.font.render(ally_text, True, Settings.COLORS['green'])
                    screen.blit(ally_surface, (500, 410 + i * 25))