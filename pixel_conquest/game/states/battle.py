"""
战斗状态
"""

import pygame
import math
import random
from typing import List, Tuple, Optional
from game.core.game_state import BaseState, GameState
from game.core.settings import Settings
from game.entities.army import Troop, TroopType


class BattleState(BaseState):
    """战斗状态"""

    def __init__(self, game):
        super().__init__(game)
        # 战斗地图
        self.map_width = Settings.BATTLE_MAP_WIDTH
        self.map_height = Settings.BATTLE_MAP_HEIGHT
        self.terrain_map: List[List[int]] = []

        # 参战方
        self.player_army: List[Troop] = []
        self.enemy_army: List[Troop] = []

        # 战斗单位
        self.units: List['BattleUnit'] = []
        self.selected_unit: Optional['BattleUnit'] = None

        # 相机
        self.camera_x = 0
        self.camera_y = 0
        self.zoom = 1.0

        # 战斗状态
        self.battle_started = False
        self.battle_ended = False
        self.victory = False
        self.battle_time = 0

        # 字体
        self.font = None
        self._init_fonts()

    def _init_fonts(self):
        self.font = pygame.font.Font(None, 24)

    def enter(self, **kwargs):
        """进入战斗"""
        self.battle_started = False
        self.battle_ended = False
        self.victory = False
        self.battle_time = 0

        # 生成战斗地图
        self._generate_battle_map()

        # 初始化参战方
        self._init_armies(kwargs)

        # 创建战斗单位
        self._create_units()

        # 设置相机
        self.camera_x = self.map_width * Settings.TILE_SIZE // 2 - Settings.WINDOW_WIDTH // 2
        self.camera_y = self.map_height * Settings.TILE_SIZE // 2 - Settings.WINDOW_HEIGHT // 2

    def _generate_battle_map(self):
        """生成战斗地图"""
        self.terrain_map = []
        for y in range(self.map_height):
            row = []
            for x in range(self.map_width):
                # 简单地形：大部分是平原，边缘有一些障碍
                if x < 5 or x >= self.map_width - 5 or y < 5 or y >= self.map_height - 5:
                    row.append(1)  # 边界/障碍
                else:
                    row.append(0)  # 平原
            self.terrain_map.append(row)

    def _init_armies(self, kwargs):
        """初始化军队"""
        # 玩家军队
        if self.game.player:
            self.player_army = self.game.player.party.copy()
            # 添加玩家自己
            player_troop = Troop(
                name=self.game.player.name,
                troop_type=TroopType.INFANTRY,
                tier=5,
                health=self.game.player.health,
                max_health=self.game.player.data.max_health,
                attack=self.game.player.get_attack_power(),
                defense=self.game.player.get_defense(),
                cost=0,
            )
            self.player_army.append(player_troop)

        # 敌军（如果没有指定，生成随机敌军）
        enemy_data = kwargs.get('enemy_army')
        if enemy_data:
            self.enemy_army = enemy_data
        else:
            # 生成随机敌军
            num_enemies = random.randint(5, 20)
            for i in range(num_enemies):
                self.enemy_army.append(Troop(
                    name=f"敌人{i+1}",
                    troop_type=random.choice(list(TroopType)),
                    tier=random.randint(1, 3),
                    health=30 + random.randint(0, 20),
                    max_health=30 + random.randint(0, 20),
                    attack=5 + random.randint(0, 10),
                    defense=2 + random.randint(0, 5),
                    cost=10,
                ))

    def _create_units(self):
        """创建战斗单位"""
        self.units = []

        # 玩方单位（左侧）
        for i, troop in enumerate(self.player_army):
            x = 10 + random.randint(0, 10)
            y = self.map_height // 2 - len(self.player_army) // 2 + i
            unit = BattleUnit(troop, x, y, True)
            self.units.append(unit)

        # 敌方单位（右侧）
        for i, troop in enumerate(self.enemy_army):
            x = self.map_width - 10 - random.randint(0, 10)
            y = self.map_height // 2 - len(self.enemy_army) // 2 + i
            unit = BattleUnit(troop, x, y, False)
            self.units.append(unit)

    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                # 撤退
                self._retreat()
            elif event.key == pygame.K_SPACE:
                # 开始/暂停战斗
                self.battle_started = not self.battle_started
            elif event.key == pygame.K_RETURN:
                # 结束战斗（如果战斗已结束）
                if self.battle_ended:
                    self._end_battle()

        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                # 选择单位
                self._select_unit_at(event.pos)

    def _select_unit_at(self, pos: Tuple[int, int]):
        """选择指定位置的单位"""
        tile_size = int(Settings.TILE_SIZE * self.zoom)
        world_x = (pos[0] + self.camera_x) // tile_size
        world_y = (pos[1] + self.camera_y) // tile_size

        for unit in self.units:
            if unit.x == world_x and unit.y == world_y and unit.is_player:
                self.selected_unit = unit
                return

        self.selected_unit = None

    def _retreat(self):
        """撤退"""
        # 撤退会损失一些士兵
        casualties = min(3, len(self.player_army))
        self.game.state_manager.pop_state()

    def _end_battle(self):
        """结束战斗"""
        if self.victory:
            # 获得战利品
            loot_gold = sum(troop.cost * 5 for troop in self.enemy_army)
            self.game.player.gold += loot_gold

            # 获得俘虏
            for unit in self.units:
                if not unit.is_player and unit.troop.health > 0:
                    self.game.player.add_prisoner(unit.troop)

            # 获得声望
            self.game.player.add_renown(10)

        self.game.state_manager.pop_state()

    def update(self, delta_time: float):
        """更新战斗"""
        if not self.battle_started or self.battle_ended:
            return

        self.battle_time += delta_time

        # 更新所有单位
        for unit in self.units:
            unit.update(delta_time, self.units, self.terrain_map)

        # 检查战斗结束
        player_alive = any(u.is_player and u.troop.health > 0 for u in self.units)
        enemy_alive = any(not u.is_player and u.troop.health > 0 for u in self.units)

        if not player_alive:
            self.battle_ended = True
            self.victory = False
        elif not enemy_alive:
            self.battle_ended = True
            self.victory = True

    def render(self, screen):
        """渲染"""
        # 绘制战斗地图
        self._render_map(screen)

        # 绘制单位
        self._render_units(screen)

        # 绘制UI
        self._render_ui(screen)

    def _render_map(self, screen):
        """渲染战斗地图"""
        tile_size = int(Settings.TILE_SIZE * self.zoom)

        for y in range(self.map_height):
            for x in range(self.map_width):
                terrain = self.terrain_map[y][x]
                color = (144, 238, 144) if terrain == 0 else (100, 100, 100)

                rect = pygame.Rect(
                    x * tile_size - self.camera_x,
                    y * tile_size - self.camera_y,
                    tile_size,
                    tile_size
                )

                if rect.right > 0 and rect.left < Settings.WINDOW_WIDTH and rect.bottom > 0 and rect.top < Settings.WINDOW_HEIGHT:
                    pygame.draw.rect(screen, color, rect)

    def _render_units(self, screen):
        """渲染单位"""
        tile_size = int(Settings.TILE_SIZE * self.zoom)

        for unit in self.units:
            if unit.troop.health <= 0:
                continue

            screen_x = unit.x * tile_size - self.camera_x + tile_size // 2
            screen_y = unit.y * tile_size - self.camera_y + tile_size // 2

            # 阵营颜色
            color = Settings.COLORS['blue'] if unit.is_player else Settings.COLORS['red']

            # 绘制单位
            size = 8 + unit.troop.tier * 2
            pygame.draw.circle(screen, color, (int(screen_x), int(screen_y)), size)

            # 选中标记
            if unit == self.selected_unit:
                pygame.draw.circle(screen, Settings.COLORS['yellow'],
                                 (int(screen_x), int(screen_y)), size + 3, 2)

            # 血条
            health_ratio = unit.troop.health / unit.troop.max_health
            bar_width = tile_size
            bar_height = 4
            bar_x = screen_x - bar_width // 2
            bar_y = screen_y - size - 8

            pygame.draw.rect(screen, Settings.COLORS['dark_gray'],
                           (bar_x, bar_y, bar_width, bar_height))
            pygame.draw.rect(screen, Settings.COLORS['green'],
                           (bar_x, bar_y, int(bar_width * health_ratio), bar_height))

    def _render_ui(self, screen):
        """渲染UI"""
        # 顶部信息
        pygame.draw.rect(screen, (0, 0, 0, 180), (0, 0, Settings.WINDOW_WIDTH, 40))

        # 玩方部队数
        player_count = sum(1 for u in self.units if u.is_player and u.troop.health > 0)
        player_text = f"我方: {player_count}"
        player_surface = self.font.render(player_text, True, Settings.COLORS['blue'])
        screen.blit(player_surface, (20, 10))

        # 敌方部队数
        enemy_count = sum(1 for u in self.units if not u.is_player and u.troop.health > 0)
        enemy_text = f"敌方: {enemy_count}"
        enemy_surface = self.font.render(enemy_text, True, Settings.COLORS['red'])
        screen.blit(enemy_surface, (150, 10))

        # 战斗时间
        time_text = f"时间: {int(self.battle_time)}秒"
        time_surface = self.font.render(time_text, True, Settings.COLORS['white'])
        screen.blit(time_surface, (300, 10))

        # 状态提示
        if not self.battle_started:
            status = "按空格开始战斗"
        elif self.battle_ended:
            status = "胜利!" if self.victory else "失败!"
        else:
            status = "战斗进行中..."

        status_surface = self.font.render(status, True, Settings.COLORS['gold'])
        screen.blit(status_surface, (500, 10))

        # 底部提示
        pygame.draw.rect(screen, (0, 0, 0, 180),
                        (0, Settings.WINDOW_HEIGHT - 30, Settings.WINDOW_WIDTH, 30))
        hint = "空格:开始/暂停 | ESC:撤退 | 点击选择单位"
        hint_surface = self.font.render(hint, True, Settings.COLORS['white'])
        screen.blit(hint_surface, (20, Settings.WINDOW_HEIGHT - 25))


class BattleUnit:
    """战斗单位"""

    def __init__(self, troop: Troop, x: int, y: int, is_player: bool):
        self.troop = troop
        self.x = x
        self.y = y
        self.is_player = is_player
        self.target: Optional['BattleUnit'] = None
        self.attack_cooldown = 0
        self.move_cooldown = 0

    def update(self, delta_time: float, all_units: List['BattleUnit'],
               terrain_map: List[List[int]]):
        """更新单位"""
        if self.troop.health <= 0:
            return

        # 更新冷却
        self.attack_cooldown -= delta_time
        self.move_cooldown -= delta_time

        # 寻找目标
        if not self.target or self.target.troop.health <= 0:
            self._find_target(all_units)

        # 移动到目标
        if self.target and self.move_cooldown <= 0:
            self._move_towards_target(terrain_map)

        # 攻击目标
        if self.target and self.attack_cooldown <= 0:
            dist = abs(self.x - self.target.x) + abs(self.y - self.target.y)
            if dist <= 2:  # 攻击范围
                self._attack_target()

    def _find_target(self, all_units: List['BattleUnit']):
        """寻找目标"""
        closest = None
        min_dist = float('inf')

        for unit in all_units:
            if unit.is_player != self.is_player and unit.troop.health > 0:
                dist = abs(self.x - unit.x) + abs(self.y - unit.y)
                if dist < min_dist:
                    min_dist = dist
                    closest = unit

        self.target = closest

    def _move_towards_target(self, terrain_map: List[List[int]]):
        """向目标移动"""
        if not self.target:
            return

        dx = self.target.x - self.x
        dy = self.target.y - self.y

        # 移动一步
        move_x = 0 if dx == 0 else (1 if dx > 0 else -1)
        move_y = 0 if dy == 0 else (1 if dy > 0 else -1)

        new_x = self.x + move_x
        new_y = self.y + move_y

        # 检查地形
        if 0 <= new_x < len(terrain_map[0]) and 0 <= new_y < len(terrain_map):
            if terrain_map[new_y][new_x] == 0:  # 可通行
                self.x = new_x
                self.y = new_y

        self.move_cooldown = 0.5 / self.troop.speed

    def _attack_target(self):
        """攻击目标"""
        if not self.target:
            return

        # 计算伤害
        damage = self.troop.attack - self.target.troop.defense // 2
        damage = max(1, damage)

        # 应用伤害
        self.target.troop.health -= damage

        # 设置冷却
        self.attack_cooldown = 1.0