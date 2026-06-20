// ================================
// 大陆风云 - 背包系统
// ================================

export class Inventory {
  constructor(maxSlots = 20) {
    this.maxSlots = maxSlots;
    this.slots = []; // 物品数组
    this.gold = 0;
  }
  
  // 添加物品
  addItem(item) {
    if (this.slots.length >= this.maxSlots) {
      return false; // 背包已满
    }
    
    this.slots.push({
      ...item,
      uid: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    });
    
    return true;
  }
  
  // 移除物品
  removeItem(uid) {
    const index = this.slots.findIndex(item => item.uid === uid);
    if (index !== -1) {
      this.slots.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // 获取物品
  getItem(uid) {
    return this.slots.find(item => item.uid === uid);
  }
  
  // 查找物品
  findItemById(itemId) {
    return this.slots.find(item => item.id === itemId);
  }
  
  // 检查是否有空位
  hasSpace() {
    return this.slots.length < this.maxSlots;
  }
  
  // 获取空位数
  getFreeSlots() {
    return this.maxSlots - this.slots.length;
  }
  
  // 使用物品
  useItem(uid) {
    const item = this.getItem(uid);
    if (!item) return false;
    
    if (item.type === 'consumable') {
      this.removeItem(uid);
      return true;
    }
    
    return false;
  }
  
  // 整理背包
  organize() {
    // 按类型排序
    const typeOrder = {
      'weapon': 0,
      'armor': 1,
      'consumable': 2,
      'material': 3,
      'misc': 4
    };
    
    this.slots.sort((a, b) => {
      const orderA = typeOrder[a.type] ?? 5;
      const orderB = typeOrder[b.type] ?? 5;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.name.localeCompare(b.name);
    });
  }
  
  // 获取背包总重量
  getTotalWeight() {
    return this.slots.reduce((sum, item) => sum + (item.weight || 0), 0);
  }
  
  // 获取物品总价
  getTotalValue() {
    return this.slots.reduce((sum, item) => sum + (item.price || 0), 0);
  }
  
  // 出售物品
  sellItem(uid, price) {
    if (this.removeItem(uid)) {
      this.gold += price;
      return true;
    }
    return false;
  }
  
  // 购买物品
  buyItem(item, price) {
    if (this.gold >= price && this.hasSpace()) {
      this.gold -= price;
      return this.addItem(item);
    }
    return false;
  }
  
  // 获取指定类型的所有物品
  getItemsByType(type) {
    return this.slots.filter(item => item.type === type);
  }
  
  // 获取指定品质的所有物品
  getItemsByQuality(quality) {
    return this.slots.filter(item => item.quality === quality);
  }
  
  // 清空背包
  clear() {
    this.slots = [];
  }
  
  // 序列化
  serialize() {
    return {
      slots: this.slots,
      gold: this.gold,
      maxSlots: this.maxSlots
    };
  }
  
  // 反序列化
  static deserialize(data) {
    const inv = new Inventory(data.maxSlots || 20);
    inv.slots = data.slots || [];
    inv.gold = data.gold || 0;
    return inv;
  }
}
