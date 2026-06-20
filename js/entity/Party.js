// ============ 队伍（玩家的部队） ============
class Party {
  constructor() {
    this.members = [];     // 可战斗单位
    this.maxSize = 10;     // 初始最大成员数
    this.gold = 100;
    this.inventory = [];   // 物品 { item, quantity }
    this.wagonCapacity = 50;
    this.currentLoad = 0;
    this.morale = 80;
    this.weeklyWage = 0;
  }

  get totalCount() { return this.members.length; }
  get aliveCount() { return this.members.filter(m => !m.isDead).length; }
  get power() {
    let p = 0;
    this.members.forEach(m => { if (!m.isDead) p += m.baseDamage + m.baseDefense + m.maxHp / 10; });
    return Math.floor(p);
  }

  canAddMember() { return this.members.length < this.maxSize; }

  addMember(unit) {
    if (this.members.length >= this.maxSize) {
      toast('队伍已满！需要提升声望扩充队伍', '#f86868');
      return false;
    }
    this.members.push(unit);
    this.recalcWage();
    return true;
  }

  removeMember(index) {
    if (index >= 0 && index < this.members.length) {
      this.members.splice(index, 1);
      this.recalcWage();
      return true;
    }
    return false;
  }

  recalcWage() {
    this.weeklyWage = this.members.reduce((sum, m) => sum + Math.floor(m.level * 2), 0);
  }

  // 全员治疗
  healAll(amount) {
    this.members.forEach(m => {
      if (!m.isDead) m.heal(amount);
    });
  }

  // 全员复活（战斗后）
  reviveAll() {
    this.members.forEach(m => {
      m.isDead = false;
      m.hp = Math.max(m.maxHp * 0.3, m.hp);
      m.attackCooldown = 0;
    });
  }

  // 物品管理
  addItem(itemOrId, qty) {
    let item = itemOrId;
    if (typeof itemOrId === 'string') item = createItem(itemOrId, qty || 1);
    const existing = this.inventory.find(i => i.item.id === item.id && !['weapon','armor','helmet','shield'].includes(item.type));
    if (existing) {
      existing.quantity += (qty || item.quantity || 1);
    } else {
      this.inventory.push({ item: item, quantity: qty || item.quantity || 1 });
    }
    this.currentLoad = this.inventory.reduce((s, i) => s + i.quantity, 0);
  }

  removeItem(itemId, qty) {
    const idx = this.inventory.findIndex(i => i.item.id === itemId);
    if (idx < 0) return false;
    this.inventory[idx].quantity -= qty;
    if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1);
    this.currentLoad = this.inventory.reduce((s, i) => s + i.quantity, 0);
    return true;
  }

  getItemCount(itemId) {
    const entry = this.inventory.find(i => i.item.id === itemId);
    return entry ? entry.quantity : 0;
  }

  hasGold(amount) { return this.gold >= amount; }
  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }
  earnGold(amount) { this.gold += amount; }

  // 使用消耗品
  useConsumable(itemId) {
    const entry = this.inventory.find(i => i.item.id === itemId);
    if (!entry || entry.quantity <= 0) return false;
    const it = entry.item;
    if (it.type !== ItemType.CONSUMABLE) return false;
    if (it.heal) {
      if (Game.player && Game.player === this || this instanceof PlayerParty) {
        if (Game.player) {
          Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + it.heal);
        }
        this.healAll(it.heal / 2);
      }
    }
    entry.quantity--;
    if (entry.quantity <= 0) {
      const idx = this.inventory.indexOf(entry);
      this.inventory.splice(idx, 1);
    }
    this.currentLoad = this.inventory.reduce((s, i) => s + i.quantity, 0);
    return true;
  }
}

class PlayerParty extends Party {
  constructor() {
    super();
    this.maxSize = 15;
    this.wagonCapacity = 100;
  }
}
