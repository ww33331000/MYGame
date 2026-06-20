"""
世界地图状态
"""

import pygame
import math
from typing import Optional, Tuple
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings
from game.world.settlement import SettlementType


class WorldMapState(BaseState):
    """世界地图状态"""

    def __init__(self, game):
        super().__init__(game)
        # 地图视图
        self.camera_x = 0
        self.camera_y = 0
        self.zoom = 1.0
        self.min_zoom = 0.5
        self.max_zoom = 3.0

        # 拖拽
        self.dragging = False
        self.drag_start = (0, 0)
        self.camera_start = (0, 0)

        # 选中的定居点
        self.selected_settlement = None

        # UI状态
        self.show_info_panel = False
        self.info_panel_settlement = None

        # 字体
        self.font = None
        self.small_font = None
        self._init_fonts()

        # 地形颜色
        self.terrain_colors = {
            0: (144, 238, 144),  # 平原 - 浅绿
            1: (34, 139, 34),    # 森林 - 深绿
            2: (139, 137, 137),   # 山地 - 灰色
            3: (107, 142, 35),   # 沼泽 - 橄榄绿
            4: (210, 180, 140),  # 道路 - 棕色
            5: (65, 105, 225),   # 水域 - 蓝色
        }

    def _init_fonts(self):
        """初始化字体"""
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)

    def enter(self, **kwargs):
        """进入状态"""
        # 初始化玩家位置
        if self.game.player and self.game.world:
            # 找到第一个城镇作为初始位置
            if self.game.world.towns:
                town = self.game.world.settlements[self.game.world.towns[0]]
                self.game.player.world_x = float(town.world_x)
                self.game.player.world_y = float(town.world_y)

            # 设置相机位置
            self.camera_x = self.game.player.world_x * Settings.TILE_SIZE
            self.camera_y = self.game.player.world_y * Settings.TILE_SIZE

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            self._handle_keydown(event)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            self._handle_mouse_down(event)
        elif event.type == pygame.MOUSEBUTTONUP:
            self._handle_mouse_up(event)
        elif event.type == pygame.MOUSEMOTION:
            self._handle_mouse_motion(event)
        elif event.type == pygame.MOUSEWHEEL:
            self._handle_mouse_wheel(event)

    def _handle_keydown(self, event):
        """处理键盘按下"""
        # 移动速度
        move_speed = 5.0

        if event.key == pygame.K_w or event.key == pygame.K_UP:
            self.game.player.world_y -= move_speed
        elif event.key == pygame.K_s or event.key == pygame.K_DOWN:
            self.game.player.world_y += move_speed
        elif event.key == pygame.K_a or event.key == pygame.K_LEFT:
            self.game.player.world_x -= move_speed
        elif event.key == pygame.K_d or event.key == pygame.K_RIGHT:
            self.game.player.world_x += move_speed
        elif event.key == pygame.K_ESCAPE:
            self.game.state_manager.push_state(GameState.PAUSE)
        elif event.key == pygame.K_i:
            self.game.state_manager.push_state(GameState.INVENTORY)
        elif event.key == pygame.K_c:
            self.game.state_manager.push_state(GameState.CHARACTER)
        elif event.key == pygame.K_p:
            self.game.state_manager.push_state(GameState.PARTY)
        elif event.key == pygame.K_j:
            self.game.state_manager.push_state(GameState.QUEST_LOG)
        elif event.key == pygame.K_RETURN:
            self._enter_settlement()

    def _handle_mouse_down(self, event):
        """处理鼠标按下"""
        if event.button == 1:  # 左键
            # 检查是否点击了定居点
            clicked_settlement = self._get_settlement_at_pos(event.pos)
            if clicked_settlement:
                self.selected_settlement = clicked_settlement
                self.show_info_panel = True
                self.info_panel_settlement = clicked_settlement
            else:
                self.show_info_panel = False

        elif event.button == 3:  # 右键 - 拖拽
            self.dragging = True
            self.drag_start = event.pos
            self.camera_start = (self.camera_x, self.camera_y)

    def _handle_mouse_up(self, event):
        """处理鼠标释放"""
        if event.button == 3:
            self.dragging = False

    def _handle_mouse_motion(self, event):
        """处理鼠标移动"""
        if self.dragging:
            dx = event.pos[0] - self.drag_start[0]
            dy = event.pos[1] - self.drag_start[1]
            self.camera_x = self.camera_start[0] - dx
            self.camera_y = self.camera_start[1] - dy

    def _handle_mouse_wheel(self, event):
        """处理鼠标滚轮"""
        if event.y > 0:
            self.zoom = min(self.max_zoom, self.zoom * 1.1)
        else:
            self.zoom = max(self.min_zoom, self.zoom / 1.1)

    def _get_settlement_at_pos(self, pos: Tuple[int, int]) -> Optional[any]:
        """获取鼠标位置的定居点"""
        if not self.game.world:
            return None

        # 转换屏幕坐标到世界坐标
        world_x = (pos[0] + self.camera_x) / (Settings.TILE_SIZE * self.zoom)
        world_y = (pos[1] + self.camera_y) / (Settings.TILE_SIZE * self.zoom)

        for settlement in self.game.world.settlements.values():
            dist = math.sqrt(
                (settlement.world_x - world_x) ** 2 +
                (settlement.world_y - world_y) ** 2
            )
            if dist < 2:  # 点击范围
                return settlement

        return None

    def _enter_settlement(self):
        """进入定居点"""
        if not self.selected_settlement:
            return

        # 检查玩家是否在定居点附近
        dist = math.sqrt(
            (self.game.player.world_x - self.selected_settlement.world_x) ** 2 +
            (self.game.player.world_y - self.selected_settlement.world_y) ** 2
        )

        if dist < 3:  # 进入范围
            if self.selected_settlement.settlement_type == SettlementType.TOWN:
                self.game.state_manager.push_state(GameState.TOWN,
                                                   settlement_id=self.selected_settlement.id)
            elif self.selected_settlement.settlement_type == SettlementType.CASTLE:
                self.game.state_manager.push_state(GameState.CASTLE,
                                                   settlement_id=self.selected_settlement.id)
            elif self.selected_settlement.settlement_type == SettlementType.VILLAGE:
                self.game.state_manager.push_state(GameState.VILLAGE,
                                                   settlement_id=self.selected_settlement.id)

    def update(self, delta_time: float):
        """更新"""
        # 更新游戏时间
        if self.game.world:
            self.game.world.update_time(delta_time)

        # 更新相机跟随玩家
        target_x = self.game.player.world_x * Settings.TILE_SIZE * self.zoom - Settings.WINDOW_WIDTH // 2
        target_y = self.game.player.world_y * Settings.TILE_SIZE * self.zoom - Settings.WINDOW_HEIGHT // 2

        # 平滑相机移动
        self.camera_x += (target_x - self.camera_x) * 0.1
        self.camera_y += (target_y - self.camera_y) * 0.1

    def render(self, screen):
        """渲染"""
        # 绘制地图
        self._render_terrain(screen)

        # 绘制定居点
        self._render_settlements(screen)

        # 绘制玩家
        self._render_player(screen)

        # 绘制UI
        self._render_ui(screen)

        # 绘制信息面板
        if self.show_info_panel and self.info_panel_settlement:
            self._render_info_panel(screen)

    def _render_terrain(self, screen):
        """渲染地形"""
        if not self.game.world:
            return

        tile_size = int(Settings.TILE_SIZE * self.zoom)

        # 计算可见范围
        start_x = max(0, int(self.camera_x // tile_size))
        start_y = max(0, int(self.camera_y // tile_size))
        end_x = min(self.game.world.width, start_x + Settings.WINDOW_WIDTH // tile_size + 2)
        end_y = min(self.game.world.height, start_y + Settings.WINDOW_HEIGHT // tile_size + 2)

        # 绘制地形
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                terrain = self.game.world.get_terrain_at(x, y)
                color = self.terrain_colors.get(terrain, (100, 100, 100))

                rect = pygame.Rect(
                    x * tile_size - self.camera_x,
                    y * tile_size - self.camera_y,
                    tile_size,
                    tile_size
                )
                pygame.draw.rect(screen, color, rect)

    def _render_settlements(self, screen):
        """绘制定居点"""
        if not self.game.world:
            return

        tile_size = int(Settings.TILE_SIZE * self.zoom)

        for settlement in self.game.world.settlements.values():
            # 计算屏幕位置
            screen_x = settlement.world_x * tile_size - self.camera_x
            screen_y = settlement.world_y * tile_size - self.camera_y

            # 检查是否在屏幕内
            if not (-50 < screen_x < Settings.WINDOW_WIDTH + 50 and
                    -50 < screen_y < Settings.WINDOW_HEIGHT + 50):
                continue

            # 根据类型选择颜色和大小
            if settlement.settlement_type == SettlementType.TOWN:
                color = Settings.COLORS['gold']
                size = 12
            elif settlement.settlement_type == SettlementType.CASTLE:
                color = Settings.COLORS['gray']
                size = 8
            else:  # VILLAGE
                color = Settings.COLORS['brown']
                size = 5

            # 绘制定居点
            pygame.draw.circle(screen, color, (int(screen_x), int(screen_y)), size)

            # 绘制名称（城镇和城堡）
            if settlement.settlement_type != SettlementType.VILLAGE:
                name_surface = self.small_font.render(settlement.name, True, Settings.COLORS['white'])
                name_rect = name_surface.get_rect(center=(int(screen_x), int(screen_y) - size - 5))
                screen.blit(name_surface, name_rect)

            # 绘制选中标记
            if settlement == self.selected_settlement:
                pygame.draw.circle(screen, Settings.COLORS['red'],
                                 (int(screen_x), int(screen_y)), size + 3, 2)

    def _render_player(self, screen):
        """渲染玩家"""
        if not self.game.player:
            return

        tile_size = int(Settings.TILE_SIZE * self.zoom)

        screen_x = self.game.player.world_x * tile_size - self.camera_x
        screen_y = self.game.player.world_y * tile_size - self.camera_y

        # 绘制玩家标记
        pygame.draw.circle(screen, Settings.COLORS['blue'], (int(screen_x), int(screen_y)), 8)
        pygame.draw.circle(screen, Settings.COLORS['white'], (int(screen_x), int(screen_y)), 8, 2)

    def _render_ui(self, screen):
        """渲染UI"""
        # 顶部信息栏
        self._render_top_bar(screen)

        # 底部快捷键提示
        self._render_bottom_bar(screen)

        # 小地图
        self._render_minimap(screen)

    def _render_top_bar(self, screen):
        """渲染顶部信息栏"""
        # 背景
        pygame.draw.rect(screen, (0, 0, 0, 180), (0, 0, Settings.WINDOW_WIDTH, 40))

        # 玩家信息
        if self.game.player:
            # 金币
            gold_text = f"金币: {self.game.player.gold}"
            gold_surface = self.font.render(gold_text, True, Settings.COLORS['gold'])
            screen.blit(gold_surface, (20, 10))

            # 部队
            party_text = f"部队: {self.game.player.get_party_size()}/{self.game.player.party_size_limit}"
            party_surface = self.font.render(party_text, True, Settings.COLORS['white'])
            screen.blit(party_surface, (200, 10))

            # 声望
            renown_text = f"声望: {self.game.player.renown}"
            renown_surface = self.font.render(renown_text, True, Settings.COLORS['white'])
            screen.blit(renown_surface, (400, 10))

        # 时间
        if self.game.world:
            time_text = f"第{self.game.world.day}天 {int(self.game.world.hour):02d}:00"
            time_surface = self.font.render(time_text, True, Settings.COLORS['white'])
            screen.blit(time_surface, (Settings.WINDOW_WIDTH - 150, 10))

    def _render_bottom_bar(self, screen):
        """渲染底部快捷键提示"""
        # 背景
        pygame.draw.rect(screen, (0, 0, 0, 180),
                        (0, Settings.WINDOW_HEIGHT - 30, Settings.WINDOW_WIDTH, 30))

        hints = "WASD/方向键:移动 | I:背包 | C:角色 | P:部队 | J:任务 | Enter:进入 | ESC:菜单"
        hint_surface = self.small_font.render(hints, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (20, Settings.WINDOW_HEIGHT - 25))

    def _render_minimap(self, screen):
        """渲染小地图"""
        if not self.game.world:
            return

        # 小地图大小和位置
        minimap_size = 150
        minimap_x = Settings.WINDOW_WIDTH - minimap_size - 10
        minimap_y = 50

        # 背景
        pygame.draw.rect(screen, (0, 0, 0, 180),
                        (minimap_x - 2, minimap_y - 2, minimap_size + 4, minimap_size + 4))

        # 缩放比例
        scale_x = minimap_size / self.game.world.width
        scale_y = minimap_size / self.game.world.height

        # 绘制定居点
        for settlement in self.game.world.settlements.values():
            x = minimap_x + int(settlement.world_x * scale_x)
            y = minimap_y + int(settlement.world_y * scale_y)

            if settlement.settlement_type == SettlementType.TOWN:
                color = Settings.COLORS['gold']
                size = 3
            elif settlement.settlement_type == SettlementType.CASTLE:
                color = Settings.COLORS['gray']
                size = 2
            else:
                color = Settings.COLORS['brown']
                size = 1

            pygame.draw.circle(screen, color, (x, y), size)

        # 绘制玩家位置
        if self.game.player:
            player_x = minimap_x + int(self.game.player.world_x * scale_x)
            player_y = minimap_y + int(self.game.player.world_y * scale_y)
            pygame.draw.circle(screen, Settings.COLORS['blue'], (player_x, player_y), 3)

    def _render_info_panel(self, screen):
        """渲染信息面板"""
        if not self.info_panel_settlement:
            return

        # 面板位置和大小
        panel_width = 250
        panel_height = 200
        panel_x = Settings.WINDOW_WIDTH - panel_width - 10
        panel_y = Settings.WINDOW_HEIGHT - panel_height - 40

        # 背景
        pygame.draw.rect(screen, (40, 40, 40, 230),
                        (panel_x, panel_y, panel_width, panel_height))
        pygame.draw.rect(screen, Settings.COLORS['white'],
                        (panel_x, panel_y, panel_width, panel_height), 2)

        # 标题
        settlement = self.info_panel_settlement
        title = f"{settlement.name}"
        title_surface = self.font.render(title, True, Settings.COLORS['gold'])
        screen.blit(title_surface, (panel_x + 10, panel_y + 10))

        # 类型
        type_text = f"类型: {settlement.settlement_type.value}"
        type_surface = self.small_font.render(type_text, True, Settings.COLORS['white'])
        screen.blit(type_surface, (panel_x + 10, panel_y + 40))

        # 所属势力
        if settlement.faction_id is not None and self.game.world:
            faction = self.game.world.get_faction(settlement.faction_id)
            if faction:
                faction_text = f"势力: {faction.name}"
                faction_surface = self.small_font.render(faction_text, True, faction.color)
                screen.blit(faction_surface, (panel_x + 10, panel_y + 60))

        # 人口
        pop_text = f"人口: {settlement.population}"
        pop_surface = self.small_font.render(pop_text, True, Settings.COLORS['white'])
        screen.blit(pop_surface, (panel_x + 10, panel_y + 80))

        # 繁荣度
        pros_text = f"繁荣: {settlement.prosperity}/100"
        pros_surface = self.small_font.render(pros_text, True, Settings.COLORS['white'])
        screen.blit(pros_surface, (panel_x + 10, panel_y + 100))

        # 驻军
        garrison_text = f"驻军: {len(settlement.garrison)}/{settlement.garrison_limit}"
        garrison_surface = self.small_font.render(garrison_text, True, Settings.COLORS['white'])
        screen.blit(garrison_surface, (panel_x + 10, panel_y + 120))

        # 距离
        if self.game.player:
            dist = math.sqrt(
                (self.game.player.world_x - settlement.world_x) ** 2 +
                (self.game.player.world_y - settlement.world_y) ** 2
            )
            dist_text = f"距离: {dist:.1f}"
            dist_surface = self.small_font.render(dist_text, True, Settings.COLORS['white'])
            screen.blit(dist_surface, (panel_x + 10, panel_y + 140))

        # 提示
        hint = "按Enter进入" if dist < 3 else "靠近后按Enter进入"
        hint_surface = self.small_font.render(hint, True, Settings.COLORS['yellow'])
        screen.blit(hint_surface, (panel_x + 10, panel_y + 170))