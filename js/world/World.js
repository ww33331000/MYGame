// ============ 世界（整个游戏世界） ============
class World {
  constructor() {
    this.width = 2400;
    this.height = 1800;
    this.factions = [];
    this.settlements = [];
    this.patrols = [];       // 巡逻/敌方部队
    this.encounters = [];    // 战斗遭遇
    this.questSystem = null;
    this.currentDay = 1;
    // 地形数据：网格化的高度图（0=海洋/不可通过, 1=平原, 2=森林, 3=山地, 4=高地）
    this.terrainGrid = null;
    this.gridSize = 24;       // 每个格子像素
    this.gridCols = 0;
    this.gridRows = 0;
    this.landBounds = null;   // 陆地边界 {minX, maxX, minY, maxY}
  }

  // 噪声函数 - 简单的伪随机梯度噪声
  noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  // 平滑噪声（值噪声）
  smoothNoise(x, y, scale) {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const fx = sx - x0;
    const fy = sy - y0;
    // 平滑插值
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = this.noise2D(x0, y0);
    const b = this.noise2D(x1, y0);
    const c = this.noise2D(x0, y1);
    const d = this.noise2D(x1, y1);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  // 分形噪声（多倍频叠加）
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

  // 生成地形图
  generateTerrain() {
    this.gridCols = Math.ceil(this.width / this.gridSize);
    this.gridRows = Math.ceil(this.height / this.gridSize);
    this.terrainGrid = [];
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
    for (let row = 0; row < this.gridRows; row++) {
      this.terrainGrid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        const x = col * this.gridSize;
        const y = row * this.gridSize;
        // 距离中心的距离 - 制造圆形大陆
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = (x - cx) / (this.width * 0.42);
        const dy = (y - cy) / (this.height * 0.42);
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        // 添加噪声扰动让大陆边缘不规则
        const n = this.fbm(x, y);
        const edgeNoise = n * 0.5;
        // 大陆形状 - 1=陆地, 0=海洋
        const landValue = 1 - distFromCenter + edgeNoise - 0.3;
        let terrain;
        if (landValue < -0.05) {
          terrain = 0; // 海洋
        } else {
          // 根据噪声确定地形类型
          const detailNoise = this.fbm(x * 0.5, y * 0.5);
          if (detailNoise > 0.65) terrain = 4;      // 高地/山地
          else if (detailNoise > 0.5) terrain = 3;  // 山地
          else if (detailNoise > 0.4) terrain = 2;  // 森林
          else terrain = 1;                          // 平原
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

  // 检查某点是否是陆地
  isLand(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    const col = Math.floor(x / this.gridSize);
    const row = Math.floor(y / this.gridSize);
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return false;
    return this.terrainGrid[row][col] > 0;
  }

  // 获取地形类型
  getTerrain(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    const col = Math.floor(x / this.gridSize);
    const row = Math.floor(y / this.gridSize);
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return 0;
    return this.terrainGrid[row][col];
  }

  // 找到附近最近的陆地坐标（防止移动到海洋）
  findNearestLand(x, y, maxDist) {
    if (this.isLand(x, y)) return { x, y };
    for (let r = 1; r <= maxDist; r += 4) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const nx = x + Math.cos(a) * r;
        const ny = y + Math.sin(a) * r;
        if (this.isLand(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x, y };
  }

  generate() {
    this.factions = createFactions();
    this.generateTerrain();
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

  // 生成定居点（按势力区域+地形）- 仅生成在陆地上
  generateSettlements() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const sectors = [
      { angle: 0, rx: 0.35, ry: 0.3 },
      { angle: Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: Math.PI / 2, rx: 0.3, ry: 0.38 },
      { angle: 3 * Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: Math.PI, rx: 0.35, ry: 0.3 },
      { angle: 5 * Math.PI / 4, rx: 0.38, ry: 0.32 },
      { angle: 3 * Math.PI / 2, rx: 0.3, ry: 0.38 },
      { angle: 7 * Math.PI / 4, rx: 0.38, ry: 0.32 }
    ];

    const nonNeutralFactions = this.factions.filter(f => f.id !== 'neutral');
    let idCounter = 0;
    const factionTowns = {};
    nonNeutralFactions.forEach(f => factionTowns[f.id] = []);
    factionTowns['neutral'] = [];

    // 工具函数 - 在陆地放置点
    const placeOnLand = (cx, cy, maxRadius) => {
      // 先尝试中心点
      if (this.isLand(cx, cy)) return { x: cx, y: cy };
      // 螺旋搜索陆地
      for (let r = 8; r <= maxRadius; r += 6) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (this.isLand(x, y)) return { x, y };
        }
      }
      return null;
    };

    // 每个势力生成5个城镇
    nonNeutralFactions.forEach((f, fi) => {
      const sector = sectors[fi];
      for (let t = 0; t < 5; t++) {
        const baseAngle = sector.angle;
        const angle = baseAngle + (Math.random() - 0.5) * 0.6;
        const dist = 0.25 + Math.random() * 0.18;
        const cx = centerX + Math.cos(angle) * this.width * dist * (sector.rx / 0.35);
        const cy = centerY + Math.sin(angle) * this.height * dist * (sector.ry / 0.35);
        const pt = placeOnLand(cx, cy, 150);
        if (!pt) continue;
        const town = new Settlement('town_' + (idCounter++), Utils.placeName() + '城', 'town',
          pt.x, pt.y, f.id);
        this.settlements.push(town);
        factionTowns[f.id].push(town);
      }
    });

    // 中立城镇
    for (let t = 0; t < 5; t++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.05 + Math.random() * 0.15;
      const cx = centerX + Math.cos(angle) * this.width * dist;
      const cy = centerY + Math.sin(angle) * this.height * dist;
      const pt = placeOnLand(cx, cy, 100);
      if (!pt) continue;
      const town = new Settlement('town_' + (idCounter++), Utils.placeName() + '集', 'town',
        pt.x, pt.y, 'neutral');
      this.settlements.push(town);
      factionTowns['neutral'].push(town);
    }

    // 生成城堡 - 每势力约15个
    nonNeutralFactions.forEach((f, fi) => {
      for (let c = 0; c < 15; c++) {
        if (factionTowns[f.id].length === 0) break;
        const parentTown = factionTowns[f.id][Math.floor(Math.random() * factionTowns[f.id].length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const cx = parentTown.x + Math.cos(angle) * dist;
        const cy = parentTown.y + Math.sin(angle) * dist;
        const pt = placeOnLand(cx, cy, 100);
        if (!pt) continue;
        const castle = new Settlement('castle_' + (idCounter++), Utils.placeName() + '堡',
          'castle', pt.x, pt.y, f.id);
        castle.parentId = parentTown.id;
        parentTown.children.push(castle.id);
        this.settlements.push(castle);
      }
    });

    // 生成村庄 - 每势力约35-40个
    nonNeutralFactions.forEach((f, fi) => {
      for (let v = 0; v < 38; v++) {
        if (factionTowns[f.id].length === 0) break;
        const parentTown = factionTowns[f.id][Math.floor(Math.random() * factionTowns[f.id].length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 60;
        const cx = parentTown.x + Math.cos(angle) * dist;
        const cy = parentTown.y + Math.sin(angle) * dist;
        const pt = placeOnLand(cx, cy, 60);
        if (!pt) continue;
        const village = new Settlement('village_' + (idCounter++), Utils.placeName() + '村',
          'village', pt.x, pt.y, f.id);
        village.parentId = parentTown.id;
        parentTown.children.push(village.id);
        this.settlements.push(village);
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

  updatePatrols(dt) {
    this.patrols.forEach(p => {
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
    });
  }
}
