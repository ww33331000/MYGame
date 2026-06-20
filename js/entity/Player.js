// ================================
// 大陆风云 - 玩家
// ================================

import { Inventory } from './Inventory.js';
import { Equipment } from './Equipment.js';

export class Player {
  constructor(name = '无名旅人') {
    // 基础信息
    this.name = name;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    
    // 位置
    this.x = 0;
    this.y = 0;
    this.direction = 'down'; // up, down, left, right
    
    // 属性
    this.attributes = {
      strength: 5,     // 力量: 近战伤害、负重量
      agility: 5,       // 敏捷: 攻击速度、闪避率
      vitality: 5,     // 体质: 生命值、耐力
      intelligence: 5,  // 智力: 经验加成、技能解锁
      charisma: 5      // 魅力: NPC好感度、议价能力
    };
    
    // 派生属性
    this.maxHp = 100;
    this.maxStamina = 50;
    this.currentHp = this.maxHp;
    this.currentStamina = this.maxStamina;
    this.attack = 10;
    this.defense = 5;
    this.speed = 100;
    this.carryWeight = 50;
    
    // 资源
    this.gold = 500;
    
    // 装备和背包
    this.equipment = new Equipment();
    this.inventory = new Inventory(24);
    
    // 技能
    this.skills = {
      sword: { level: 1, exp: 0 },
      axe: { level: 0, exp: 0 },
      polearm: { level: 0, exp: 0 },
      bow: { level: 0, exp: 0 },
      riding: { level: 0, exp: 0 },
      trade: { level: 0, exp: 0 },
      leadership: { level: 0, exp: 0 },
      smithing: { level: 0, exp: 0 }
    };
    
    // 部队
    this.army = {
      units: [], // 士兵列表
      maxSize: 20 // 最大队伍规模
    };
    
    // 商队
    this.caravan = null;
    
    // 声望
    this.reputation = {
      overall: 0,
      byFaction: {}
    };
    
    // 状态
    this.isMoving = false;
    this.isInBattle = false;
    this.isTrading = false;
    
    // 重新计算属性
    this.recalculateStats();
    
    // 给予初始装备
    this.giveStartingItems();
  }
  
  // 重新计算属性
  recalculateStats() {
    // 生命值 = 100 + 体质 * 10 + 装备加成
    this.maxHp = 100 + this.attributes.vitality * 10;
    
    // 耐力 = 50 + 敏捷 * 2
    this.maxStamina = 50 + this.attributes.agility * 2;
    
    // 攻击 = 10 + 力量 * 2 + 武器加成
    this.attack = 10 + this.attributes.strength * 2;
    
    // 防御 = 5 + 体质 + 护甲加成
    this.defense = 5 + this.attributes.vitality;
    
    // 速度 = 100 + 敏捷
    this.speed = 100 + this.attributes.agility * 5;
    
    // 负重量 = 50 + 力量 * 5
    this.carryWeight = 50 + this.attributes.strength * 5;
  }
  
  // 给予初始物品
  giveStartingItems() {
    // 初始武器
    this.inventory.addItem({
      id: 'rusty_sword',
      name: '生锈的剑',
      type: 'weapon',
      subtype: 'sword',
      damage: 8,
      speed: 5,
      weight: 3,
      price: 50,
      quality: 'poor',
      icon: '⚔️'
    });
    
    // 初始护甲
    this.inventory.addItem({
      id: 'leather_armor',
      name: '皮甲',
      type: 'armor',
      subtype: 'body',
      defense: 3,
      weight: 5,
      price: 80,
      quality: 'common',
      icon: '🧥'
    });
    
    // 食物
    for (let i = 0; i < 3; i++) {
      this.inventory.addItem({
        id: 'bread',
        name: '面包',
        type: 'consumable',
        effect: 'restore_hp',
        value: 20,
        weight: 0.5,
        price: 5,
        icon: '🍞'
      });
    }
  }
  
  // 更新
  update(dt, game) {
    // 更新耐力消耗
    if (this.isMoving) {
      this.currentStamina -= 5 * dt;
      if (this.currentStamina <= 0) {
        this.currentStamina = 0;
        this.speed = 50; // 疲劳时速度减半
      }
    } else {
      // 恢复耐力
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina + 10 * dt);
    }
    
    // 检查是否需要治疗
    if (this.currentHp < this.maxHp && !this.isMoving) {
      this.currentHp = Math.min(this.maxHp, this.currentHp + 2 * dt);
    }
    
    // 边界检查
    const worldSize = 8192;
    this.x = Math.max(16, Math.min(worldSize - 16, this.x));
    this.y = Math.max(16, Math.min(worldSize - 16, this.y));
  }
  
  // 移动
  move(direction, dt) {
    const speed = this.speed * dt;
    this.direction = direction;
    this.isMoving = true;
    
    switch (direction) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }
  
  // 停止移动
  stopMoving() {
    this.isMoving = false;
  }
  
  // 获得经验
  addExp(amount) {
    const bonus = 1 + (this.attributes.intelligence - 5) * 0.1;
    const actualExp = Math.floor(amount * bonus);
    
    this.exp += actualExp;
    
    while (this.exp >= this.expToNext) {
      this.levelUp();
    }
  }
  
  // 升级
  levelUp() {
    this.level++;
    this.exp -= this.expToNext;
    this.expToNext = Math.floor(100 * Math.pow(1.2, this.level - 1));
    
    // 属性提升
    this.attributes.strength += 2;
    this.attributes.agility += 2;
    this.attributes.vitality += 2;
    this.attributes.intelligence += 1;
    this.attributes.charisma += 1;
    
    // 重新计算属性
    this.recalculateStats();
    
    // 满血满耐力
    this.currentHp = this.maxHp;
    this.currentStamina = this.maxStamina;
  }
  
  // 造成伤害
  dealDamage(target, damage) {
    // 计算护甲减免
    const armorReduction = target.defense * 0.5;
    const actualDamage = Math.max(1, damage - armorReduction);
    
    target.currentHp -= actualDamage;
    
    return actualDamage;
  }
  
  // 受到伤害
  takeDamage(damage) {
    // 计算护甲减免
    const armorReduction = this.getTotalDefense() * 0.5;
    const actualDamage = Math.max(1, damage - armorReduction);
    
    this.currentHp -= actualDamage;
    
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.onDeath();
    }
    
    return actualDamage;
  }
  
  // 获取总防御力
  getTotalDefense() {
    let totalDefense = this.defense;
    
    // 加上装备防御
    const slots = this.equipment.slots;
    for (const slot in slots) {
      if (slots[slot] && slots[slot].defense) {
        totalDefense += slots[slot].defense;
      }
    }
    
    return totalDefense;
  }
  
  // 死亡处理
  onDeath() {
    // 玩家死亡 - 可以选择加载存档或重新开始
    this.currentHp = Math.floor(this.maxHp / 4);
  }
  
  // 添加到军团
  addToArmy(unit) {
    if (this.army.units.length < this.army.maxSize) {
      this.army.units.push({
        id: unit.id || Date.now(),
        name: unit.name || '士兵',
        hp: unit.hp || 50,
        maxHp: unit.maxHp || 50,
        damage: unit.damage || 10,
        speed: unit.speed || 80,
        level: unit.level || 1,
        experience: 0
      });
      return true;
    }
    return false;
  }
  
  // 从军团移除
  removeFromArmy(unitId) {
    this.army.units = this.army.units.filter(u => u.id !== unitId);
  }
  
  // 恢复生命
  heal(amount) {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }
  
  // 使用物品
  useItem(item) {
    if (item.type === 'consumable') {
      switch (item.effect) {
        case 'restore_hp':
          this.heal(item.value);
          break;
        case 'restore_stamina':
          this.currentStamina = Math.min(this.maxStamina, this.currentStamina + item.value);
          break;
        case 'buff_strength':
          // 临时增益
          break;
      }
      this.inventory.removeItem(item.id);
      return true;
    }
    return false;
  }
  
  // 增加声望
  addReputation(factionId, amount) {
    if (!this.reputation.byFaction[factionId]) {
      this.reputation.byFaction[factionId] = 0;
    }
    
    this.reputation.byFaction[factionId] += amount;
    this.reputation.overall = Math.max(-100, Math.min(100, 
      this.reputation.overall + amount * 0.1));
  }
  
  // 检查是否可以进行动作
  canPerformAction(cost) {
    if (cost.stamina && this.currentStamina < cost.stamina) {
      return false;
    }
    if (cost.gold && this.gold < cost.gold) {
      return false;
    }
    return true;
  }
  
  // 消耗资源
  spendResource(cost) {
    if (cost.stamina) {
      this.currentStamina -= cost.stamina;
    }
    if (cost.gold) {
      this.gold -= cost.gold;
    }
  }
  
  // 获取状态摘要
  getStatus() {
    return {
      name: this.name,
      level: this.level,
      hp: `${Math.floor(this.currentHp)}/${this.maxHp}`,
      stamina: `${Math.floor(this.currentStamina)}/${this.maxStamina}`,
      gold: this.gold,
      position: { x: Math.floor(this.x), y: Math.floor(this.y) },
      armySize: this.army.units.length,
      hasCaravan: !!this.caravan
    };
  }
}
