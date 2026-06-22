// 测试游戏关键模块
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 创建沙箱上下文
const fakeCtx = {
  fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
  fillRect: () => {}, strokeRect: () => {}, fillText: () => {},
  beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
  stroke: () => {}, fill: () => {}, arc: () => {}, ellipse: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  save: () => {}, restore: () => {}, drawImage: () => {},
  getImageData: () => ({ data: [] }),
  measureText: () => ({ width: 10 }),
  imageSmoothingEnabled: true
};
const fakeLayer = {
  appendChild: () => {},
  removeChild: () => {}
};
let nextId = 0;
const fakeEl = () => ({
  id: 'el' + (nextId++),
  style: {},
  className: '',
  textContent: '',
  remove: function() { if (this.parentNode) this.parentNode.removeChild(this); },
  parentNode: fakeLayer
});
const ctx = {
  console: console,
  Math: Math, Date: Date, Array: Array, Object: Object, JSON: JSON,
  Set: Set, Map: Map,
  window: { addEventListener: () => {} },
  fakeCtx: fakeCtx,
  document: {
    _elCache: {},
    getElementById(id) {
      if (!this._elCache[id]) {
        this._elCache[id] = id === 'game-canvas' ? {
          width: 960, height: 600,
          getContext: () => fakeCtx,
          getBoundingClientRect: () => ({left:0,top:0,width:960,height:600}),
          addEventListener: () => {},
          style: {}
        } : {
          appendChild: function(child) { child.parentNode = this; },
          removeChild: function(child) { if (child.parentNode === this) child.parentNode = null; },
          addEventListener: () => {},
          style: {},
          remove: function() { if (this.parentNode) this.parentNode.removeChild(this); }
        };
      }
      return this._elCache[id];
    },
    addEventListener: () => {},
    createElement: () => fakeEl()
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
  },
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  parseInt, parseFloat, isNaN,
  setTimeout, clearTimeout,
  confirm: () => false
};
vm.createContext(ctx);

// 加载所有JS文件
const files = [
  'core/Utils.js', 'core/Input.js', 'core/State.js', 'core/Game.js', 'core/SaveSystem.js',
  'entity/Equipment.js', 'entity/Unit.js', 'entity/Party.js', 'entity/Player.js',
  'world/Faction.js', 'world/Settlement.js', 'world/World.js',
  'map/WorldMap.js', 'map/BattleMap.js',
  'battle/Combat.js', 'quest/Quest.js', 'ui/UI.js', 'main.js'
];

let loaded = 0;
for (const f of files) {
  try {
    const code = fs.readFileSync(path.join('./js', f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
    loaded++;
  } catch (e) {
    console.log('FAIL: ' + f + ' - ' + e.message);
  }
}
console.log('加载完成: ' + loaded + '/' + files.length + ' 个文件');

// 在沙箱中运行所有测试
vm.runInContext(`
  // ========== 测试世界生成 ==========
  console.log('\\n=== 测试世界生成 ===');
  const world = new World();
  world.generate();
  const townCount = world.settlements.filter(s => s.type === 'town').length;
  const castleCount = world.settlements.filter(s => s.type === 'castle').length;
  const villageCount = world.settlements.filter(s => s.type === 'village').length;
  console.log('生成: ' + townCount + ' 城镇, ' + castleCount + ' 城堡, ' + villageCount + ' 村庄');
  console.log('陆地边界: ' + world.landBounds.minX + '-' + world.landBounds.maxX);
  let landCount = 0, seaCount = 0;
  for (let r = 0; r < world.gridRows; r++) {
    for (let c = 0; c < world.gridCols; c++) {
      if (world.terrainGrid[r][c] > 0) landCount++;
      else seaCount++;
    }
  }
  console.log('陆地: ' + (landCount/(landCount+seaCount)*100).toFixed(1) + '% 海洋: ' + (seaCount/(landCount+seaCount)*100).toFixed(1) + '%');
  // 检查定居点是否都在陆地
  let inSea = 0;
  world.settlements.forEach(s => { if (!world.isLand(s.x, s.y)) inSea++; });
  console.log('定居点位于海洋: ' + inSea + ' (应为 0)');
  // 不规则形状 - 陆地边界宽高比
  const lb = world.landBounds;
  const width = lb.maxX - lb.minX;
  const height = lb.maxY - lb.minY;
  console.log('陆地宽x高: ' + width + 'x' + height + ' (世界: ' + world.width + 'x' + world.height + ')');

  // ========== 测试玩家 ==========
  console.log('\\n=== 测试玩家 ===');
  const player = new Player(world);
  console.log('玩家位置: (' + Math.floor(player.x) + ', ' + Math.floor(player.y) + ')');
  console.log('玩家在陆地: ' + world.isLand(player.x, player.y));
  console.log('部队人数: ' + player.party.members.length);

  // ========== 测试存档 ==========
  console.log('\\n=== 测试存档系统 ===');
  // 设置 Game 属性
  Game.player = player;
  Game.world = world;
  Game.dayCount = 1;
  Game.gameTime = 0;
  Game.worldMap = null;
  Game.battleMap = null;
  Game.canvas = { width: 960, height: 600 };
  Game.ui = { currentSettlement: null };
  // 保存到3个槽位
  SaveSystem.saveToSlot(0, '快速存档');
  SaveSystem.saveToSlot(1, '游戏进度1');
  SaveSystem.saveToSlot(2, '自动存档');
  // 读取槽位1
  const loaded = SaveSystem.loadFromSlot(1);
  console.log('读取槽位1: ' + (loaded ? '成功' : '失败'));
  console.log('玩家等级: Lv' + Game.player.level + ' 金币: ' + Game.player.party.gold);
  // 自动存档
  SaveSystem.autoSave();
  const hasAuto = SaveSystem.hasAutoSave();
  console.log('自动存档: ' + (hasAuto ? '存在' : '不存在'));
  // 存档统计
  const meta = SaveSystem.getAllSaveMeta();
  const validSaves = meta.filter(s => !s.empty);
  console.log('有效存档: ' + validSaves.length);
  validSaves.forEach((s, i) => {
    console.log('  槽位' + s.slot + ': ' + s.label + ' - ' + s.playerName + ' Lv' + s.playerLevel + ' 💰' + s.gold + ' 第' + s.dayCount + '天');
  });
  // 删除测试
  SaveSystem.deleteSlot(1);
  console.log('删除槽位1后: ' + SaveSystem.getAllSaveMeta().filter(s => !s.empty).length + ' 个存档');

  // ========== 测试角色渲染 ==========
  console.log('\\n=== 测试角色渲染 ===');
  // 主角
  Utils.drawPixelCharacter(fakeCtx, 50, 50, 2, {
    isHero: true, weapon: 'sword', armorLevel: 4, helmetLevel: 3, shieldLevel: 2, boots: true
  });
  console.log('主角 (Lv+剑+板甲+盔+盾): OK');
  // 弓手
  Utils.drawPixelCharacter(fakeCtx, 50, 50, 1.5, {
    weapon: 'bow', armorLevel: 2, helmetLevel: 0
  });
  console.log('弓手 (弓+皮甲): OK');
  // 枪兵
  Utils.drawPixelCharacter(fakeCtx, 50, 50, 1.5, {
    weapon: 'spear', armorLevel: 3, shieldLevel: 1
  });
  console.log('枪兵 (矛+锁甲+盾): OK');
  // 战斧
  Utils.drawPixelCharacter(fakeCtx, 50, 50, 1.5, {
    weapon: 'axe', armorLevel: 4, helmetLevel: 4, shieldLevel: 0
  });
  console.log('战斧战士: OK');
  // 低级士兵（无装备）
  Utils.drawPixelCharacter(fakeCtx, 50, 50, 1.2, {
    weapon: 'sword', armorLevel: 1, helmetLevel: 0
  });
  console.log('低级士兵: OK');

  // ========== 测试任务系统 ==========
  console.log('\\n=== 测试任务系统 ===');
  const qs = world.questSystem;
  const sampleSettlement = world.settlements.find(s => s.type === 'town');
  if (sampleSettlement) {
    const q = qs.generateRandomQuest(sampleSettlement);
    console.log('生成任务: ' + q.title + ' - ' + q.desc);
    console.log('奖励: ' + q.rewardGold + '金币 / 时间: ' + q.timeLimit + '天');
    qs.acceptQuest(q);
    console.log('已接受任务, 当前活跃: ' + qs.activeQuests.length);
  }
`, ctx);

console.log('\n=== 全部测试完成 ===');
process.exit(0);
