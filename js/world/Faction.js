// ================================
// 大陆风云 - 势力
// ================================

export class Faction {
  constructor(config) {
    this.id = config.id || '';
    this.name = config.name || '未知势力';
    this.color = config.color || '#888888';
    this.trait = config.trait || '平衡'; // 势力特性
    
    // 势力关系 (与其他势力的好感度)
    this.relations = {};
    
    // 领土
    this.towns = [];
    this.castles = [];
    this.villages = [];
    
    // 资源
    this.treasury = config.treasury || 10000; // 国库
    this.manpower = config.manpower || 1000; // 人力资源
    
    // 势力状态
    this.isAlive = true;
    this.king = config.king || null; // 统治者
  }
  
  // 设置与其他势力的关系
  setRelation(factionId, value) {
    this.relations[factionId] = Math.max(-100, Math.min(100, value));
  }
  
  // 改变与其他势力的关系
  changeRelation(factionId, delta) {
    const current = this.relations[factionId] || 0;
    this.setRelation(factionId, current + delta);
  }
  
  // 获取与其他势力的关系
  getRelation(factionId) {
    return this.relations[factionId] || 0;
  }
  
  // 判断是否为盟友
  isAlly(factionId) {
    return this.getRelation(factionId) >= 50;
  }
  
  // 判断是否为敌对
  isEnemy(factionId) {
    return this.getRelation(factionId) <= -50;
  }
  
  // 添加城镇
  addTown(townId) {
    if (!this.towns.includes(townId)) {
      this.towns.push(townId);
    }
  }
  
  // 移除城镇
  removeTown(townId) {
    this.towns = this.towns.filter(id => id !== townId);
  }
  
  // 添加城堡
  addCastle(castleId) {
    if (!this.castles.includes(castleId)) {
      this.castles.push(castleId);
    }
  }
  
  // 移除城堡
  removeCastle(castleId) {
    this.castles = this.castles.filter(id => id !== castleId);
  }
  
  // 添加村庄
  addVillage(villageId) {
    if (!this.villages.includes(villageId)) {
      this.villages.push(villageId);
    }
  }
  
  // 移除村庄
  removeVillage(villageId) {
    this.villages = this.villages.filter(id => id !== villageId);
  }
  
  // 计算势力总人口
  getTotalPopulation() {
    return this.towns.length * 5000 + this.castles.length * 1000 + this.villages.length * 200;
  }
  
  // 计算总驻军
  getTotalGarrison() {
    return this.castles.length * 100 + this.towns.length * 200;
  }
  
  // 计算每日收入
  calculateDailyIncome() {
    // 基础税收
    const townIncome = this.towns.length * 100;
    const villageIncome = this.villages.length * 20;
    
    // 减去维护费
    const upkeep = this.castles.length * 50 + this.towns.length * 30;
    
    return townIncome + villageIncome - upkeep;
  }
  
  // 宣战
  declareWar(factionId) {
    this.setRelation(factionId, -100);
  }
  
  // 缔结盟约
  formAlliance(factionId) {
    this.setRelation(factionId, 100);
  }
  
  // 签订和平条约
  signPeace(factionId) {
    this.setRelation(factionId, 0);
  }
  
  // 检查是否灭亡
  checkElimination() {
    if (this.towns.length === 0 && this.castles.length === 0) {
      this.isAlive = false;
    }
  }
  
  // 获取势力报告
  getReport() {
    return {
      name: this.name,
      territories: {
        towns: this.towns.length,
        castles: this.castles.length,
        villages: this.villages.length
      },
      population: this.getTotalPopulation(),
      treasury: this.treasury,
      manpower: this.manpower,
      income: this.calculateDailyIncome(),
      status: this.isAlive ? '活跃' : '已灭亡'
    };
  }
}
