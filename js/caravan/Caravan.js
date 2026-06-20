// ================================
// 大陆风云 - 商队系统
// ================================

export class Caravan {
  constructor(config) {
    this.id = config.id || `caravan_${Date.now()}`;
    this.name = config.name || '商队';
    
    // 位置
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.destination = null; // 目的地
    this.origin = null; // 出发地
    
    // 货物
    this.goods = []; // { type, quantity, unitPrice }
    this.goodsValue = 0;
    this.capacity = config.capacity || 100; // 载货量
    
    // 护卫
    this.guards = config.guards || [];
    this.guardStrength = 0; // 战斗力
    
    // 状态
    this.state = 'idle'; // idle, traveling, trading, ambushed
    this.progress = 0; // 旅行进度 0-100
    this.estimatedArrival = 0; // 预计到达时间
    
    // 风险
    this.riskLevel = config.riskLevel || 0.2; // 遇到强盗概率
    
    // 收益
    this.potentialProfit = 0;
  }
  
  // 添加货物
  addGoods(type, quantity, unitPrice) {
    if (this.getCurrentLoad() + quantity > this.capacity) {
      return false; // 超出容量
    }
    
    const existing = this.goods.find(g => g.type === type);
    if (existing) {
      existing.quantity += quantity;
      existing.unitPrice = (existing.unitPrice + unitPrice) / 2; // 平均价格
    } else {
      this.goods.push({ type, quantity, unitPrice });
    }
    
    this.updateGoodsValue();
    return true;
  }
  
  // 移除货物
  removeGoods(type, quantity) {
    const index = this.goods.findIndex(g => g.type === type);
    if (index === -1) return false;
    
    const goods = this.goods[index];
    if (goods.quantity < quantity) return false;
    
    goods.quantity -= quantity;
    if (goods.quantity <= 0) {
      this.goods.splice(index, 1);
    }
    
    this.updateGoodsValue();
    return true;
  }
  
  // 获取当前载货量
  getCurrentLoad() {
    return this.goods.reduce((sum, g) => sum + g.quantity, 0);
  }
  
  // 更新货物总价值
  updateGoodsValue() {
    this.goodsValue = this.goods.reduce((sum, g) => sum + g.quantity * g.unitPrice, 0);
  }
  
  // 开始旅程
  startJourney(destination, origin, daysToArrive) {
    this.destination = destination;
    this.origin = origin;
    this.state = 'traveling';
    this.progress = 0;
    this.estimatedArrival = daysToArrive;
  }
  
  // 更新旅程进度
  updateProgress(daysPassed) {
    if (this.state !== 'traveling') return;
    
    this.progress += (daysPassed / this.estimatedArrival) * 100;
    
    if (this.progress >= 100) {
      this.progress = 100;
      this.arrive();
    }
  }
  
  // 到达目的地
  arrive() {
    this.state = 'trading';
  }
  
  // 交易
  trade() {
    if (this.state !== 'trading') return;
    
    let totalProfit = 0;
    
    for (const goods of this.goods) {
      // 假设货物到达后价格变化
      const priceChange = 1 + (Math.random() - 0.3); // -30% 到 +70%
      const sellPrice = Math.floor(goods.unitPrice * priceChange);
      totalProfit += sellPrice * goods.quantity;
    }
    
    this.potentialProfit = totalProfit - this.goodsValue;
    return this.potentialProfit;
  }
  
  // 确认交易
  confirmTrade() {
    const profit = this.trade();
    this.goods = [];
    this.goodsValue = 0;
    this.potentialProfit = 0;
    this.state = 'idle';
    this.origin = this.destination;
    this.destination = null;
    return profit;
  }
  
  // 遇到袭击
  encounterAmbush(enemies) {
    this.state = 'ambushed';
    
    // 计算护卫实力
    const guardPower = this.calculateDefense();
    
    // 敌人实力
    const enemyPower = enemies.reduce((sum, e) => sum + (e.strength || 10), 0);
    
    // 战斗判定
    const successChance = guardPower / (guardPower + enemyPower);
    
    if (Math.random() < successChance) {
      // 成功击退
      return { success: true, losses: this.calculateLosses(0.1) };
    } else {
      // 失败,损失部分货物和护卫
      return { success: false, losses: this.calculateLosses(0.3) };
    }
  }
  
  // 计算防御力
  calculateDefense() {
    return this.guardStrength + this.guards.length * 10;
  }
  
  // 计算损失
  calculateLosses(lossRate) {
    const losses = {
      goodsLost: Math.floor(this.goodsValue * lossRate),
      guardsLost: Math.floor(this.guards.length * lossRate)
    };
    
    // 应用损失
    this.goodsValue -= losses.goodsLost;
    this.guards = this.guards.slice(0, Math.max(0, this.guards.length - losses.guardsLost));
    
    return losses;
  }
  
  // 添加护卫
  addGuard(guard) {
    this.guards.push(guard);
    this.guardStrength += guard.strength || 10;
  }
  
  // 移除护卫
  removeGuard(guardId) {
    const index = this.guards.findIndex(g => g.id === guardId);
    if (index !== -1) {
      const guard = this.guards.splice(index, 1)[0];
      this.guardStrength -= guard.strength || 10;
    }
  }
  
  // 获取商队状态
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      progress: Math.floor(this.progress),
      goodsValue: this.goodsValue,
      guardCount: this.guards.length,
      guardStrength: this.guardStrength,
      capacity: this.capacity,
      currentLoad: this.getCurrentLoad(),
      potentialProfit: this.potentialProfit
    };
  }
  
  // 序列化
  serialize() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      destination: this.destination,
      origin: this.origin,
      goods: this.goods,
      goodsValue: this.goodsValue,
      capacity: this.capacity,
      guards: this.guards,
      guardStrength: this.guardStrength,
      state: this.state,
      progress: this.progress,
      estimatedArrival: this.estimatedArrival,
      riskLevel: this.riskLevel
    };
  }
  
  // 反序列化
  static deserialize(data) {
    const caravan = new Caravan({
      id: data.id,
      name: data.name,
      x: data.x,
      y: data.y,
      capacity: data.capacity,
      riskLevel: data.riskLevel
    });
    
    caravan.destination = data.destination;
    caravan.origin = data.origin;
    caravan.goods = data.goods || [];
    caravan.goodsValue = data.goodsValue || 0;
    caravan.guards = data.guards || [];
    caravan.guardStrength = data.guardStrength || 0;
    caravan.state = data.state || 'idle';
    caravan.progress = data.progress || 0;
    caravan.estimatedArrival = data.estimatedArrival || 0;
    
    return caravan;
  }
}
