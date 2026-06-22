// ============ 单位（战斗单位） ============
// 兵种模板
const UnitTypes = {
  peasant: { name: '农民', hp: 30, damage: 3, defense: 1, speed: 1.0, price: 0, weapon: 'dagger', level: 1 },
  recruit: { name: '新兵', hp: 50, damage: 5, defense: 2, speed: 1.0, price: 30, weapon: 'wooden_stick', level: 1 },
  militia: { name: '民兵', hp: 70, damage: 8, defense: 4, speed: 1.0, price: 60, weapon: 'iron_sword', level: 2 },
  swordsman: { name: '剑士', hp: 100, damage: 12, defense: 8, speed: 1.0, price: 120, weapon: 'iron_sword', level: 3 },
  veteran: { name: '老兵', hp: 130, damage: 16, defense: 12, speed: 1.0, price: 220, weapon: 'steel_sword', level: 4 },
  elite_swordsman: { name: '精锐剑士', hp: 160, damage: 20, defense: 16, speed: 1.1, price: 400, weapon: 'fine_sword', level: 5 },
  knight: { name: '骑士', hp: 200, damage: 24, defense: 20, speed: 1.2, price: 650, weapon: 'fine_sword', level: 6 },
  grand_knight: { name: '大骑士', hp: 260, damage: 30, defense: 25, speed: 1.2, price: 1200, weapon: 'legendary_blade', level: 7 },
  // 弓箭手
  archer: { name: '弓箭手', hp: 60, damage: 10, defense: 3, speed: 1.2, price: 80, weapon: 'short_bow', level: 2, ranged: true },
  hunter: { name: '猎人', hp: 80, damage: 14, defense: 4, speed: 1.2, price: 140, weapon: 'hunter_bow', level: 3, ranged: true },
  longbowman: { name: '长弓手', hp: 100, damage: 20, defense: 5, speed: 1.1, price: 280, weapon: 'long_bow', level: 4, ranged: true },
  elite_archer: { name: '精锐弓手', hp: 130, damage: 26, defense: 7, speed: 1.1, price: 500, weapon: 'long_bow', level: 5, ranged: true },
  // 枪兵
  spearman: { name: '枪兵', hp: 80, damage: 12, defense: 5, speed: 1.0, price: 90, weapon: 'spear', level: 2 },
  heavy_spearman: { name: '重装枪兵', hp: 120, damage: 18, defense: 10, speed: 0.9, price: 200, weapon: 'heavy_spear', level: 3 },
  pikeman: { name: '长矛兵', hp: 150, damage: 22, defense: 14, speed: 0.9, price: 380, weapon: 'heavy_spear', level: 4 },
  // 强盗/野怪
  bandit: { name: '强盗', hp: 60, damage: 10, defense: 3, speed: 1.1, price: 0, weapon: 'wooden_stick', level: 2, hostile: true },
  highway_robber: { name: '路霸', hp: 90, damage: 14, defense: 6, speed: 1.0, price: 0, weapon: 'iron_sword', level: 3, hostile: true },
  bandit_chief: { name: '强盗头目', hp: 150, damage: 20, defense: 10, speed: 1.0, price: 0, weapon: 'steel_sword', level: 4, hostile: true }
};

class Unit {
  constructor(typeId, factionId) {
    const tmpl = UnitTypes[typeId];
    this.typeId = typeId;
    this.name = tmpl.name;
    this.maxHp = tmpl.hp;
    this.hp = tmpl.hp;
    this.baseDamage = tmpl.damage;
    this.baseDefense = tmpl.defense;
    this.speed = tmpl.speed;
    this.weapon = tmpl.weapon;
    this.weaponType = tmpl.weaponType || (tmpl.ranged ? 'bow' : 'sword');
    this.level = tmpl.level;
    this.ranged = tmpl.ranged || false;
    this.hostile = tmpl.hostile || false;
    this.factionId = factionId || null;
    this.exp = 0;
    this.isPlayer = false;
    this.isDead = false;
    this.bodyColor = null;       // 自定义身体颜色
    // 战斗用
    this.x = 0;
    this.y = 0;
    this.target = null;
    this.attackCooldown = 0;
    this.facing = 1;
    // ===== 动作系统 v2 =====
    this.action = 'idle';         // idle / move / attack / defend / hit / die
    this.animPhase = Math.random(); // 0..1 相位（每个单位独立）
    this.animSpeed = 2.0;         // 每秒循环速度
    this.actionTimer = 0;         // 动作剩余时间（用于攻击/受伤）
    this.bobPhase = Math.random() * Math.PI * 2; // 呼吸感
    // 装备等级（用于视觉渲染）
    this.armorLevel = Math.min(5, Math.max(0, this.level - 1));
    this.helmetLevel = this.level >= 3 ? this.level - 2 : 0;
    this.shieldLevel = (this.level >= 3 && !this.ranged) ? this.level - 2 : 0;
    this.boots = this.level >= 2;
  }

  getTotalDamage() {
    let dmg = this.baseDamage;
    if (this.isPlayer && Game.player && Game.player.equipment.weapon) {
      dmg += Game.player.equipment.weapon.damage;
    }
    return dmg;
  }

  getTotalDefense() {
    let def = this.baseDefense;
    if (this.isPlayer && Game.player) {
      if (Game.player.equipment.armor) def += Game.player.equipment.armor.defense;
      if (Game.player.equipment.helmet) def += Game.player.equipment.helmet.defense;
      if (Game.player.equipment.shield) def += Game.player.equipment.shield.defense;
    }
    return def;
  }

  takeDamage(dmg) {
    const def = this.getTotalDefense();
    const actual = Math.max(1, dmg - def * 0.5);
    this.hp -= actual;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  gainExp(amount) {
    this.exp += amount;
    // 升级检测
    const needed = this.level * 100;
    if (this.exp >= needed) {
      this.exp -= needed;
      this.level++;
      this.maxHp += 10;
      this.hp = this.maxHp;
      this.baseDamage += 2;
      this.baseDefense += 1;
      return true;
    }
    return false;
  }

  clone() {
    const u = new Unit(this.typeId, this.factionId);
    u.level = this.level;
    u.exp = this.exp;
    u.maxHp = this.maxHp;
    u.hp = this.hp;
    u.baseDamage = this.baseDamage;
    u.baseDefense = this.baseDefense;
    return u;
  }
}

// NPC战斗单位生成
function createEnemyParty(avgLevel, size) {
  const party = [];
  const types = Object.keys(UnitTypes).filter(k => UnitTypes[k].hostile || UnitTypes[k].level <= avgLevel + 1);
  const hostileTypes = ['bandit', 'highway_robber', 'bandit_chief'];
  for (let i = 0; i < size; i++) {
    let type;
    if (avgLevel >= 4 && i === 0) type = 'bandit_chief';
    else if (avgLevel >= 3) type = Math.random() < 0.5 ? 'highway_robber' : 'bandit';
    else type = 'bandit';
    party.push(new Unit(type, 'bandit'));
  }
  return party;
}

// 领主部队
function createLordParty(avgLevel, size, factionId) {
  const party = [];
  for (let i = 0; i < size; i++) {
    let type;
    const r = Math.random();
    if (avgLevel <= 2) type = r < 0.7 ? 'militia' : 'archer';
    else if (avgLevel <= 3) type = r < 0.4 ? 'swordsman' : (r < 0.7 ? 'archer' : 'spearman');
    else if (avgLevel <= 4) type = r < 0.3 ? 'veteran' : (r < 0.6 ? 'hunter' : 'heavy_spearman');
    else if (avgLevel <= 5) type = r < 0.3 ? 'elite_swordsman' : (r < 0.6 ? 'longbowman' : 'pikeman');
    else type = r < 0.4 ? 'knight' : (r < 0.7 ? 'elite_archer' : 'elite_swordsman');
    const u = new Unit(type, factionId);
    party.push(u);
  }
  return party;
}
