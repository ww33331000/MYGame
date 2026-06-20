"""
游戏主类
"""

import pygame
import sys
from typing import Optional

from .settings import Settings
from .game_state import GameStateManager, GameState, BaseState


class Game:
    """游戏主类"""

    def __init__(self):
        # 初始化Pygame
        pygame.init()
        pygame.mixer.init()

        # 创建窗口
        self.screen = pygame.display.set_mode(
            (Settings.WINDOW_WIDTH, Settings.WINDOW_HEIGHT)
        )
        pygame.display.set_caption(Settings.WINDOW_TITLE)

        # 时钟
        self.clock = pygame.time.Clock()
        self.fps = Settings.FPS

        # 游戏状态管理器
        self.state_manager = GameStateManager()

        # 游戏数据
        self.world = None
        self.player = None
        self.factions = []
        self.quest_manager = None
        self.event_manager = None

        # 运行标志
        self.running = True

        # 初始化状态
        self._init_states()

    def _init_states(self):
        """初始化所有游戏状态"""
        from game.states.main_menu import MainMenuState
        from game.states.world_map import WorldMapState
        from game.states.battle import BattleState
        from game.states.town import TownState
        from game.states.castle import CastleState
        from game.states.village import VillageState
        from game.states.inventory import InventoryState
        from game.states.character import CharacterState
        from game.states.party import PartyState
        from game.states.quest_log import QuestLogState
        from game.states.faction import FactionState
        from game.states.trade import TradeState
        from game.states.dialogue import DialogueState
        from game.states.pause import PauseState

        # 注册所有状态
        self.state_manager.register_state(GameState.MAIN_MENU, MainMenuState(self))
        self.state_manager.register_state(GameState.WORLD_MAP, WorldMapState(self))
        self.state_manager.register_state(GameState.BATTLE, BattleState(self))
        self.state_manager.register_state(GameState.TOWN, TownState(self))
        self.state_manager.register_state(GameState.CASTLE, CastleState(self))
        self.state_manager.register_state(GameState.VILLAGE, VillageState(self))
        self.state_manager.register_state(GameState.INVENTORY, InventoryState(self))
        self.state_manager.register_state(GameState.CHARACTER, CharacterState(self))
        self.state_manager.register_state(GameState.PARTY, PartyState(self))
        self.state_manager.register_state(GameState.QUEST_LOG, QuestLogState(self))
        self.state_manager.register_state(GameState.FACTION, FactionState(self))
        self.state_manager.register_state(GameState.TRADE, TradeState(self))
        self.state_manager.register_state(GameState.DIALOGUE, DialogueState(self))
        self.state_manager.register_state(GameState.PAUSE, PauseState(self))

        # 设置初始状态
        self.state_manager.change_state(GameState.MAIN_MENU)

    def new_game(self):
        """开始新游戏"""
        from game.world.world_generator import WorldGenerator
        from game.entities.player import Player
        from game.managers.quest_manager import QuestManager
        from game.managers.event_manager import EventManager

        # 生成世界
        generator = WorldGenerator()
        self.world = generator.generate()

        # 创建玩家
        self.player = Player()
        self.player.gold = Settings.STARTING_GOLD

        # 初始化管理器
        self.quest_manager = QuestManager(self)
        self.event_manager = EventManager(self)

        # 切换到世界地图
        self.state_manager.change_state(GameState.WORLD_MAP)

    def load_game(self, save_name: str) -> bool:
        """加载游戏"""
        from game.managers.save_manager import SaveManager

        save_manager = SaveManager()
        data = save_manager.load(save_name)

        if data:
            # 恢复游戏状态
            self.world = data.get('world')
            self.player = data.get('player')
            self.factions = data.get('factions', [])
            # ... 恢复其他数据
            self.state_manager.change_state(GameState.WORLD_MAP)
            return True
        return False

    def save_game(self, save_name: str) -> bool:
        """保存游戏"""
        from game.managers.save_manager import SaveManager

        save_manager = SaveManager()
        data = {
            'world': self.world,
            'player': self.player,
            'factions': self.factions,
            # ... 其他数据
        }
        return save_manager.save(save_name, data)

    def handle_events(self):
        """处理事件"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state_manager.current_state == GameState.WORLD_MAP:
                        self.state_manager.push_state(GameState.PAUSE)
                    elif self.state_manager.current_state == GameState.PAUSE:
                        self.state_manager.pop_state()
            else:
                self.state_manager.handle_event(event)

    def update(self, delta_time: float):
        """更新游戏逻辑"""
        self.state_manager.update(delta_time)

    def render(self):
        """渲染游戏"""
        self.screen.fill(Settings.COLORS['black'])
        self.state_manager.render(self.screen)
        pygame.display.flip()

    def run(self):
        """游戏主循环"""
        while self.running:
            # 计算帧时间
            delta_time = self.clock.tick(self.fps) / 1000.0

            # 处理事件
            self.handle_events()

            # 更新
            self.update(delta_time)

            # 渲染
            self.render()

        # 清理
        pygame.quit()
        sys.exit()