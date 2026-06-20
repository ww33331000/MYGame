# 技术架构文档 - 大陆风云

## 1. 技术栈概述

### 1.1 核心技术
- **渲染引擎**: HTML5 Canvas 2D
- **开发语言**: JavaScript (ES6+)
- **架构模式**: 模块化组件系统
- **构建工具**: Vite (可选)
- **存储**: LocalStorage

### 1.2 项目结构
```
/workspace/
├── index.html              # 入口HTML
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── main.js             # 游戏入口
│   ├── core/               # 核心模块
│   │   ├── Game.js         # 游戏主循环
│   │   ├── Input.js        # 输入处理
│   │   ├── Renderer.js     # 渲染器
│   │   ├── Audio.js        # 音频管理
│   │   └── SaveLoad.js     # 存档系统
│   ├── world/              # 世界系统
│   │   ├── WorldMap.js     # 大地图
│   │   ├── Location.js     # 地点(城镇/城堡/村庄)
│   │   ├── Faction.js      # 势力
│   │   └── WorldGenerator.js # 世界生成器
│   ├── entity/             # 实体系统
│   │   ├── Entity.js       # 基础实体
│   │   ├── Player.js       # 玩家
│   │   ├── NPC.js          # NPC
│   │   └── Soldier.js       # 士兵
│   ├── combat/             # 战斗系统
│   │   ├── BattleManager.js # 战斗管理
│   │   ├── BattleMap.js    # 战斗地图
│   │   └── CombatUnit.js   # 战斗单位
│   ├── rpg/                # RPG系统
│   │   ├── Character.js    # 角色属性
│   │   ├── Equipment.js    # 装备系统
│   │   ├── Inventory.js    # 背包
│   │   └── Skill.js        # 技能
│   ├── caravan/            # 商队系统
│   │   └── Caravan.js      # 商队
│   ├── army/               # 军团系统
│   │   └── Army.js         # 军团
│   ├── quest/              # 任务系统
│   │   ├── QuestManager.js  # 任务管理
│   │   └── Quest.js        # 任务
│   ├── faction/            # 势力系统
│   │   └── Kingdom.js      # 王国
│   └── ui/                 # UI系统
│       ├── UIManager.js    # UI管理
│       ├── MenuBar.js      # 菜单栏
│       ├── StatusBar.js    # 状态栏
│       ├── DialogBox.js    # 对话框
│       └── BattleUI.js     # 战斗UI
├── assets/                 # 资源目录
│   ├── sprites/           # 精灵图
│   ├── audio/             # 音频
│   └── data/              # 游戏数据JSON
└── save/                   # 存档目录
```

---

## 2. 核心模块设计

### 2.1 游戏主循环 (Game.js)
```javascript
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;
    this.state = 'menu';  // menu, world, battle, dialog
    this.lastTime = 0;
    this.deltaTime = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(currentTime) {
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(this.deltaTime);
    this.render();

    if (this.running) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  update(dt) { /* 更新游戏逻辑 */ }
  render() { /* 渲染画面 */ }
}
```

### 2.2 输入处理 (Input.js)
```javascript
class Input {
  constructor(canvas) {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.setupListeners(canvas);
  }

  setupListeners(canvas) {
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', () => this.mouse.down = true);
    canvas.addEventListener('mouseup', () => this.mouse.down = false);
  }

  isKeyDown(code) { return this.keys[code] || false; }
  isMouseDown() { return this.mouse.down; }
}
```

### 2.3 渲染器 (Renderer.js)
```javascript
class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.camera = { x: 0, y: 0, zoom: 1 };
  }

  clear(color = '#1a1a2e') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawSprite(sprite, x, y, flipX = false) {
    // 像素风格: imageSmoothingEnabled = false
    this.ctx.imageSmoothingEnabled = false;
    // 绘制逻辑
  }

  drawText(text, x, y, options = {}) {
    const { color = '#fff', size = 16, align = 'left' } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }
}
```

---

## 3. 世界生成系统

### 3.1 世界尺寸
- 大地图尺寸: 8192 x 8192 像素
- 逻辑坐标系统: 每像素 = 1米
- 缩放级别: 0.25x - 2x

### 3.2 位置生成算法
```javascript
class WorldGenerator {
  constructor(seed) {
    this.seed = seed;
    this.random = this.seededRandom(seed);
  }

  generate() {
    const world = {
      towns: this.generateTowns(40),
      castles: this.generateCastles(120),
      villages: this.generateVillages(300),
      roads: this.generateRoads(),
      factions: this.generateFactions(6)
    };
    this.assignVillagesToTowns(world);
    return world;
  }

  generateTowns(count) {
    const towns = [];
    const gridSize = Math.sqrt(count);
    const spacing = 1800; // 城镇间距

    for (let i = 0; i < count; i++) {
      towns.push({
        id: `town_${i}`,
        name: this.randomTownName(),
        x: 400 + (i % gridSize) * spacing + this.random.range(-200, 200),
        y: 400 + Math.floor(i / gridSize) * spacing + this.random.range(-200, 200),
        population: this.random.range(2000, 10000),
        owner: null,
        prosperity: this.random.range(30, 100),
        garrison: this.random.range(50, 500)
      });
    }
    return towns;
  }
}
```

### 3.3 势力分配
```javascript
assignFactions(world) {
  const factionCount = world.factions.length;
  world.towns.forEach((town, i) => {
    town.owner = world.factions[i % factionCount].id;
  });
  // 城堡和村庄隶属关系
}
```

---

## 4. 战斗系统设计

### 4.1 战斗流程
```
进入战斗 → 加载战斗地图 → 初始化单位 → 战斗循环
                                              ↓
                                          胜负判定
                                              ↓
                                        战斗结算 → 返回大地图
```

### 4.2 战斗地图
```javascript
class BattleMap {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.terrain = [];  // 地形网格
    this.units = [];    // 参战单位
    this.gridSize = 32; // 像素网格
  }

  generateTerrain() {
    // 生成随机地形
    // 平原、树林、岩石、水体等
  }
}
```

### 4.3 战斗单位
```javascript
class CombatUnit {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.maxHp = config.maxHp || 100;
    this.hp = this.maxHp;
    this.damage = config.damage || 10;
    this.speed = config.speed || 100; // 像素/秒
    this.attackRange = config.attackRange || 40;
    this.attackCooldown = config.attackCooldown || 1; // 秒
    this.state = 'idle'; // idle, moving, attacking, dead
    this.direction = 'down';
    this.target = null;
    this.team = config.team || 0; // 0=玩家, 1=敌人
  }

  update(dt, battleMap) {
    if (this.state === 'dead') return;

    if (this.target && this.target.hp > 0) {
      const dist = this.distanceTo(this.target);
      if (dist <= this.attackRange) {
        this.attack();
      } else {
        this.moveToward(this.target, dt);
      }
    }
  }

  attack() {
    if (this.attackCooldownTimer <= 0) {
      this.target.takeDamage(this.damage);
      this.attackCooldownTimer = this.attackCooldown;
      this.state = 'attacking';
    }
  }
}
```

---

## 5. RPG系统设计

### 5.1 角色属性
```javascript
class Character {
  constructor() {
    this.name = '无名旅人';
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;

    // 基础属性
    this.attributes = {
      strength: 5,     // 力量
      agility: 5,       // 敏捷
      vitality: 5,     // 体质
      intelligence: 5, // 智力
      charisma: 5      // 魅力
    };

    // 衍生属性
    this.maxHp = 100;
    this.maxStamina = 50;
    this.attack = 10;
    this.defense = 5;
    this.speed = 100;
    this.carryWeight = 50;

    // 技能
    this.skills = {};
    this.equipment = new Equipment();
    this.inventory = new Inventory(20);
  }

  levelUp() {
    this.level++;
    this.exp -= this.expToNext;
    this.expToNext = Math.floor(100 * Math.pow(1.2, this.level));
    // 属性提升
    this.attributes.strength += 2;
    this.attributes.agility += 2;
    this.attributes.vitality += 2;
    this.recalculateStats();
  }

  recalculateStats() {
    this.maxHp = 100 + this.attributes.vitality * 10;
    this.maxStamina = 50 + this.attributes.agility * 2;
    this.attack = 10 + this.attributes.strength * 2;
    this.defense = 5 + this.attributes.vitality;
    this.carryWeight = 50 + this.attributes.strength * 5;
  }
}
```

### 5.2 装备系统
```javascript
class Equipment {
  constructor() {
    this.slots = {
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
      feet: null,
      mount: null
    };
  }

  equip(item) {
    const slot = item.equipSlot;
    if (this.slots[slot]) {
      // 替换装备,返回旧装备
    }
    this.slots[slot] = item;
  }

  getTotalStats() {
    // 计算装备提供的属性加成
  }
}
```

---

## 6. UI系统设计

### 6.1 UI管理器
```javascript
class UIManager {
  constructor(game) {
    this.game = game;
    this.panels = new Map();
    this.currentDialog = null;
  }

  showPanel(name, config = {}) {
    const panel = this.createPanel(name, config);
    this.panels.set(name, panel);
    return panel;
  }

  hidePanel(name) {
    this.panels.delete(name);
  }

  render(ctx) {
    // 渲染所有活动面板
    for (const panel of this.panels.values()) {
      panel.render(ctx);
    }
  }

  handleClick(x, y) {
    // 事件分发
    for (const panel of this.panels.values()) {
      if (panel.contains(x, y)) {
        panel.onClick(x, y);
        return true;
      }
    }
    return false;
  }
}
```

### 6.2 状态栏
```javascript
class StatusBar {
  render(ctx, gameState) {
    const y = this.height - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, y, this.width, 40);

    // 金币
    this.drawText(`💰 ${gameState.gold}`, 20, y + 25);

    // 日期
    this.drawText(`${gameState.day}/${gameState.month}/${gameState.year}`, 200, y + 25);

    // 位置
    this.drawText(gameState.location, 400, y + 25);

    // 生命值条
    this.drawBar(600, y + 10, 150, 20, gameState.hp, gameState.maxHp, '#ff4444');

    // 耐力条
    this.drawBar(600, y + 10, 150, 20, gameState.stamina, gameState.maxStamina, '#44ff44');
  }
}
```

---

## 7. 存档系统

### 7.1 数据结构
```javascript
class SaveData {
  static create(gameState) {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      player: {
        name: gameState.player.name,
        level: gameState.player.level,
        exp: gameState.player.exp,
        attributes: gameState.player.attributes,
        equipment: gameState.player.equipment.slots,
        inventory: gameState.player.inventory.items,
        position: { x: gameState.player.x, y: gameState.player.y },
        gold: gameState.player.gold
      },
      world: {
        towns: gameState.world.towns,
        castles: gameState.world.castles,
        villages: gameState.world.villages,
        factions: gameState.world.factions,
        relations: gameState.world.relations
      },
      armies: gameState.player.armies,
      caravans: gameState.player.caravans,
      quests: gameState.questManager.activeQuests,
      settings: gameState.settings
    };
  }
}
```

### 7.2 存储接口
```javascript
class SaveLoadManager {
  save(slot, data) {
    const key = `大陆风云_save_${slot}`;
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
  }

  load(slot) {
    const key = `大陆风云_save_${slot}`;
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  }

  delete(slot) {
    const key = `大陆风云_save_${slot}`;
    localStorage.removeItem(key);
  }

  listSaves() {
    const saves = [];
    for (let i = 0; i < 3; i++) {
      const key = `大陆风云_save_${i}`;
      const data = localStorage.getItem(key);
      if (data) {
        saves.push(JSON.parse(data));
      }
    }
    return saves;
  }
}
```

---

## 8. 性能优化

### 8.1 渲染优化
- **视口裁剪**: 只渲染可视区域内的对象
- **精灵批处理**: 合并相同纹理的绘制
- **脏矩形更新**: 只重绘变化区域
- **Canvas分层**: 背景层、实体层、UI层分离

### 8.2 逻辑优化
- **空间分区**: 使用四叉树管理实体位置
- **距离计算缓存**: 避免重复计算
- **LOD系统**: 远距离单位简化渲染

### 8.3 内存优化
- **对象池**: 频繁创建/销毁的对象复用
- **懒加载**: 资源按需加载
- **垃圾回收**: 及时清理无用引用

---

## 9. 像素风格实现

### 9.1 渲染设置
```javascript
// 禁用抗锯齿
ctx.imageSmoothingEnabled = false;

// 使用最近邻缩放
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
```

### 9.2 像素字体
```css
@font-face {
  font-family: 'PixelFont';
  src: url('assets/fonts/pixel.ttf') format('truetype');
}

.pixel-text {
  font-family: 'PixelFont', monospace;
  font-size: 16px;
  /* 像素风格通常使用2的倍数 */
}
```

---

## 10. 多人/扩展考虑

当前版本为单机买断制，未来可扩展:
- **热座模式**: 本地双人分屏
- **网络模式**: P2P或服务器多人
- **Mod支持**: 开放自定义内容接口

---

*文档版本: 1.0*
*最后更新: 2026-06-20*
