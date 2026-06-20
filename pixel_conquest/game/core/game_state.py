"""
游戏状态管理
"""

from enum import Enum, auto
from typing import Optional, Dict, Type


class GameState(Enum):
    """游戏状态枚举"""
    MAIN_MENU = auto()
    WORLD_MAP = auto()
    BATTLE = auto()
    TOWN = auto()
    CASTLE = auto()
    VILLAGE = auto()
    INVENTORY = auto()
    CHARACTER = auto()
    PARTY = auto()
    QUEST_LOG = auto()
    FACTION = auto()
    TRADE = auto()
    DIALOGUE = auto()
    PAUSE = auto()
    GAME_OVER = auto()


class GameStateManager:
    """游戏状态管理器"""

    def __init__(self):
        self._states: Dict[GameState, 'BaseState'] = {}
        self._current_state: Optional[GameState] = None
        self._previous_state: Optional[GameState] = None
        self._state_stack = []

    def register_state(self, state_type: GameState, state_instance: 'BaseState'):
        """注册状态"""
        self._states[state_type] = state_instance

    def change_state(self, new_state: GameState, **kwargs):
        """切换状态"""
        if self._current_state is not None:
            self._states[self._current_state].exit()
            self._previous_state = self._current_state

        self._current_state = new_state
        if new_state in self._states:
            self._states[new_state].enter(**kwargs)

    def push_state(self, state: GameState, **kwargs):
        """压入状态（用于暂停等）"""
        if self._current_state is not None:
            self._state_stack.append(self._current_state)
            self._states[self._current_state].pause()
        self.change_state(state, **kwargs)

    def pop_state(self):
        """弹出状态"""
        if self._state_stack:
            if self._current_state:
                self._states[self._current_state].exit()
            self._current_state = self._state_stack.pop()
            self._states[self._current_state].resume()

    def update(self, delta_time: float):
        """更新当前状态"""
        if self._current_state and self._current_state in self._states:
            self._states[self._current_state].update(delta_time)

    def render(self, screen):
        """渲染当前状态"""
        if self._current_state and self._current_state in self._states:
            self._states[self._current_state].render(screen)

    def handle_event(self, event):
        """处理事件"""
        if self._current_state and self._current_state in self._states:
            self._states[self._current_state].handle_event(event)

    @property
    def current_state(self) -> Optional[GameState]:
        return self._current_state

    @property
    def previous_state(self) -> Optional[GameState]:
        return self._previous_state


class BaseState:
    """状态基类"""

    def __init__(self, game):
        self.game = game

    def enter(self, **kwargs):
        """进入状态"""
        pass

    def exit(self):
        """退出状态"""
        pass

    def pause(self):
        """暂停状态"""
        pass

    def resume(self):
        """恢复状态"""
        pass

    def update(self, delta_time: float):
        """更新逻辑"""
        pass

    def render(self, screen):
        """渲染"""
        pass

    def handle_event(self, event):
        """处理事件"""
        pass