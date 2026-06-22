// ============ 存档系统 ============
// 使用 localStorage 存储 3 个存档槽
const SaveSystem = {
  SAVE_KEY: 'tieqi_saves_v1',
  MAX_SLOTS: 3,
  AUTOSAVE_KEY: 'tieqi_autosave_v1',

  // 获取所有存档元数据
  getAllSaveMeta() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (!data) return this.createEmptySlots();
      const saves = JSON.parse(data);
      // 确保有3个槽位
      while (saves.length < this.MAX_SLOTS) {
        saves.push({ empty: true, slot: saves.length + 1 });
      }
      return saves;
    } catch (e) {
      console.error('读取存档失败:', e);
      return this.createEmptySlots();
    }
  },

  createEmptySlots() {
    return [1, 2, 3].map(i => ({ empty: true, slot: i }));
  },

  // 保存到指定槽位
  saveToSlot(slotIndex, label) {
    if (!Game.player || !Game.world) {
      toast('没有可保存的游戏数据！', '#f86868');
      return false;
    }
    try {
      const saveData = this.serializeGame();
      saveData.slot = slotIndex + 1;
      saveData.label = label || '新存档';
      saveData.savedAt = new Date().toISOString();
      saveData.dayCount = Game.dayCount;
      saveData.playerName = Game.player.name;
      saveData.playerLevel = Game.player.level;
      saveData.gold = Game.player.party.gold;
      saveData.location = Game.ui.currentSettlement ? Game.ui.currentSettlement.name : '大地图';

      const saves = this.getAllSaveMeta();
      saves[slotIndex] = saveData;
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
      toast('已保存到槽位 ' + (slotIndex + 1), '#78d878');
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      toast('保存失败：' + e.message, '#f86868');
      return false;
    }
  },

  // 从指定槽位读取
  loadFromSlot(slotIndex) {
    try {
      const saves = this.getAllSaveMeta();
      const save = saves[slotIndex];
      if (!save || save.empty) {
        toast('该槽位没有存档！', '#f86868');
        return false;
      }
      this.deserializeGame(save);
      toast('载入存档成功！', '#78d878');
      return true;
    } catch (e) {
      console.error('读取存档失败:', e);
      toast('读取存档失败：' + e.message, '#f86868');
      return false;
    }
  },

  // 序列化游戏数据
  serializeGame() {
    const data = {
      version: 1,
      // 世界设置（大小、种子）
      worldConfig: {
        width: Game.world.width,
        height: Game.world.height
      },
      // 玩家数据
      player: {
        name: Game.player.name,
        level: Game.player.level,
        exp: Game.player.exp,
        expNeeded: Game.player.expNeeded,
        maxHp: Game.player.maxHp,
        hp: Game.player.hp,
        strength: Game.player.strength,
        agility: Game.player.agility,
        vitality: Game.player.vitality,
        intelligence: Game.player.intelligence,
        reputation: Game.player.reputation,
        factionId: Game.player.factionId,
        isKing: Game.player.isKing,
        x: Game.player.x,
        y: Game.player.y,
        equipment: {
          weapon: Game.player.equipment.weapon,
          armor: Game.player.equipment.armor,
          helmet: Game.player.equipment.helmet,
          shield: Game.player.equipment.shield
        },
        party: {
          gold: Game.player.party.gold,
          maxSize: Game.player.party.maxSize,
          wagonCapacity: Game.player.party.wagonCapacity,
          morale: Game.player.party.morale,
          weeklyWage: Game.player.party.weeklyWage,
          currentLoad: Game.player.party.currentLoad,
          members: Game.player.party.members.map(m => ({
            typeId: m.typeId,
            name: m.name,
            level: m.level,
            exp: m.exp,
            maxHp: m.maxHp,
            hp: m.hp,
            baseDamage: m.baseDamage,
            baseDefense: m.baseDefense,
            speed: m.speed,
            weapon: m.weapon,
            factionId: m.factionId,
            isDead: m.isDead,
            isPlayer: m.isPlayer
          })),
          inventory: Game.player.party.inventory.map(e => ({
            item: e.item,
            quantity: e.quantity
          }))
        }
      },
      // 世界数据
      world: {
        factions: Game.world.factions,
        settlements: Game.world.settlements,
        terrainGrid: Game.world.terrainGrid,
        gridSize: Game.world.gridSize,
        gridCols: Game.world.gridCols,
        gridRows: Game.world.gridRows,
        landBounds: Game.world.landBounds,
        patrols: Game.world.patrols,
        currentDay: Game.world.currentDay
      },
      // 任务系统
      quests: {
        active: Game.world.questSystem.activeQuests,
        completed: Game.world.questSystem.completedQuests,
        questCounter: Game.world.questSystem.questCounter
      },
      // 游戏时间
      dayCount: Game.dayCount,
      gameTime: Game.gameTime
    };
    return data;
  },

  // 反序列化游戏数据
  deserializeGame(data) {
    if (data.version !== 1) {
      throw new Error('存档版本不兼容');
    }
    // 重建世界
    Game.world = new World();
    Game.world.width = data.worldConfig.width;
    Game.world.height = data.worldConfig.height;
    Game.world.factions = data.world.factions;
    Game.world.terrainGrid = data.world.terrainGrid;
    Game.world.gridSize = data.world.gridSize;
    Game.world.gridCols = data.world.gridCols;
    Game.world.gridRows = data.world.gridRows;
    Game.world.landBounds = data.world.landBounds;
    Game.world.settlements = data.world.settlements;
    Game.world.patrols = data.world.patrols;
    Game.world.currentDay = data.world.currentDay;
    // 重建任务系统
    Game.world.questSystem = new QuestSystem(Game.world);
    Game.world.questSystem.activeQuests = data.quests.active || [];
    Game.world.questSystem.completedQuests = data.quests.completed || [];
    Game.world.questSystem.questCounter = data.quests.questCounter || 0;
    // 重建玩家
    Game.player = new Player(Game.world);
    const pd = data.player;
    Game.player.name = pd.name;
    Game.player.level = pd.level;
    Game.player.exp = pd.exp;
    Game.player.expNeeded = pd.expNeeded;
    Game.player.maxHp = pd.maxHp;
    Game.player.hp = pd.hp;
    Game.player.strength = pd.strength;
    Game.player.agility = pd.agility;
    Game.player.vitality = pd.vitality;
    Game.player.intelligence = pd.intelligence;
    Game.player.reputation = pd.reputation;
    Game.player.factionId = pd.factionId;
    Game.player.isKing = pd.isKing;
    Game.player.x = pd.x;
    Game.player.y = pd.y;
    Game.player.equipment = pd.equipment;
    // 重建队伍
    Game.player.party.gold = pd.party.gold;
    Game.player.party.maxSize = pd.party.maxSize;
    Game.player.party.wagonCapacity = pd.party.wagonCapacity;
    Game.player.party.morale = pd.party.morale;
    Game.player.party.weeklyWage = pd.party.weeklyWage;
    Game.player.party.currentLoad = pd.party.currentLoad;
    Game.player.party.members = pd.party.members.map(md => {
      const u = new Unit(md.typeId, md.factionId);
      u.name = md.name;
      u.level = md.level;
      u.exp = md.exp;
      u.maxHp = md.maxHp;
      u.hp = md.hp;
      u.baseDamage = md.baseDamage;
      u.baseDefense = md.baseDefense;
      u.speed = md.speed;
      u.weapon = md.weapon;
      u.isDead = md.isDead;
      u.isPlayer = md.isPlayer;
      return u;
    });
    Game.player.party.inventory = pd.party.inventory;
    // 同步玩家单位
    Game.player.playerUnit = Game.player.party.members.find(m => m.isPlayer);
    // 重建地图
    Game.worldMap = new WorldMap(Game.world, Game.player);
    Game.battleMap = new BattleMap();
    // 设置游戏时间
    Game.dayCount = data.dayCount;
    Game.gameTime = data.gameTime;
    // 切换状态
    StateManager.change(GameState.WORLD_MAP);
    Game.ui.clearPanels();
  },

  // 自动存档
  autoSave() {
    try {
      const saveData = this.serializeGame();
      saveData.label = '自动存档';
      saveData.dayCount = Game.dayCount;
      saveData.playerName = Game.player ? Game.player.name : '?';
      saveData.playerLevel = Game.player ? Game.player.level : 1;
      saveData.gold = Game.player ? Game.player.party.gold : 0;
      saveData.location = Game.ui.currentSettlement ? Game.ui.currentSettlement.name : '大地图';
      saveData.savedAt = new Date().toISOString();
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.error('自动存档失败:', e);
    }
  },

  // 读取自动存档
  loadAutoSave() {
    try {
      const data = localStorage.getItem(this.AUTOSAVE_KEY);
      if (!data) {
        toast('没有自动存档！', '#f86868');
        return false;
      }
      this.deserializeGame(JSON.parse(data));
      toast('载入自动存档成功！', '#78d878');
      return true;
    } catch (e) {
      console.error('读取自动存档失败:', e);
      toast('读取自动存档失败：' + e.message, '#f86868');
      return false;
    }
  },

  // 删除存档
  deleteSlot(slotIndex) {
    try {
      const saves = this.getAllSaveMeta();
      saves[slotIndex] = { empty: true, slot: slotIndex + 1 };
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saves));
      toast('已删除存档 ' + (slotIndex + 1), '#b89856');
      return true;
    } catch (e) {
      console.error('删除存档失败:', e);
      return false;
    }
  },

  // 是否有任何存档
  hasAnySave() {
    const saves = this.getAllSaveMeta();
    return saves.some(s => !s.empty);
  },

  // 是否有自动存档
  hasAutoSave() {
    return !!localStorage.getItem(this.AUTOSAVE_KEY);
  }
};
