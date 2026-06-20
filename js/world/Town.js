// ================================
// 大陆风云 - 城镇
// ================================

import { Location } from './Location.js';

export class Town extends Location {
  constructor(config) {
    super(config);
    this.type = 'town';
    
    // 城镇特性
    this.population = config.population || 5000;
    this.prosperity = config.prosperity || 50; // 0-100
    this.loyalty = config.loyalty || 50; // 0-100 对统治者的忠诚度
    this.garrison = config.garrison || 200; // 驻军数量
    
    // 经济
    this.owner = config.owner || null; // 势力ID
    this.markets = config.markets || ['铁剑', '皮甲', '粮食'];
    
    // 物价指数
    this.priceModifier = {
      food: 1.0,
      weapons: 1.0,
      armor: 1.0,
      luxury: 1.0
    };
    
    // 驻军
    this.troops = [];
  }
  
  // 获取税收
  getTaxRate() {
    return 0.1 + (this.prosperity / 100) * 0.1;
  }
  
  // 计算每日税收
  calculateDailyTax() {
    const baseTax = this.population * 0.01;
    const prosperityBonus = (this.prosperity / 100) * baseTax;
    return Math.floor(baseTax + prosperityBonus);
  }
  
  // 获取贸易利润潜力
  getTradePotential() {
    return Math.floor(this.population * 0.1 * (this.prosperity / 100));
  }
  
  // 检查防御强度
  getDefenseStrength() {
    return this.garrison + Math.floor(this.loyalty * 2);
  }
  
  // 改变忠诚度
  changeLoyalty(delta) {
    this.loyalty = Math.max(0, Math.min(100, this.loyalty + delta));
  }
  
  // 改变繁荣度
  changeProsperity(delta) {
    this.prosperity = Math.max(0, Math.min(100, this.prosperity + delta));
  }
  
  // 获取可用兵种
  getAvailableRecruits() {
    return [
      { type: 'militia', name: '民兵', cost: 50, strength: 5 },
      { type: 'infantry', name: '步兵', cost: 100, strength: 10 },
      { type: 'archer', name: '弓兵', cost: 120, strength: 8 },
      { type: 'cavalry', name: '骑兵', cost: 200, strength: 15 }
    ];
  }
  
  // 获取商品价格
  getItemPrice(itemType) {
    const basePrices = {
      food: 10,
      weapons: 200,
      armor: 300,
      luxury: 500
    };
    
    const basePrice = basePrices[itemType] || 100;
    const modifier = this.priceModifier[itemType] || 1;
    const prosperityModifier = 1 + (50 - this.prosperity) / 100;
    
    return Math.floor(basePrice * modifier * prosperityModifier);
  }
}
