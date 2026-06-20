// ================================
// 大陆风云 - 城堡
// ================================

import { Location } from './Location.js';

export class Castle extends Location {
  constructor(config) {
    super(config);
    this.type = 'castle';
    
    // 城堡特性
    this.population = config.population || 1000;
    this.defense = config.defense || 100; // 防御值
    this.garrison = config.garrison || 150; // 驻军
    
    // 归属
    this.owner = config.owner || null; // 势力ID
    this.lord = config.lord || null; // 领主的城镇ID
    
    // 设施等级
    this.wallLevel = config.wallLevel || 1; // 城墙等级 1-5
    this.towerLevel = config.towerLevel || 1; // 塔楼等级
    this.barracksLevel = config.barracksLevel || 1; // 兵营等级
  }
  
  // 获取防御加成
  getDefenseBonus() {
    return this.defense + (this.wallLevel * 20) + (this.towerLevel * 15);
  }
  
  // 获取驻军容量
  getGarrisonCapacity() {
    return 100 + (this.barracksLevel * 50) + (this.wallLevel * 30);
  }
  
  // 增加驻军
  addGarrison(count) {
    const capacity = this.getGarrisonCapacity();
    const currentGarrison = this.getCurrentGarrisonCount();
    
    const canAdd = Math.min(count, capacity - currentGarrison);
    this.garrison = currentGarrison + canAdd;
    
    return canAdd;
  }
  
  // 获取当前驻军数量
  getCurrentGarrisonCount() {
    return this.troops.reduce((sum, t) => sum + t.count, 0);
  }
  
  // 计算每日维护费
  calculateUpkeep() {
    const baseUpkeep = this.garrison * 0.5;
    const wallUpkeep = this.wallLevel * 20;
    const towerUpkeep = this.towerLevel * 15;
    const barracksUpkeep = this.barracksLevel * 10;
    
    return Math.floor(baseUpkeep + wallUpkeep + towerUpkeep + barracksUpkeep);
  }
  
  // 检查是否可以升级
  canUpgrade(type) {
    switch (type) {
      case 'wall':
        return this.wallLevel < 5;
      case 'tower':
        return this.towerLevel < 5;
      case 'barracks':
        return this.barracksLevel < 5;
      default:
        return false;
    }
  }
  
  // 获取升级费用
  getUpgradeCost(type) {
    const level = this[`${type}Level`] || 0;
    return Math.floor(500 * Math.pow(1.5, level));
  }
  
  // 升级
  upgrade(type) {
    if (!this.canUpgrade(type)) return false;
    
    const cost = this.getUpgradeCost(type);
    this[`${type}Level`]++;
    
    return true;
  }
  
  // 获取可用招募
  getAvailableRecruits() {
    const recruits = [
      { type: 'footman', name: '步兵', cost: 80, strength: 12 },
      { type: 'crossbowman', name: '弩兵', cost: 100, strength: 10 }
    ];
    
    if (this.wallLevel >= 2) {
      recruits.push({ type: 'castle_guard', name: '城堡卫兵', cost: 150, strength: 18 });
    }
    
    if (this.barracksLevel >= 3) {
      recruits.push({ type: 'knight', name: '骑士', cost: 300, strength: 25 });
    }
    
    return recruits;
  }
}
