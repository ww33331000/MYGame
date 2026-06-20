"""
角色状态
"""

import pygame
from game.core.game_state import BaseState
from game.core.settings import Settings


class CharacterState(BaseState):
    """角色状态"""

    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 36)

    def enter(self, **kwargs):
        """进入状态"""
        pass

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.game.state_manager.pop_state()

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
        title = f"{player.name}"
        title_surface = self.title_font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (50, 30))

        # 基本信息
        info_lines = [
            f"等级: {player.level}",
            f"经验: {player.data.experience}/{player._get_exp_for_level(player.level + 1)}",
            f"生命: {player.health}/{player.data.max_health}",
            f"体力: {player.stamina}/{player.data.max_stamina}",
            f"金币: {player.gold}",
            f"声望: {player.renown}",
            f"荣誉: {player.honor}",
            f"统治权: {player.right_to_rule}",
        ]

        for i, line in enumerate(info_lines):
            info_surface = self.font.render(line, True, Settings.COLORS['white'])
            screen.blit(info_surface, (50, 80 + i * 25))

        # 属性
        stats_title = "属性"
        stats_surface = self.title_font.render(stats_title, True, Settings.COLORS['gold'])
        screen.blit(stats_surface, (50, 300))

        stats = player.data.stats
        stats_lines = [
            f"力量: {stats.strength}",
            f"敏捷: {stats.agility}",
            f"智力: {stats.intelligence}",
            f"魅力: {stats.charisma}",
            f"耐力: {stats.endurance}",
            f"运气: {stats.luck}",
        ]

        for i, line in enumerate(stats_lines):
            stat_surface = self.font.render(line, True, Settings.COLORS['white'])
            screen.blit(stat_surface, (50, 340 + i * 25))

        # 技能
        skills_title = "技能"
        skills_surface = self.title_font.render(skills_title, True, Settings.COLORS['gold'])
        screen.blit(skills_surface, (300, 300))

        skills = player.data.skills
        skills_lines = [
            f"单手武器: {skills.one_handed}",
            f"双手武器: {skills.two_handed}",
            f"长柄武器: {skills.polearm}",
            f"弓箭: {skills.archery}",
            f"统御: {skills.leadership}",
            f"交易: {skills.trading}",
        ]

        for i, line in enumerate(skills_lines):
            skill_surface = self.font.render(line, True, Settings.COLORS['white'])
            screen.blit(skill_surface, (300, 340 + i * 25))

        # 战斗能力
        combat_title = "战斗能力"
        combat_surface = self.title_font.render(combat_title, True, Settings.COLORS['gold'])
        screen.blit(combat_surface, (500, 80))

        combat_lines = [
            f"攻击力: {player.get_attack_power()}",
            f"防御力: {player.get_defense()}",
        ]

        for i, line in enumerate(combat_lines):
            combat_surface = self.font.render(line, True, Settings.COLORS['white'])
            screen.blit(combat_surface, (500, 120 + i * 25))

        # 提示
        hint = "ESC:返回"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (Settings.WINDOW_WIDTH - 100, Settings.WINDOW_HEIGHT - 30))