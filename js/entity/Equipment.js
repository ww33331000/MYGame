// ============ 装备系统 ============
const ItemType = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELMET: 'helmet',
  SHIELD: 'shield',
  CONSUMABLE: 'consumable',
  TRADE_GOOD: 'trade_good',
  MATERIAL: 'material'
};

const WeaponType = {
  SWORD: 'sword',
  BOW: 'bow',
  SPEAR: 'spear',
  AXE: 'axe',
  DAGGER: 'dagger'
};

// 装备模板库
const EquipmentTemplates = {
  weapons: [
    { id: 'wooden_stick', name: '木棍', type: ItemType.WEAPON, weaponType: WeaponType.SWORD, damage: 3, speed: 1.2, price: 20, level: 1, desc: '简陋的木棍' },
    { id: 'iron_sword', name: '铁剑', type: ItemType.WEAPON, weaponType: WeaponType.SWORD, damage: 8, speed: 1.0, price: 80, level: 2, desc: '标准配置的铁剑' },
    { id: 'steel_sword', name: '钢剑', type: ItemType.WEAPON, weaponType: WeaponType.SWORD, damage: 14, speed: 1.0, price: 200, level: 3, desc: '锋利的钢制长剑' },
    { id: 'fine_sword', name: '精钢剑', type: ItemType.WEAPON, weaponType: WeaponType.SWORD, damage: 22, speed: 1.1, price: 500, level: 4, desc: '精心锻造的精钢剑' },
    { id: 'legendary_blade', name: '传说之刃', type: ItemType.WEAPON, weaponType: WeaponType.SWORD, damage: 35, speed: 1.2, price: 2000, level: 5, desc: '传闻中的神兵利器' },
    { id: 'short_bow', name: '短弓', type: ItemType.WEAPON, weaponType: WeaponType.BOW, damage: 6, speed: 1.3, price: 60, level: 1, desc: '轻便的短弓' },
    { id: 'hunter_bow', name: '猎弓', type: ItemType.WEAPON, weaponType: WeaponType.BOW, damage: 11, speed: 1.1, price: 150, level: 2, desc: '猎人常用的弓' },
    { id: 'long_bow', name: '长弓', type: ItemType.WEAPON, weaponType: WeaponType.BOW, damage: 18, speed: 0.9, price: 350, level: 3, desc: '射程远威力大的长弓' },
    { id: 'spear', name: '长枪', type: ItemType.WEAPON, weaponType: WeaponType.SPEAR, damage: 10, speed: 1.0, price: 90, level: 2, desc: '标准长枪' },
    { id: 'heavy_spear', name: '重型长矛', type: ItemType.WEAPON, weaponType: WeaponType.SPEAR, damage: 16, speed: 0.8, price: 250, level: 3, desc: '沉重的长矛' },
    { id: 'battle_axe', name: '战斧', type: ItemType.WEAPON, weaponType: WeaponType.AXE, damage: 15, speed: 0.8, price: 180, level: 3, desc: '沉重的战斧' },
    { id: 'dagger', name: '匕首', type: ItemType.WEAPON, weaponType: WeaponType.DAGGER, damage: 5, speed: 1.8, price: 50, level: 1, desc: '锋利的小匕首' }
  ],
  armors: [
    { id: 'cloth_armor', name: '布甲', type: ItemType.ARMOR, defense: 2, price: 30, level: 1, desc: '简单的布制护甲' },
    { id: 'leather_armor', name: '皮甲', type: ItemType.ARMOR, defense: 5, price: 80, level: 2, desc: '坚固的皮革护甲' },
    { id: 'chain_mail', name: '锁子甲', type: ItemType.ARMOR, defense: 10, price: 220, level: 3, desc: '环环相扣的锁甲' },
    { id: 'plate_armor', name: '板甲', type: ItemType.ARMOR, defense: 18, price: 500, level: 4, desc: '重型金属板甲' },
    { id: 'knight_armor', name: '骑士重甲', type: ItemType.ARMOR, defense: 28, price: 1500, level: 5, desc: '精工打造的骑士铠甲' }
  ],
  helmets: [
    { id: 'leather_cap', name: '皮帽', type: ItemType.HELMET, defense: 1, price: 20, level: 1, desc: '简单的皮革帽' },
    { id: 'iron_helmet', name: '铁盔', type: ItemType.HELMET, defense: 3, price: 70, level: 2, desc: '铁制头盔' },
    { id: 'closed_helmet', name: '封闭盔', type: ItemType.HELMET, defense: 6, price: 180, level: 3, desc: '全封闭头盔' },
    { id: 'great_helm', name: '巨盔', type: ItemType.HELMET, defense: 10, price: 400, level: 4, desc: '壮观的巨盔' }
  ],
  shields: [
    { id: 'wooden_shield', name: '木盾', type: ItemType.SHIELD, defense: 3, price: 35, level: 1, desc: '木质圆盾' },
    { id: 'iron_shield', name: '铁盾', type: ItemType.SHIELD, defense: 7, price: 120, level: 2, desc: '包铁的盾' },
    { id: 'tower_shield', name: '塔盾', type: ItemType.SHIELD, defense: 12, price: 280, level: 3, desc: '大型防御盾' },
    { id: 'knight_shield', name: '骑士盾', type: ItemType.SHIELD, defense: 18, price: 600, level: 4, desc: '精美的骑士盾' }
  ],
  consumables: [
    { id: 'bread', name: '面包', type: ItemType.CONSUMABLE, heal: 15, price: 8, desc: '朴素的面包' },
    { id: 'meat', name: '烤肉', type: ItemType.CONSUMABLE, heal: 35, price: 20, desc: '美味的烤肉' },
    { id: 'wine', name: '烈酒', type: ItemType.CONSUMABLE, heal: 25, morale: 5, price: 15, desc: '提神的烈酒' },
    { id: 'herb', name: '草药', type: ItemType.CONSUMABLE, heal: 50, price: 40, desc: '治疗用的草药' },
    { id: 'potion', name: '治疗药水', type: ItemType.CONSUMABLE, heal: 100, price: 100, desc: '神奇的治疗药水' }
  ],
  tradeGoods: [
    { id: 'cloth', name: '布匹', type: ItemType.TRADE_GOOD, price: 25, desc: '可交易的布匹' },
    { id: 'grain', name: '谷物', type: ItemType.TRADE_GOOD, price: 15, desc: '食用谷物' },
    { id: 'salt', name: '食盐', type: ItemType.TRADE_GOOD, price: 30, desc: '调味用的盐' },
    { id: 'spice', name: '香料', type: ItemType.TRADE_GOOD, price: 80, desc: '珍贵的香料' },
    { id: 'fur', name: '毛皮', type: ItemType.TRADE_GOOD, price: 50, desc: '保暖的毛皮' },
    { id: 'iron_ore', name: '铁矿石', type: ItemType.TRADE_GOOD, price: 40, desc: '冶炼用铁矿石' },
    { id: 'silk', name: '丝绸', type: ItemType.TRADE_GOOD, price: 120, desc: '奢华的丝绸' },
    { id: 'wine_trade', name: '葡萄酒', type: ItemType.TRADE_GOOD, price: 60, desc: '佳酿葡萄酒' }
  ],
  materials: [
    { id: 'wood', name: '木材', type: ItemType.MATERIAL, price: 10, desc: '建造材料' },
    { id: 'iron_ingot', name: '铁锭', type: ItemType.MATERIAL, price: 50, desc: '打造材料' },
    { id: 'steel_ingot', name: '钢锭', type: ItemType.MATERIAL, price: 150, desc: '高级打造材料' },
    { id: 'leather', name: '皮革', type: ItemType.MATERIAL, price: 25, desc: '制革材料' },
    { id: 'gem', name: '宝石', type: ItemType.MATERIAL, price: 300, desc: '珍贵的宝石' }
  ]
};

// 创建物品实例
function createItem(templateId, quantity) {
  for (const key in EquipmentTemplates) {
    const tmpl = EquipmentTemplates[key].find(t => t.id === templateId);
    if (tmpl) {
      const item = Object.assign({}, tmpl);
      item.uid = Utils.uid();
      item.quantity = quantity || 1;
      return item;
    }
  }
  return null;
}

// 打造系统配方
const SmithingRecipes = [
  { result: 'iron_sword', materials: [{ id: 'iron_ingot', qty: 2 }, { id: 'wood', qty: 1 }], cost: 30, levelReq: 2 },
  { result: 'steel_sword', materials: [{ id: 'steel_ingot', qty: 2 }, { id: 'wood', qty: 1 }], cost: 80, levelReq: 3 },
  { result: 'fine_sword', materials: [{ id: 'steel_ingot', qty: 4 }, { id: 'gem', qty: 1 }], cost: 200, levelReq: 5 },
  { result: 'hunter_bow', materials: [{ id: 'wood', qty: 3 }, { id: 'leather', qty: 1 }], cost: 50, levelReq: 2 },
  { result: 'long_bow', materials: [{ id: 'wood', qty: 5 }, { id: 'leather', qty: 2 }], cost: 120, levelReq: 4 },
  { result: 'spear', materials: [{ id: 'iron_ingot', qty: 2 }, { id: 'wood', qty: 2 }], cost: 40, levelReq: 2 },
  { result: 'heavy_spear', materials: [{ id: 'steel_ingot', qty: 2 }, { id: 'wood', qty: 3 }], cost: 100, levelReq: 3 },
  { result: 'battle_axe', materials: [{ id: 'iron_ingot', qty: 3 }, { id: 'wood', qty: 1 }], cost: 80, levelReq: 3 },
  { result: 'leather_armor', materials: [{ id: 'leather', qty: 4 }], cost: 40, levelReq: 2 },
  { result: 'chain_mail', materials: [{ id: 'iron_ingot', qty: 4 }, { id: 'leather', qty: 2 }], cost: 120, levelReq: 3 },
  { result: 'plate_armor', materials: [{ id: 'steel_ingot', qty: 4 }, { id: 'leather', qty: 2 }], cost: 280, levelReq: 4 },
  { result: 'knight_armor', materials: [{ id: 'steel_ingot', qty: 8 }, { id: 'gem', qty: 1 }, { id: 'leather', qty: 3 }], cost: 800, levelReq: 6 },
  { result: 'iron_helmet', materials: [{ id: 'iron_ingot', qty: 1 }], cost: 30, levelReq: 2 },
  { result: 'closed_helmet', materials: [{ id: 'iron_ingot', qty: 2 }], cost: 80, levelReq: 3 },
  { result: 'great_helm', materials: [{ id: 'steel_ingot', qty: 3 }], cost: 180, levelReq: 4 },
  { result: 'iron_shield', materials: [{ id: 'iron_ingot', qty: 2 }, { id: 'wood', qty: 2 }], cost: 50, levelReq: 2 },
  { result: 'tower_shield', materials: [{ id: 'iron_ingot', qty: 4 }, { id: 'wood', qty: 3 }], cost: 120, levelReq: 3 },
  { result: 'knight_shield', materials: [{ id: 'steel_ingot', qty: 3 }, { id: 'leather', qty: 1 }, { id: 'gem', qty: 1 }], cost: 280, levelReq: 4 }
];
