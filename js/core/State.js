// ============ 游戏状态管理（状态机） ============
const GameState = {
  TITLE: 'title',
  WORLD_MAP: 'world_map',
  SETTLEMENT: 'settlement',
  BATTLE: 'battle',
  CHARACTER: 'character',
  INVENTORY: 'inventory',
  PARTY: 'party',
  QUEST: 'quest',
  FACTION: 'faction',
  SHOP: 'shop',
  TAVERN: 'tavern',
  SMITHY: 'smithy',
  DIALOG: 'dialog',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
};

const StateManager = {
  current: GameState.TITLE,
  prev: null,
  data: {},   // 状态携带数据
  listeners: [],

  change(newState, data) {
    this.prev = this.current;
    this.current = newState;
    this.data = data || {};
    this.listeners.forEach(fn => fn(newState, this.prev, data));
    // 显示/隐藏快速操作栏
    if (typeof hideQuickActions === 'function') {
      if (newState === GameState.WORLD_MAP) {
        showQuickActions();
      } else {
        hideQuickActions();
      }
    }
  },

  goBack(data) {
    if (this.prev) this.change(this.prev, data);
  },

  onStateChange(fn) { this.listeners.push(fn); }
};
