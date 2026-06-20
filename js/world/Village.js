// ================================
// 大陆风云 - 村庄
// ================================

import { Location } from './Location.js';

export class Village extends Location {
  constructor(config) {
    super(config);
    this.type = 'village';
    
    // 村庄特性
    this.population = config.population || 200;
    this.agriculture = config.agriculture || 50; // 农业产出 0-100
    this.prosperity = config.prosperity || 30; // 繁荣度
    
    // 归属
    this.owner = config.owner || null; // 势力ID
    this.parent = config.parent || null; // 隶属的城镇/城堡ID
    
    // 资源产出
    this.foodProduction = config.foodProduction || 10;
    this.materialProduction = config.materialProduction || 5;
    
    // 村庄设施
    this.hasMill = config.hasMill || false; // 磨坊
    this.hasBlacksmith = config.hasBlacksmith || false; // 铁匠铺
    this.hasMarket = config.hasMarket || false; // 市场
  }
  
  // 计算每日产出
  calculateDailyProduction() {
    const baseFood = this.population * 0.1;
    const agricultureBonus = (this.agriculture / 100) * baseFood;
    const millBonus = this.hasMill ? baseFood * 0.2 : 0;
    
    return {
      food: Math.floor(baseFood + agricultureBonus + millBonus),
      materials: Math.floor(this.materialProduction * (this.prosperity / 50))
    };
  }
  
  // 获取税收
  calculateTax() {
    const baseTax = this.population * 0.02;
    const prosperityBonus = (this.prosperity / 100) * baseTax;
    return Math.floor(baseTax + prosperityBonus);
  }
  
  // 获取招募信息
  getRecruitmentInfo() {
    if (this.hasBlacksmith) {
      return {
        available: true,
        types: ['militia', 'archer'],
        costModifier: 0.9 // 铁匠铺打折
      };
    }
    return {
      available: true,
      types: ['militia'],
      costModifier: 1.0
    };
  }
  
  // 获取可交易物品
  getTradeGoods() {
    const goods = [
      { type: 'food', name: '粮食', basePrice: 10, quantity: this.foodProduction }
    ];
    
    if (this.hasMarket) {
      goods.push({ type: 'materials', name: '材料', basePrice: 25, quantity: this.materialProduction });
    }
    
    return goods;
  }
  
  // 改变繁荣度
  changeProsperity(delta) {
    this.prosperity = Math.max(0, Math.min(100, this.prosperity + delta));
  }
  
  // 建设设施
  buildFacility(type) {
    switch (type) {
      case 'mill':
        if (!this.hasMill) {
          this.hasMill = true;
          this.foodProduction *= 1.2;
          return true;
        }
        break;
      case 'blacksmith':
        if (!this.hasBlacksmith) {
          this.hasBlacksmith = true;
          return true;
        }
        break;
      case 'market':
        if (!this.hasMarket) {
          this.hasMarket = true;
          this.prosperity += 10;
          return true;
        }
        break;
    }
    return false;
  }
  
  // 获取建设费用
  getBuildingCost(type) {
    const costs = {
      mill: 500,
      blacksmith: 800,
      market: 1000
    };
    return costs[type] || 0;
  }
  
  // 检查是否可以被攻击
  canBeAttacked() {
    return true; // 村庄可以被攻击
  }
  
  // 获取防御力量
  getDefenseForce() {
    return Math.floor(this.population * 0.05); // 5%的人口可以作为民兵
  }
}
