// ============ 世界（整个游戏世界） ============
class World {
  constructor() {
    this.width = 2000;
    this.height = 1500;
    this.factions = [];
    this.settlements = [];
    this.patrols = [];       // 巡逻/敌方部队
    this.encounters = [];    // 战斗遭遇
    this.questSystem = null;
    this.currentDay = 1;
  }

  generate() {
    this.factions = createFactions();
    this.generateSettlements();
    this.questSystem = new QuestSystem(this);
    // 生成初始任务
    this.settlements.forEach(s => {
      for (let i = 0; i < 2; i++) {
        const q = this.questSystem.generateRandomQuest(s);
        if (q) s.questsAvailable.push(q);
      }
    });
    this.generatePatrols();
  }

  // 生成定居点（分区域按势力分布）
  generateSettlements() {
    // 创建势力区域 - 将地图分成8个扇区
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const sectors = [
      { angle: 0, rx: 0.35, ry: 0.3 },   // 东
      { angle: Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: Math.PI / 2, rx: 0.3, ry: 0.38 },  // 南
      { angle: 3 * Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: Math.PI, rx: 0.35, ry: 0.3 },      // 西
      { angle: 5 * Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: 3 * Math.PI / 2, rx: 0.3, ry: 0.38 },  // 北
      { angle: 7 * Math.PI / 4, rx: 0.38, ry: 0.32 }   // 中立
    ];

    const townCount = 40;
    const castleCount = 120;
    const villageCount = 300;

    // 为每个势力分配城镇
    const nonNeutralFactions = this.factions.filter(f => f.id !== 'neutral');
    const neutralFaction = this.factions.find(f => f.id === 'neutral');

    // 先为每个势力生成主要城堡和城镇
    let idCounter = 0;
    const factionTowns = {};
    nonNeutralFactions.forEach(f => factionTowns[f.id] = []);
    factionTowns['neutral'] = [];

    // 每个势力生成5个城镇
    nonNeutralFactions.forEach((f, fi) => {
      const sector = sectors[fi];
      const baseAngle = sector.angle;
      for (let t = 0; t < 5; t++) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.6;
        const dist = 0.4 + Math.random() * 0.25;
        const x = centerX + Math.cos(angle) * this.width * dist * (sector.rx / 0.35);
        const y = centerY + Math.sin(angle) * this.height * dist * (sector.ry / 0.35);
        const name = Utils.placeName();
        const town = new Settlement('town_' + (idCounter++), name + '城', 'town',
          Utils.clamp(x, 50, this.width - 50), Utils.clamp(y, 50, this.height - 50), f.id);
        this.settlements.push(town);
        factionTowns[f.id].push(town);
      }
    });

    // 中立城镇
    for (let t = 0; t < 5; t++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.1 + Math.random() * 0.15;
      const x = centerX + Math.cos(angle) * this.width * dist;
      const y = centerY + Math.sin(angle) * this.height * dist;
      const name = Utils.placeName();
      const town = new Settlement('town_' + (idCounter++), name + '集', 'town',
        Utils.clamp(x, 50, this.width - 50), Utils.clamp(y, 50, this.height - 50), 'neutral');
      this.settlements.push(town);
      factionTowns['neutral'].push(town);
    }

    // 生成城堡 - 每势力约15个
    nonNeutralFactions.forEach((f, fi) => {
      for (let c = 0; c < 15; c++) {
        // 在城镇附近生成
        const parentTown = factionTowns[f.id][Math.floor(Math.random() * factionTowns[f.id].length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const x = parentTown.x + Math.cos(angle) * dist;
        const y = parentTown.y + Math.sin(angle) * dist;
        const castle = new Settlement('castle_' + (idCounter++), Utils.placeName() + '堡',
          'castle', Utils.clamp(x, 30, this.width - 30), Utils.clamp(y, 30, this.height - 30), f.id);
        castle.parentId = parentTown.id;
        parentTown.children.push(castle.id);
        this.settlements.push(castle);
      }
    });

    // 生成村庄 - 每势力约35-40个
    nonNeutralFactions.forEach((f, fi) => {
      for (let v = 0; v < 38; v++) {
        const parentTown = factionTowns[f.id][Math.floor(Math.random() * factionTowns[f.id].length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 60;
        const x = parentTown.x + Math.cos(angle) * dist;
        const y = parentTown.y + Math.sin(angle) * dist;
        const village = new Settlement('village_' + (idCounter++), Utils.placeName() + '村',
          'village', Utils.clamp(x, 20, this.width - 20), Utils.clamp(y, 20, this.height - 20), f.id);
        village.parentId = parentTown.id;
        parentTown.children.push(village.id);
        this.settlements.push(village);
      }
    });

    // 统计势力领土
    this.factions.forEach(f => {
      f.territoryCount = this.settlements.filter(s => s.factionId === f.id).length;
    });

    // 修正总数
    console.log('生成了 ' + this.settlements.filter(s => s.type === 'town').length + ' 个城镇, ' +
      this.settlements.filter(s => s.type === 'castle').length + ' 个城堡, ' +
      this.settlements.filter(s => s.type === 'village').length + ' 个村庄');
  }

  // 生成巡逻部队
  generatePatrols() {
    this.patrols = [];
    // 每势力生成3-5个巡逻队
    this.factions.filter(f => f.id !== 'neutral').forEach(f => {
      const count = Utils.randInt(3, 5);
      for (let i = 0; i < count; i++) {
        const town = this.settlements.filter(s => s.factionId === f.id && s.type === 'town')[0];
        if (!town) continue;
        const p = {
          id: 'patrol_' + f.id + '_' + i,
          factionId: f.id,
          x: town.x + Utils.randInt(-30, 30),
          y: town.y + Utils.randInt(-30, 30),
          homeX: town.x,
          homeY: town.y,
          units: createLordParty(Utils.randInt(2, 4), Utils.randInt(3, 8), f.id),
          moveTimer: 0,
          speed: 25,
          power: 0,
          isHostile: true
        };
        p.power = p.units.reduce((s, u) => s + u.baseDamage + u.baseDefense + u.maxHp / 10, 0);
        this.patrols.push(p);
      }
    });

    // 生成强盗部队（无势力）
    for (let i = 0; i < 15; i++) {
      const p = {
        id: 'bandit_' + i,
        factionId: 'bandit',
        x: Utils.randInt(100, this.width - 100),
        y: Utils.randInt(100, this.height - 100),
        homeX: 0,
        homeY: 0,
        units: createEnemyParty(Utils.randInt(1, 4), Utils.randInt(2, 6)),
        moveTimer: 0,
        speed: 30,
        power: 0,
        isHostile: true
      };
      p.homeX = p.x;
      p.homeY = p.y;
      p.power = p.units.reduce((s, u) => s + u.baseDamage + u.baseDefense + u.maxHp / 10, 0);
      this.patrols.push(p);
    }
  }

  // 每日更新
  onNewDay(dayNum, player) {
    this.currentDay = dayNum;
    this.settlements.forEach(s => s.onNewDay());
    // 势力之间关系变化
    this.factions.forEach(f => {
      // 随机战争与和平
      if (Math.random() < 0.05 && f.id !== 'neutral') {
        const others = this.factions.filter(o => o.id !== f.id && o.id !== 'neutral');
        const target = others[Math.floor(Math.random() * others.length)];
        if (f.getRelation(target.id) < -40 && !f.atWarWith.includes(target.id)) {
          f.declareWar(target.id);
          target.declareWar(f.id);
          console.log(f.name + ' 向 ' + target.name + ' 宣战！');
        }
      }
    });
    // 每周结算工资
    if (dayNum % 7 === 0 && player) {
      const wage = player.party.weeklyWage;
      if (wage > 0) {
        if (player.spendGold(wage)) {
          toast('支付部队工资：-' + wage + ' 金币', '#b89856');
        } else {
          toast('金币不足支付工资，士气下降！', '#f86868');
          player.party.morale = Math.max(0, player.party.morale - 10);
        }
      }
    }
    // 消耗食物
    if (player) {
      const breadCount = player.party.getItemCount('bread');
      const need = Math.ceil(player.party.totalCount / 3);
      if (breadCount >= need) {
        player.party.removeItem('bread', need);
      } else {
        player.party.morale = Math.max(0, player.party.morale - 3);
        if (breadCount > 0) player.party.removeItem('bread', breadCount);
      }
      player.heal(5);
      player.party.healAll(10);
    }
  }

  getFaction(id) { return this.factions.find(f => f.id === id); }
  getSettlement(id) { return this.settlements.find(s => s.id === id); }

  // 获取玩家附近的敌方遭遇
  checkEncounter(player, radius) {
    const results = [];
    this.patrols.forEach(p => {
      const dist = Utils.dist(p.x, p.y, player.x, player.y);
      if (dist < radius) {
        // 敌方势力或敌对势力
        if (p.factionId === 'bandit' ||
            (player.factionId !== p.factionId && p.factionId !== 'neutral' &&
             this.getFaction(player.factionId) && this.getFaction(player.factionId).isHostile(p.factionId))) {
          // 仅在玩家未在定居点安全区内触发
          const nearSafe = this.settlements.some(s =>
            (s.type === 'town' || s.type === 'castle') &&
            Utils.dist(s.x, s.y, player.x, player.y) < 25 &&
            s.factionId === player.factionId);
          if (!nearSafe) results.push(p);
        }
      }
    });
    return results;
  }

  // 随机强盗遭遇
  checkRandomBandit(player) {
    if (Math.random() < 0.003) {
      const strength = Utils.randInt(1, Math.min(5, Math.max(1, player.level - 1)));
      const size = Utils.randInt(2, 2 + strength);
      return {
        id: 'random_bandit',
        factionId: 'bandit',
        x: player.x,
        y: player.y,
        units: createEnemyParty(strength, size),
        power: 0
      };
    }
    return null;
  }

  // 城镇/城堡是否被围攻（玩家可以围攻城镇）
  canSiege(settlement, player) {
    if (settlement.type === 'village') return false;
    if (settlement.factionId === player.factionId) return false;
    return player.party.totalCount >= 8;
  }

  updatePatrols(dt) {
    this.patrols.forEach(p => {
      p.moveTimer -= dt;
      if (p.moveTimer <= 0) {
        p.moveTimer = Utils.randInt(3, 10);
        // 随机在原地徘徊或返回据点
        const angle = Math.random() * Math.PI * 2;
        p.tx = p.homeX + Math.cos(angle) * 60;
        p.ty = p.homeY + Math.sin(angle) * 60;
      }
      if (p.tx != null) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 2) {
          p.x += dx / d * p.speed * dt;
          p.y += dy / d * p.speed * dt;
        }
      }
    });
  }
}
