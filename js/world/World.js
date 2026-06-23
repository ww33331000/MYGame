// ============ 世界（整个游戏世界） ============
// v2: 不规则大陆 + 势力分区 + 合理据点分布
class World {
  constructor() {
    // 更大的世界范围
    this.width = 2880;
    this.height = 2160;
    this.factions = [];
    this.settlements = [];
    this.patrols = [];
    this.encounters = [];
    this.questSystem = null;
    this.currentDay = 1;
    // 地形数据
    this.terrainGrid = null;
    this.gridSize = 24;
    this.gridCols = 0;
    this.gridRows = 0;
    this.landBounds = null;
    // 势力分区中心（每个势力一个大领地）
    this.factionZones = {}; // {factionId: {cx, cy, radius}}
    this.worldSeed = Math.floor(Math.random() * 100000);
  }

  // 带种子的噪声函数
  noise2D(x, y) {
    const n = Math.sin((x + this.worldSeed) * 12.9898 + (y + this.worldSeed) * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  // 平滑噪声
  smoothNoise(x, y, scale) {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const fx = sx - x0;
    const fy = sy - y0;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = this.noise2D(x0, y0);
    const b = this.noise2D(x1, y0);
    const c = this.noise2D(x0, y1);
    const d = this.noise2D(x1, y1);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  // 分形噪声
  fbm(x, y) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < 5; i++) {
      value += amplitude * this.smoothNoise(x * frequency, y * frequency, 200 / frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  }

  // 生成不规则大陆形状
  generateTerrain() {
    this.gridCols = Math.ceil(this.width / this.gridSize);
    this.gridRows = Math.ceil(this.height / this.gridSize);
    this.terrainGrid = [];
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (let row = 0; row < this.gridRows; row++) {
      this.terrainGrid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        const x = col * this.gridSize;
        const y = row * this.gridSize;
        // 距离中心 - 椭圆形大陆（横向更宽）
        const dx = (x - cx) / (this.width * 0.40);
        const dy = (y - cy) / (this.height * 0.42);
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        // 噪声扰动制造不规则边缘（类似骑砍大陆）
        const n = this.fbm(x, y);
        const edgeNoise = n * 0.55;
        // 大陆形状判定
        const landValue = 1 - distFromCenter + edgeNoise - 0.28;
        let terrain;
        if (landValue < -0.05) {
          terrain = 0; // 海洋
        } else {
          const detailNoise = this.fbm(x * 0.5, y * 0.5);
          // 靠近边缘更容易是森林/山地；中心区域多为平原
          const distFactor = distFromCenter;
          if (detailNoise > 0.68 && distFactor > 0.35) terrain = 4;
          else if (detailNoise > 0.52 && distFactor > 0.25) terrain = 3;
          else if (detailNoise > 0.42) terrain = 2;
          else terrain = 1;
        }
        this.terrainGrid[row][col] = terrain;
        if (terrain > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    this.landBounds = { minX, maxX, minY, maxY };
  }

  isLand(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    const col = Math.floor(x / this.gridSize);
    const row = Math.floor(y / this.gridSize);
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return false;
    return this.terrainGrid[row][col] > 0;
  }

  getTerrain(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    const col = Math.floor(x / this.gridSize);
    const row = Math.floor(y / this.gridSize);
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return 0;
    return this.terrainGrid[row][col];
  }

  findNearestLand(x, y, maxDist) {
    if (this.isLand(x, y)) return { x, y };
    for (let r = 1; r <= maxDist; r += 6) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
        const nx = x + Math.cos(a) * r;
        const ny = y + Math.sin(a) * r;
        if (this.isLand(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x, y };
  }

  // ===== 生成势力分区中心 =====
  generateFactionZones() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const nonNeutral = this.factions.filter(f => f.id !== 'neutral');
    const n = nonNeutral.length;
    // 势力分布在一个大圆环上（每个势力一个扇形区）
    const startAngle = Math.random() * Math.PI * 2;
    nonNeutral.forEach((f, i) => {
      const angle = startAngle + (i / n) * Math.PI * 2;
      const radius = Math.min(this.width, this.height) * (0.22 + (i % 2) * 0.06);
      let fx = cx + Math.cos(angle) * radius;
      let fy = cy + Math.sin(angle) * radius;
      // 确保在陆地上
      if (!this.isLand(fx, fy)) {
        const pt = this.findNearestLand(fx, fy, 300);
        fx = pt.x; fy = pt.y;
      }
      this.factionZones[f.id] = { cx: fx, cy: fy, radius: 320 + Math.random() * 80 };
    });
  }

  generate() {
    this.factions = createFactions();
    this.generateTerrain();
    this.generateFactionZones();
    this.generateSettlements();
    this.questSystem = new QuestSystem(this);
    this.settlements.forEach(s => {
      for (let i = 0; i < 2; i++) {
        const q = this.questSystem.generateRandomQuest(s);
        if (q) s.questsAvailable.push(q);
      }
    });
    this.generatePatrols();
  }

  // 在势力领地内放置（保证在陆地）
  placeInZone(fzone, minR, maxR, maxAttempts) {
    for (let i = 0; i < maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * (maxR - minR);
      const x = fzone.cx + Math.cos(angle) * r;
      const y = fzone.cy + Math.sin(angle) * r;
      if (this.isLand(x, y)) {
        // 避免高山 (terrain 4)，据点不应该在山顶
        if (this.getTerrain(x, y) !== 4) return { x, y };
      }
    }
    // 回退：直接找势力中心附近最近陆地
    return this.findNearestLand(fzone.cx, fzone.cy, 200);
  }

  // 生成定居点（按势力分区，形成自然的"势力版图"）
  generateSettlements() {
    const nonNeutralFactions = this.factions.filter(f => f.id !== 'neutral');
    let idCounter = 0;
    const factionTowns = {};
    nonNeutralFactions.forEach(f => factionTowns[f.id] = []);
    factionTowns['neutral'] = [];

    // ===== 第一阶段：每势力生成 5 个城镇，在势力领地内均匀分布 =====
    nonNeutralFactions.forEach((f) => {
      const zone = this.factionZones[f.id];
      if (!zone) return;
      for (let t = 0; t < 5; t++) {
        // 每个城镇围绕势力中心在环形分布
        const ringR = 40 + t * 45;
        const pt = this.placeInZone(zone, ringR - 20, ringR + 40, 60);
        if (!pt) continue;
        // 避免距离现有据点太近
        if (this.settlements.some(s =>
          Math.hypot(s.x - pt.x, s.y - pt.y) < 80)) continue;
        const town = new Settlement('town_' + (idCounter++), Utils.placeName() + '城', 'town', pt.x, pt.y, f.id);
        this.settlements.push(town);
        factionTowns[f.id].push(town);
      }
    });

    // ===== 中立城镇：位于大陆中心/交通要冲 =====
    const centerX = this.width / 2, centerY = this.height / 2;
    for (let t = 0; t < 5; t++) {
      const angle = (t / 5) * Math.PI * 2 + Math.random() * 0.5;
      const r = 120 + Math.random() * 200;
      let px = centerX + Math.cos(angle) * r;
      let py = centerY + Math.sin(angle) * r;
      if (!this.isLand(px, py)) {
        const pt = this.findNearestLand(px, py, 200);
        px = pt.x; py = pt.y;
      }
      if (this.settlements.some(s => Math.hypot(s.x - px, s.y - py) < 100)) continue;
      const town = new Settlement('town_' + (idCounter++), Utils.placeName() + '集', 'town', px, py, 'neutral');
      this.settlements.push(town);
      factionTowns['neutral'].push(town);
    }

    // ===== 第二阶段：每势力生成 12~15 个城堡，围绕城镇分布 =====
    nonNeutralFactions.forEach(f => {
      const towns = factionTowns[f.id];
      if (!towns || towns.length === 0) return;
      const castleCount = 12 + Math.floor(Math.random() * 4);
      for (let c = 0; c < castleCount; c++) {
        const parentTown = towns[c % towns.length];
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 90;
        const cx = parentTown.x + Math.cos(angle) * dist;
        const cy = parentTown.y + Math.sin(angle) * dist;
        if (!this.isLand(cx, cy)) continue;
        if (this.getTerrain(cx, cy) === 4) continue; // 不建在高山
        if (this.settlements.some(s => Math.hypot(s.x - cx, s.y - cy) < 50)) continue;
        const castle = new Settlement('castle_' + (idCounter++), Utils.placeName() + '堡', 'castle', cx, cy, f.id);
        castle.parentId = parentTown.id;
        parentTown.children.push(castle.id);
        this.settlements.push(castle);
      }
    });

    // ===== 第三阶段：每势力 30~35 个村庄，围绕城镇/城堡分布 =====
    nonNeutralFactions.forEach(f => {
      const towns = factionTowns[f.id];
      if (!towns || towns.length === 0) return;
      const villageCount = 30 + Math.floor(Math.random() * 6);
      for (let v = 0; v < villageCount; v++) {
        const parentTown = towns[v % towns.length];
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 55;
        const cx = parentTown.x + Math.cos(angle) * dist;
        const cy = parentTown.y + Math.sin(angle) * dist;
        if (!this.isLand(cx, cy)) continue;
        if (this.settlements.some(s => Math.hypot(s.x - cx, s.y - cy) < 30)) continue;
        const village = new Settlement('village_' + (idCounter++), Utils.placeName() + '村', 'village', cx, cy, f.id);
        village.parentId = parentTown.id;
        parentTown.children.push(village.id);
        this.settlements.push(village);
      }
    });
  }

  // 每日更新 - 生成随机遭遇/巡逻
  onNewDay(day, player) {
    this.currentDay = day;
    // 简单刷新一些巡逻
    this.generatePatrols();
    // 刷新任务
    this.settlements.forEach(s => {
      if (s.questsAvailable.length < 2) {
        const q = this.questSystem.generateRandomQuest(s);
        if (q) s.questsAvailable.push(q);
      }
    });
    // 统计势力领土
    this.factions.forEach(f => {
      f.territoryCount = this.settlements.filter(s => s.factionId === f.id).length;
    });
    console.log('生成了 ' + this.settlements.filter(s => s.type === 'town').length + ' 个城镇, ' +
      this.settlements.filter(s => s.type === 'castle').length + ' 个城堡, ' +
      this.settlements.filter(s => s.type === 'village').length + ' 个村庄, ' +
      '陆地边界: ' + JSON.stringify(this.landBounds));
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

    // 生成强盗部队（无势力）- 只能在陆地
    for (let i = 0; i < 18; i++) {
      let bx, by, attempts = 0;
      do {
        bx = Utils.randInt(150, this.width - 150);
        by = Utils.randInt(150, this.height - 150);
        attempts++;
      } while (!this.isLand(bx, by) && attempts < 50);
      if (!this.isLand(bx, by)) continue;
      const p = {
        id: 'bandit_' + i,
        factionId: 'bandit',
        x: bx,
        y: by,
        homeX: bx,
        homeY: by,
        units: createEnemyParty(Utils.randInt(1, 4), Utils.randInt(2, 6)),
        moveTimer: 0,
        speed: 30,
        power: 0,
        isHostile: true
      };
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

  updatePatrols(dt, player) {
    this.patrols.forEach(p => {
      // ===== 追踪玩家逻辑（被动接触） =====
      // 敌对势力巡逻队会主动追踪玩家
      let isChasing = false;
      if (player && this.isPatrolHostileToPlayer(p, player)) {
        const distToPlayer = Utils.dist(p.x, p.y, player.x, player.y);
        // 视野范围：敌对巡逻队会追踪 150 范围内的玩家
        if (distToPlayer < 150) {
          isChasing = true;
          // 追踪速度比正常快 1.5 倍
          const chaseSpeed = p.speed * 1.5;
          const dx = player.x - p.x;
          const dy = player.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 2) {
            const nx = p.x + dx / d * chaseSpeed * dt;
            const ny = p.y + dy / d * chaseSpeed * dt;
            if (this.isLand(nx, ny)) {
              p.x = nx;
              p.y = ny;
              p.isChasing = true;  // 标记正在追踪
              p.chaseTarget = { x: player.x, y: player.y };
            }
          }
        }
      }
      // ===== 正常巡逻逻辑 =====
      if (!isChasing) {
        p.isChasing = false;
        p.chaseTarget = null;
        p.moveTimer -= dt;
        if (p.moveTimer <= 0) {
          p.moveTimer = Utils.randInt(3, 10);
          // 随机在原地徘徊（仅在陆地范围内）
          const angle = Math.random() * Math.PI * 2;
          let tx = p.homeX + Math.cos(angle) * 60;
          let ty = p.homeY + Math.sin(angle) * 60;
          // 确保目标在陆地
          if (!this.isLand(tx, ty)) {
            const safe = this.findNearestLand(tx, ty, 50);
            tx = safe.x;
            ty = safe.y;
          }
          p.tx = tx;
          p.ty = ty;
        }
        if (p.tx != null) {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 2) {
            const nx = p.x + dx / d * p.speed * dt;
            const ny = p.y + dy / d * p.speed * dt;
            if (this.isLand(nx, ny)) {
              p.x = nx;
              p.y = ny;
            } else {
              // 重新选择目标
              p.moveTimer = 0;
              p.tx = null;
              p.ty = null;
            }
          }
        }
      }
    });
  }

  // 判断巡逻队是否对玩家敌对
  isPatrolHostileToPlayer(p, player) {
    // 强盗永远敌对
    if (p.factionId === 'bandit') return true;
    // 中立势力不敌对
    if (p.factionId === 'neutral') return false;
    // 同势力不敌对
    if (p.factionId === player.factionId) return false;
    // 检查势力关系
    const playerFaction = this.getFaction(player.factionId);
    if (!playerFaction) return true;  // 玩家无势力时，所有势力敌对
    return playerFaction.isHostile(p.factionId);
  }

  // 获取正在追踪玩家的巡逻队
  getChasingPatrols(player) {
    return this.patrols.filter(p => p.isChasing && this.isPatrolHostileToPlayer(p, player));
  }

  // 获取玩家附近的所有敌对巡逻队（用于主动接触检测）
  getNearbyHostilePatrols(player, radius) {
    return this.patrols.filter(p => {
      const dist = Utils.dist(p.x, p.y, player.x, player.y);
      return dist < radius && this.isPatrolHostileToPlayer(p, player);
    });
  }
}
