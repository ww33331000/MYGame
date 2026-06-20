// ================================
// 大陆风云 - 世界生成器
// ================================

import { Faction } from './Faction.js';
import { Town } from './Town.js';
import { Castle } from './Castle.js';
import { Village } from './Village.js';

export class WorldGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.random = this.createRandom(seed);
    
    // 世界尺寸
    this.worldWidth = 8192;
    this.worldHeight = 8192;
    
    // 城镇数量
    this.townCount = 40;
    this.castleCount = 120;
    this.villageCount = 300;
    this.factionCount = 6;
  }
  
  createRandom(seed) {
    // 简单的伪随机数生成器
    let s = seed;
    return {
      random: () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      },
      range: (min, max) => min + this.random() * (max - min),
      int: (min, max) => Math.floor(min + this.random() * (max - min + 1)),
      pick: (arr) => arr[Math.floor(this.random() * arr.length)],
      shuffle: (arr) => {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      }
    };
  }
  
  // 生成完整世界
  generate() {
    return {
      towns: this.generateTowns(),
      castles: this.generateCastles(),
      villages: this.generateVillages(),
      roads: this.generateRoads(),
      factions: this.generateFactions(),
      day: 1,
      weather: 'clear'
    };
  }
  
  // 生成城镇
  generateTowns() {
    const towns = [];
    const gridCols = Math.ceil(Math.sqrt(this.townCount));
    const spacingX = (this.worldWidth - 800) / gridCols;
    const spacingY = (this.worldHeight - 800) / gridCols;
    
    const townNames = [
      '王城', '雄狮堡', '铁岭', '银月港', '翡翠城', '龙息镇', '风暴角', '烈焰城',
      '寒霜堡', '金穗城', '碧波港', '黑铁城', '紫罗兰堡', '晨曦镇', '夜莺城', '雷霆堡',
      '月光港', '红石城', '苍鹰堡', '烈火镇', '蓝月城', '白鲨港', '绿荫堡', '黄沙城',
      '灰岩镇', '紫电堡', '青风城', '橙日港', '赤焰堡', '蓝星城', '绿野镇', '紫晶港',
      '黑龙堡', '白虎城', '朱雀镇', '玄武港', '青龙堡', '麒麟城', '凤凰镇', '独角港'
    ];
    
    for (let i = 0; i < this.townCount; i++) {
      const gridX = i % gridCols;
      const gridY = Math.floor(i / gridCols);
      
      const x = 400 + gridX * spacingX + this.random.range(-150, 150);
      const y = 400 + gridY * spacingY + this.random.range(-150, 150);
      
      towns.push(new Town({
        id: `town_${i}`,
        name: townNames[i] || `城镇${i}`,
        x: Math.floor(x),
        y: Math.floor(y),
        population: this.random.int(2000, 15000),
        prosperity: this.random.int(30, 100),
        garrison: this.random.int(100, 800)
      }));
    }
    
    return towns;
  }
  
  // 生成城堡
  generateCastles() {
    const castles = [];
    const castleNames = [
      '鹰巢', '狼牙', '龙鳞', '狮心', '虎威', '熊霸', '鹿鸣', '狐智', '蛇毒', '蛛网',
      '蝠翼', '蚁穴', '蜂刺', '蝶舞', '龟壳', '鳞甲', '羽翼', '爪牙', '牙爪', '血旗',
      '黑刃', '白盾', '红旗', '蓝剑', '绿弓', '黄锤', '紫杖', '橙斧', '青矛', '红弓',
      '银甲', '金冠', '铁壁', '钢锋', '铜锣', '锡盾', '铅坠', '铂剑', '钻石', '宝石'
    ];
    
    for (let i = 0; i < this.castleCount; i++) {
      const x = this.random.int(200, this.worldWidth - 200);
      const y = this.random.int(200, this.worldHeight - 200);
      
      castles.push(new Castle({
        id: `castle_${i}`,
        name: `${castleNames[i % castleNames.length]}${Math.floor(i / castleNames.length) + 1}城堡`,
        x,
        y,
        population: this.random.int(500, 3000),
        defense: this.random.int(50, 150),
        garrison: this.random.int(50, 400)
      }));
    }
    
    return castles;
  }
  
  // 生成村庄
  generateVillages() {
    const villages = [];
    const villageNames = [
      '稻香', '麦浪', '玉米', '棉花', '果园', '菜园', '牧场', '猪庄', '牛栏', '羊圈',
      '渔村', '猎场', '伐木', '采矿', '铁匠', '陶坊', '织布', '酿酒', '榨油', '磨坊',
      '驿站', '客栈', '酒馆', '集市', '学校', '寺庙', '祠堂', '墓地', '废墟', '哨所'
    ];
    
    for (let i = 0; i < this.villageCount; i++) {
      const x = this.random.int(100, this.worldWidth - 100);
      const y = this.random.int(100, this.worldHeight - 100);
      
      villages.push(new Village({
        id: `village_${i}`,
        name: `${villageNames[i % villageNames.length]}${Math.floor(i / villageNames.length) + 1}村`,
        x,
        y,
        population: this.random.int(100, 500),
        agriculture: this.random.int(20, 80),
        prosperity: this.random.int(10, 60)
      }));
    }
    
    return villages;
  }
  
  // 生成道路网络
  generateRoads() {
    const roads = [];
    
    // 生成主要道路 - 连接城镇
    const towns = this.findAllTowns();
    const townConnections = this.findMinimumSpanningTree(towns);
    
    for (const conn of townConnections) {
      roads.push({
        x1: conn.from.x,
        y1: conn.from.y,
        x2: conn.to.x,
        y2: conn.to.y,
        type: 'main'
      });
    }
    
    // 添加一些次要道路 - 城镇到城堡
    for (const town of towns.slice(0, 20)) {
      const nearbyCastles = this.findNearby('castle', town, 800);
      if (nearbyCastles.length > 0) {
        const castle = this.random.pick(nearbyCastles);
        roads.push({
          x1: town.x,
          y1: town.y,
          x2: castle.x,
          y2: castle.y,
          type: 'secondary'
        });
      }
    }
    
    return roads;
  }
  
  // 查找所有城镇
  findAllTowns() {
    // 临时存储，用于路径生成
    return [];
  }
  
  // 查找附近地点
  findNearby(type, center, radius) {
    return [];
  }
  
  // 最小生成树算法
  findMinimumSpanningTree(nodes) {
    const connections = [];
    const connected = new Set();
    
    if (nodes.length === 0) return connections;
    
    // 从第一个节点开始
    let current = nodes[0];
    connected.add(current.id);
    
    while (connected.size < nodes.length) {
      let nearest = null;
      let nearestDist = Infinity;
      
      for (const node of nodes) {
        if (connected.has(node.id)) continue;
        
        const dist = Math.hypot(node.x - current.x, node.y - current.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = node;
        }
      }
      
      if (nearest) {
        connections.push({ from: current, to: nearest, distance: nearestDist });
        connected.add(nearest.id);
        current = nearest;
      }
    }
    
    return connections;
  }
  
  // 生成势力
  generateFactions() {
    const factions = [];
    const factionData = [
      { name: '北方王国', color: '#4488ff', trait: '骑兵' },
      { name: '南方联邦', color: '#ff4444', trait: '步兵' },
      { name: '东方帝国', color: '#ffcc00', trait: '弓兵' },
      { name: '西方联盟', color: '#44ff44', trait: '防守' },
      { name: '中部公国', color: '#ff44ff', trait: '平衡' },
      { name: '游牧部落', color: '#ff8800', trait: '灵活' }
    ];
    
    for (let i = 0; i < this.factionCount; i++) {
      factions.push(new Faction({
        id: `faction_${i}`,
        name: factionData[i].name,
        color: factionData[i].color,
        trait: factionData[i].trait
      }));
    }
    
    return factions;
  }
  
  // 分配势力领土
  assignTerritories(world) {
    const { towns, castles, villages, factions } = world;
    
    // 为每个城镇分配势力
    const shuffledTowns = this.random.shuffle(towns);
    factions.forEach((faction, i) => {
      const startIdx = Math.floor(i * towns.length / factions.length);
      const endIdx = Math.floor((i + 1) * towns.length / factions.length);
      
      for (let j = startIdx; j < endIdx; j++) {
        if (shuffledTowns[j]) {
          shuffledTowns[j].owner = faction.id;
        }
      }
    });
    
    // 城堡隶属最近的城镇
    for (const castle of castles) {
      let nearestTown = null;
      let nearestDist = Infinity;
      
      for (const town of towns) {
        const dist = Math.hypot(castle.x - town.x, castle.y - town.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTown = town;
        }
      }
      
      if (nearestTown) {
        castle.owner = nearestTown.owner;
        castle.lord = nearestTown.id;
      }
    }
    
    // 村庄隶属最近的城堡或城镇
    for (const village of villages) {
      let nearest = null;
      let nearestDist = Infinity;
      
      // 先找城镇
      for (const town of towns) {
        const dist = Math.hypot(village.x - town.x, village.y - town.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = town;
        }
      }
      
      if (nearest) {
        village.owner = nearest.owner;
        village.parent = nearest.id;
      }
    }
  }
  
  // 初始化世界关系
  initializeRelations(world) {
    const { factions } = world;
    
    // 初始化势力关系
    for (let i = 0; i < factions.length; i++) {
      for (let j = 0; j < factions.length; j++) {
        if (i === j) continue;
        
        // 随机初始关系
        const relation = this.random.int(-50, 50);
        factions[i].relations[factions[j].id] = relation;
      }
    }
  }
}
