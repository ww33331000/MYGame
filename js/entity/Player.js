// ============ 玩家 ============
class Player {
  constructor(world) {
    this.name = '无名侠客';
    this.title = '游侠';
    this.level = 1;
    this.exp = 0;
    this.expNeeded = 100;
    this.maxHp = 100;
    this.hp = 100;
    this.strength = 10;    // 力量: 增加伤害
    this.agility = 10;     // 敏捷: 增加攻速/闪避
    this.vitality = 10;    // 体力: 增加生命
    this.intelligence = 8; // 智力: 影响交涉/交易
    this.reputation = 0;   // 声望
    this.factionId = 'neutral';
    this.isKing = false;   // 是否成为国王（拥有势力）
    this.party = new PlayerParty();
    // 装备槽
    this.equipment = {
      weapon: createItem('iron_sword'),
      armor: createItem('leather_armor'),
      helmet: null,
      shield: null
    };
    // 初始位置 - 在一个中立村庄附近
    if (world && world.settlements && world.settlements.length > 0) {
      // 找一个村庄
      const village = world.settlements.find(s => s.type === 'village') || world.settlements[0];
      this.x = village.x + 30;
      this.y = village.y + 30;
    } else {
      this.x = 480;
      this.y = 300;
    }
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveSpeed = 60;
    this.isMoving = false;
    this.daysTraveled = 0;
    // 初始金币
    this.party.gold = 200;
    // 初始物品
    this.party.addItem(createItem('bread'), 5);
    this.party.addItem(createItem('wine'), 3);
    this.party.addItem(createItem('herb'), 2);
    // 初始部队
    const recruit1 = new Unit('recruit', 'neutral');
    const recruit2 = new Unit('recruit', 'neutral');
    recruit1.isPlayer = true;
    recruit2.isPlayer = true;
    // 玩家角色自己也是一个单位（战斗时）
    this.playerUnit = new Unit('swordsman', 'neutral');
    this.playerUnit.isPlayer = true;
    this.playerUnit.name = this.name;
    this.party.addMember(this.playerUnit);
    this.party.addMember(recruit1);
    this.party.addMember(recruit2);
  }

  get damage() {
    let dmg = Math.floor(this.strength * 0.5) + this.level * 2;
    if (this.equipment.weapon) dmg += this.equipment.weapon.damage;
    return dmg;
  }

  get defense() {
    let def = Math.floor(this.vitality * 0.3);
    if (this.equipment.armor) def += this.equipment.armor.defense;
    if (this.equipment.helmet) def += this.equipment.helmet.defense;
    if (this.equipment.shield) def += this.equipment.shield.defense;
    return def;
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expNeeded) {
      this.exp -= this.expNeeded;
      this.level++;
      this.expNeeded = Math.floor(this.expNeeded * 1.5);
      this.maxHp += 15;
      this.strength += 2;
      this.agility += 1;
      this.vitality += 2;
      this.intelligence += 1;
      this.hp = this.maxHp;
      toast('升级了！当前等级：' + this.level, '#78d878');
      // 同步玩家单位
      if (this.playerUnit) {
        this.playerUnit.level = this.level;
        this.playerUnit.maxHp = this.maxHp;
        this.playerUnit.hp = this.hp;
        this.playerUnit.baseDamage = Math.floor(this.damage / 2);
      }
      // 扩充队伍上限
      if (this.level % 2 === 0) this.party.maxSize++;
    }
  }

  takeDamage(dmg) {
    const actual = Math.max(1, Math.floor(dmg - this.defense * 0.5));
    this.hp -= actual;
    if (this.hp <= 0) {
      this.hp = 0;
      return true; // 死亡
    }
    return false;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  equip(item) {
    let slot = null;
    if (item.type === ItemType.WEAPON) slot = 'weapon';
    else if (item.type === ItemType.ARMOR) slot = 'armor';
    else if (item.type === ItemType.HELMET) slot = 'helmet';
    else if (item.type === ItemType.SHIELD) slot = 'shield';
    if (!slot) return false;
    // 先从库存移除
    this.party.removeItem(item.id, 1);
    // 如果原装备存在，先放回背包
    const old = this.equipment[slot];
    if (old) this.party.addItem(old, 1);
    this.equipment[slot] = item;
    toast('已装备：' + item.name, '#f4d35e');
    return true;
  }

  unequip(slot) {
    if (!this.equipment[slot]) return false;
    this.party.addItem(this.equipment[slot], 1);
    this.equipment[slot] = null;
    return true;
  }

  // 行军
  startMoveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
  }

  stopMove() { this.isMoving = false; }

  updateMovement(dt) {
    if (!this.isMoving) return false;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      return true;
    }
    // 部队越多速度略慢
    const speed = this.moveSpeed * (1 - Math.min(0.4, this.party.totalCount * 0.02));
    const vx = dx / dist * speed;
    const vy = dy / dist * speed;
    this.x += vx * dt;
    this.y += vy * dt;
    return false;
  }

  earnGold(amount) {
    this.party.earnGold(amount);
  }
  spendGold(amount) {
    return this.party.spendGold(amount);
  }
}
