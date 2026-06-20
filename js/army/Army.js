// ================================
// 大陆风云 - 军团系统
// ================================

export class Army {
  constructor(config) {
    this.id = config.id || `army_${Date.now()}`;
    this.name = config.name || '军团';
    
    // 位置
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // 单位列表
    this.units = config.units || [];
    
    // 最大规模
    this.maxSize = config.maxSize || 50;
    
    // 指挥者
    this.leader = config.leader || null; // 单位ID
    
    // 状态
    this.state = 'idle'; // idle, marching, besieging, inBattle
    this.morale = 100; // 士气 0-100
    this.discipline = 80; // 纪律 0-100
    
    // 移动
    this.marchSpeed = 60; // 每日移动距离
    this.destination = null;
    this.daysToArrive = 0;
    
    // 阵营
    this.factionId = config.factionId || null;
    this.isPlayer = config.isPlayer || false;
  }
  
  // 添加单位
  addUnit(unit) {
    if (this.units.length >= this.maxSize) {
      return false;
    }
    
    this.units.push({
      id: unit.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: unit.name || '士兵',
      type: unit.type || 'infantry',
      level: unit.level || 1,
      hp: unit.hp || 50,
      maxHp: unit.maxHp || 50,
      damage: unit.damage || 10,
      defense: unit.defense || 5,
      speed: unit.speed || 80,
      exp: unit.exp || 0,
      // 兵种特有属性
      charge: unit.charge || 0,
      ranged: unit.ranged || false,
      isMounted: unit.isMounted || false
    });
    
    return true;
  }
  
  // 移除单位
  removeUnit(unitId) {
    const index = this.units.findIndex(u => u.id === unitId);
    if (index !== -1) {
      this.units.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // 获取单位
  getUnit(unitId) {
    return this.units.find(u => u.id === unitId);
  }
  
  // 获取单位数量
  getUnitCount() {
    return this.units.length;
  }
  
  // 按类型获取单位
  getUnitsByType(type) {
    return this.units.filter(u => u.type === type);
  }
  
  // 计算总战斗力
  calculateStrength() {
    let strength = 0;
    
    for (const unit of this.units) {
      // 基础战力
      let unitPower = unit.damage * 2 + unit.defense * 1.5 + unit.hp * 0.5;
      
      // 等级加成
      unitPower *= (1 + (unit.level - 1) * 0.1);
      
      // 士气加成
      unitPower *= (0.5 + this.morale / 200);
      
      // 纪律加成
      unitPower *= (0.8 + this.discipline / 500);
      
      // 骑兵冲锋加成
      if (unit.isMounted) {
        unitPower *= 1.3;
      }
      
      strength += unitPower;
    }
    
    return Math.floor(strength);
  }
  
  // 计算维持费用
  calculateUpkeep() {
    return this.units.reduce((sum, unit) => sum + 1, 0) * 0.5; // 每个单位0.5金/天
  }
  
  // 设置阵型
  setFormation(formation) {
    this.formation = formation;
  }
  
  // 行军
  march(destination, world) {
    this.destination = destination;
    this.state = 'marching';
    
    // 计算距离和所需时间
    const dist = Math.hypot(destination.x - this.x, destination.y - this.y);
    this.daysToArrive = Math.ceil(dist / this.marchSpeed);
  }
  
  // 更新行军进度
  updateMarch(daysPassed) {
    if (this.state !== 'marching') return;
    
    this.daysToArrive -= daysPassed;
    
    if (this.daysToArrive <= 0) {
      this.arrive();
    } else {
      // 移动位置
      const dx = this.destination.x - this.x;
      const dy = this.destination.y - this.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0) {
        const moveAmount = Math.min(this.marchSpeed * daysPassed, dist);
        this.x += (dx / dist) * moveAmount;
        this.y += (dy / dist) * moveAmount;
      }
    }
  }
  
  // 到达目的地
  arrive() {
    this.state = 'idle';
    this.x = this.destination.x;
    this.y = this.destination.y;
    this.destination = null;
    this.daysToArrive = 0;
  }
  
  // 改变士气
  changeMorale(delta) {
    this.morale = Math.max(0, Math.min(100, this.morale + delta));
    
    // 士气过低影响纪律
    if (this.morale < 30) {
      this.discipline = Math.max(0, this.discipline - 5);
    }
  }
  
  // 改变纪律
  changeDiscipline(delta) {
    this.discipline = Math.max(0, Math.min(100, this.discipline + delta));
  }
  
  // 治疗单位
  healUnit(unitId, amount) {
    const unit = this.getUnit(unitId);
    if (!unit) return;
    
    unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  }
  
  // 治疗所有单位
  healAll(amount) {
    for (const unit of this.units) {
      this.healUnit(unit.id, amount);
    }
  }
  
  // 恢复体力 (每天调用)
  dailyUpdate() {
    // 恢复少量HP
    for (const unit of this.units) {
      if (unit.hp < unit.maxHp) {
        unit.hp = Math.min(unit.maxHp, unit.hp + 5);
      }
    }
    
    // 士气自然恢复
    if (this.state === 'idle') {
      this.morale = Math.min(100, this.morale + 1);
    }
    
    // 纪律自然恢复
    if (this.discipline < 80) {
      this.discipline = Math.min(80, this.discipline + 0.5);
    }
  }
  
  // 解散军团
  disband() {
    // 返回所有单位到玩家背包/城镇
    const disbanded = [...this.units];
    this.units = [];
    return disbanded;
  }
  
  // 获取军团摘要
  getSummary() {
    const unitTypes = {};
    for (const unit of this.units) {
      unitTypes[unit.type] = (unitTypes[unit.type] || 0) + 1;
    }
    
    return {
      id: this.id,
      name: this.name,
      size: this.units.length,
      maxSize: this.maxSize,
      strength: this.calculateStrength(),
      morale: this.morale,
      discipline: this.discipline,
      state: this.state,
      position: { x: Math.floor(this.x), y: Math.floor(this.y) },
      unitTypes: unitTypes,
      upkeep: this.calculateUpkeep()
    };
  }
  
  // 获取兵种类别统计
  getUnitTypeBreakdown() {
    const breakdown = {
      infantry: 0,
      ranged: 0,
      cavalry: 0,
      special: 0
    };
    
    for (const unit of this.units) {
      if (unit.ranged) {
        breakdown.ranged++;
      } else if (unit.isMounted) {
        breakdown.cavalry++;
      } else if (unit.type === 'elite' || unit.type === 'knight') {
        breakdown.special++;
      } else {
        breakdown.infantry++;
      }
    }
    
    return breakdown;
  }
  
  // 序列化
  serialize() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      units: this.units,
      maxSize: this.maxSize,
      leader: this.leader,
      state: this.state,
      morale: this.morale,
      discipline: this.discipline,
      marchSpeed: this.marchSpeed,
      destination: this.destination,
      daysToArrive: this.daysToArrive,
      factionId: this.factionId,
      isPlayer: this.isPlayer
    };
  }
  
  // 反序列化
  static deserialize(data) {
    const army = new Army({
      id: data.id,
      name: data.name,
      x: data.x,
      y: data.y,
      maxSize: data.maxSize,
      leader: data.leader,
      factionId: data.factionId,
      isPlayer: data.isPlayer
    });
    
    army.units = data.units || [];
    army.state = data.state || 'idle';
    army.morale = data.morale || 100;
    army.discipline = data.discipline || 80;
    army.marchSpeed = data.marchSpeed || 60;
    army.destination = data.destination;
    army.daysToArrive = data.daysToArrive || 0;
    
    return army;
  }
}

// 预定义兵种
export const UNIT_TYPES = {
  // 初级
  militia: {
    name: '民兵',
    type: 'infantry',
    tier: 1,
    hp: 30,
    damage: 5,
    defense: 2,
    speed: 60,
    cost: 30,
    exp: 0
  },
  footman: {
    name: '步兵',
    type: 'infantry',
    tier: 2,
    hp: 50,
    damage: 10,
    defense: 8,
    speed: 70,
    cost: 60,
    exp: 100
  },
  archer: {
    name: '弓兵',
    type: 'ranged',
    tier: 2,
    hp: 35,
    damage: 8,
    defense: 3,
    speed: 65,
    ranged: true,
    cost: 70,
    exp: 100
  },
  scout: {
    name: '斥候',
    type: 'cavalry',
    tier: 2,
    hp: 40,
    damage: 7,
    defense: 4,
    speed: 100,
    isMounted: true,
    cost: 80,
    exp: 100
  },
  
  // 中级
  veteran_infantry: {
    name: '老兵步兵',
    type: 'infantry',
    tier: 3,
    hp: 70,
    damage: 15,
    defense: 12,
    speed: 75,
    cost: 120,
    exp: 300
  },
  crossbowman: {
    name: '弩兵',
    type: 'ranged',
    tier: 3,
    hp: 45,
    damage: 12,
    defense: 5,
    speed: 60,
    ranged: true,
    cost: 130,
    exp: 300
  },
  cavalry: {
    name: '轻骑兵',
    type: 'cavalry',
    tier: 3,
    hp: 55,
    damage: 14,
    defense: 8,
    speed: 110,
    isMounted: true,
    cost: 150,
    exp: 300
  },
  
  // 高级
  knight: {
    name: '骑士',
    type: 'cavalry',
    tier: 4,
    hp: 90,
    damage: 20,
    defense: 15,
    speed: 100,
    isMounted: true,
    charge: 30,
    cost: 250,
    exp: 600
  },
  man_at_arms: {
    name: '职业士兵',
    type: 'infantry',
    tier: 4,
    hp: 100,
    damage: 18,
    defense: 18,
    speed: 80,
    cost: 220,
    exp: 600
  },
  longbowman: {
    name: '长弓手',
    type: 'ranged',
    tier: 4,
    hp: 50,
    damage: 18,
    defense: 6,
    speed: 65,
    ranged: true,
    cost: 200,
    exp: 600
  },
  
  // 精英
  champion: {
    name: '冠军骑士',
    type: 'cavalry',
    tier: 5,
    hp: 130,
    damage: 28,
    defense: 20,
    speed: 95,
    isMounted: true,
    charge: 50,
    cost: 400,
    exp: 1000
  },
  elite_guard: {
    name: '精英卫兵',
    type: 'infantry',
    tier: 5,
    hp: 140,
    damage: 24,
    defense: 25,
    speed: 70,
    cost: 380,
    exp: 1000
  }
};
