// ============ 定居点（城镇/城堡/村庄） ============
class Settlement {
  constructor(id, name, type, x, y, factionId) {
    this.id = id;
    this.name = name;
    this.type = type;            // 'town' | 'castle' | 'village'
    this.x = x;
    this.y = y;
    this.factionId = factionId;
    this.parentId = null;        // 上级定居点（村庄->城镇->城堡）
    this.children = [];          // 下属定居点
    this.population = this.type === 'town' ? 5000 : (this.type === 'castle' ? 800 : 300);
    this.defense = this.type === 'town' ? 30 : (this.type === 'castle' ? 80 : 10);
    this.morale = 70;
    this.prosperity = 50;        // 繁荣度
    this.garrison = [];          // 驻军
    this.isSiege = false;
    this.siegeProgress = 0;
    this.questsAvailable = [];
    this.lordName = Utils.chineseName();
    // 商品价格浮动
    this.priceMod = {};
    this.generatePrices();
    // 可招募单位
    this.generateRecruits();
  }

  generatePrices() {
    // 每种交易品有随机价格浮动
    for (const g of EquipmentTemplates.tradeGoods) {
      this.priceMod[g.id] = 0.7 + Math.random() * 0.8;
    }
  }

  generateRecruits() {
    const types = Object.keys(UnitTypes).filter(k => !UnitTypes[k].hostile && UnitTypes[k].level <= (this.type === 'town' ? 5 : this.type === 'castle' ? 6 : 3));
    const count = this.type === 'town' ? 3 : (this.type === 'castle' ? 5 : 1);
    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      this.garrison.push({ type: t, available: Utils.randInt(2, 8), price: UnitTypes[t].price });
    }
  }

  // 购买商品
  getBuyPrice(itemId) {
    const tmpl = this.findItemTemplate(itemId);
    if (!tmpl) return 0;
    const mod = this.priceMod[itemId] || 1.0;
    return Math.ceil(tmpl.price * mod);
  }

  getSellPrice(itemId) {
    return Math.floor(this.getBuyPrice(itemId) * 0.75);
  }

  findItemTemplate(itemId) {
    for (const cat in EquipmentTemplates) {
      const t = EquipmentTemplates[cat].find(i => i.id === itemId);
      if (t) return t;
    }
    return null;
  }

  getIconType() { return this.type; }

  // 每日刷新
  onNewDay() {
    // 价格变化
    for (const g in this.priceMod) {
      this.priceMod[g] = Utils.clamp(this.priceMod[g] + (Math.random() - 0.5) * 0.1, 0.6, 1.6);
    }
    // 招募补充
    this.garrison.forEach(g => {
      if (g.available < 10) g.available += Utils.randInt(0, 2);
    });
    // 刷新任务
    if (Math.random() < 0.3) this.generateNewQuest();
  }

  generateNewQuest() {
    // 在任务系统中实现
    if (this.questsAvailable.length < 3 && Game.world && Game.world.questSystem) {
      const q = Game.world.questSystem.generateRandomQuest(this);
      if (q) this.questsAvailable.push(q);
    }
  }

  // 被攻击后减少驻军
  takeCasualties(amount) {
    this.defense = Math.max(5, this.defense - amount * 0.1);
    this.morale = Math.max(0, this.morale - amount);
  }

  changeOwner(newFactionId) {
    this.factionId = newFactionId;
    this.morale = Math.max(40, this.morale);
    this.generateRecruits();
  }
}
