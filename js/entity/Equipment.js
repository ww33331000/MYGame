// ================================
// 大陆风云 - 装备系统
// ================================

export class Equipment {
  constructor() {
    this.slots = {
      head: null,      // 头部
      body: null,      // 身体
      mainHand: null,  // 主手
      offHand: null,   // 副手
      feet: null,      // 脚部
      mount: null      // 坐骑
    };
    
    // 套装效果
    this.sets = {};
  }
  
  // 装备物品
  equip(item) {
    const slot = this.getEquipSlot(item);
    if (!slot) return false;
    
    const oldItem = this.slots[slot];
    this.slots[slot] = item;
    
    return oldItem; // 返回卸下的物品
  }
  
  // 卸下装备
  unequip(slot) {
    const item = this.slots[slot];
    this.slots[slot] = null;
    return item;
  }
  
  // 获取装备槽位
  getEquipSlot(item) {
    if (!item || !item.type) return null;
    
    switch (item.type) {
      case 'weapon':
        return 'mainHand';
      case 'armor':
        return item.subtype || 'body';
      case 'shield':
        return 'offHand';
      case 'helmet':
        return 'head';
      case 'boots':
        return 'feet';
      case 'mount':
        return 'mount';
      default:
        return null;
    }
  }
  
  // 获取总属性加成
  getTotalStats() {
    const stats = {
      damage: 0,
      defense: 0,
      speed: 0,
      hp: 0,
      stamina: 0,
      strength: 0,
      agility: 0,
      vitality: 0
    };
    
    for (const slot in this.slots) {
      const item = this.slots[slot];
      if (item) {
        if (item.damage) stats.damage += item.damage;
        if (item.defense) stats.defense += item.defense;
        if (item.speed) stats.speed += item.speed;
        if (item.hp) stats.hp += item.hp;
        if (item.stamina) stats.stamina += item.stamina;
        if (item.strength) stats.strength += item.strength;
        if (item.agility) stats.agility += item.agility;
        if (item.vitality) stats.vitality += item.vitality;
      }
    }
    
    return stats;
  }
  
  // 检查套装
  checkSets() {
    const setCount = {};
    
    for (const slot in this.slots) {
      const item = this.slots[slot];
      if (item && item.set) {
        setCount[item.set] = (setCount[item.set] || 0) + 1;
      }
    }
    
    return setCount;
  }
  
  // 获取套装加成
  getSetBonus(setName) {
    const setItems = [];
    for (const slot in this.slots) {
      const item = this.slots[slot];
      if (item && item.set === setName) {
        setItems.push(item);
      }
    }
    
    return {
      count: setItems.length,
      items: setItems,
      // 2件套效果, 3件套效果等可以在这里定义
      bonuses: this.getSetBonuses(setName, setItems.length)
    };
  }
  
  // 获取套装效果
  getSetBonuses(setName, count) {
    const bonuses = [];
    
    // 可以根据不同套装定义不同效果
    if (count >= 2) {
      bonuses.push({ name: '2件套', effect: '防御+5%' });
    }
    if (count >= 3) {
      bonuses.push({ name: '3件套', effect: '攻击+10%' });
    }
    if (count >= 4) {
      bonuses.push({ name: '4件套', effect: '生命恢复+20%' });
    }
    
    return bonuses;
  }
  
  // 获取装备详情
  getEquipmentDetails() {
    const details = [];
    
    for (const slot in this.slots) {
      const item = this.slots[slot];
      details.push({
        slot: slot,
        item: item,
        isEmpty: !item
      });
    }
    
    return details;
  }
  
  // 检查是否有特定装备类型
  hasItemOfType(type) {
    for (const slot in this.slots) {
      const item = this.slots[slot];
      if (item && item.type === type) {
        return true;
      }
    }
    return false;
  }
  
  // 获取武器伤害
  getWeaponDamage() {
    const weapon = this.slots.mainHand;
    if (!weapon) return 0;
    
    let damage = weapon.damage || 0;
    
    // 计算速度惩罚/加成
    if (weapon.speed) {
      // 速度越快, 伤害越低 (简单模型)
      // damage *= (1 + weapon.speed * 0.01);
    }
    
    return Math.floor(damage);
  }
  
  // 获取护甲防御
  getArmorDefense() {
    let total = 0;
    
    for (const slot in this.slots) {
      if (slot === 'mainHand') continue; // 跳过武器
      const item = this.slots[slot];
      if (item && item.defense) {
        total += item.defense;
      }
    }
    
    return total;
  }
  
  // 武器是否可用
  isWeaponEquipped() {
    return this.slots.mainHand !== null;
  }
  
  // 获取坐骑加成
  getMountBonus() {
    const mount = this.slots.mount;
    if (!mount) {
      return { speed: 0, combat: 0 };
    }
    
    return {
      speed: mount.speedBonus || 0,
      combat: mount.combatBonus || 0
    };
  }
  
  // 序列化
  serialize() {
    return {
      slots: this.slots
    };
  }
  
  // 反序列化
  static deserialize(data) {
    const eq = new Equipment();
    if (data && data.slots) {
      eq.slots = data.slots;
    }
    return eq;
  }
}
