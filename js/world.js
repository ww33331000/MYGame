// ===== 世界生成与管理 =====
const World = (() => {
  let state = null;

  function generate(seed = Date.now()) {
    const rng = Utils.mulberry32(seed);
    const MAP_W = 2400;
    const MAP_H = 1600;

    state = {
      seed,
      mapSize: { w: MAP_W, h: MAP_H },
      day: 0, // 游戏内天数（含小数，小数部分为小时）
      settlements: [], // 所有城镇/城堡/村庄
      factions: {}, // 势力状态
      parties: [], // 地图上的队伍（玩家、AI领主、商队、劫匪）
      roads: [], // 简单连接
      events: [],
    };

    // 1. 生成势力
    for (const f of GameData.FACTIONS) {
      state.factions[f.id] = {
        id: f.id, name: f.name, color: f.color, culture: f.culture, banner: f.banner,
        gold: 20000 + Math.floor(rng() * 20000),
        relations: {}, // factionId -> number (-100 to 100)
        territories: [], // settlement ids
        lords: [],
        atWar: [],
      };
    }
    for (const a of GameData.FACTIONS) {
      for (const b of GameData.FACTIONS) {
        if (a.id !== b.id) {
          // 初始化关系：随机但偏中立
          state.factions[a.id].relations[b.id] = Math.floor((rng() - 0.5) * 40);
        }
      }
    }
    // 设定几对初始敌对关系（随机选2对）
    const factionIds = Object.keys(state.factions);
    const wars = [[factionIds[0], factionIds[3]], [factionIds[1], factionIds[5]]];
    for (const [a, b] of wars) {
      state.factions[a].relations[b] = -80;
      state.factions[b].relations[a] = -80;
      state.factions[a].atWar.push(b);
      state.factions[b].atWar.push(a);
    }

    // 2. 生成地形种子 - 6个势力中心
    const centers = [];
    const regions = [
      { x: 0.2, y: 0.3, id: 'imperial' },
      { x: 0.8, y: 0.25, id: 'nordia' },
      { x: 0.25, y: 0.75, id: 'vaegir' },
      { x: 0.75, y: 0.8, id: 'sultanate' },
      { x: 0.5, y: 0.5, id: 'rhomney' },
      { x: 0.1, y: 0.1, id: 'wasteland' },
    ];
    for (const r of regions) {
      centers.push({ x: r.x * MAP_W + (rng() - 0.5) * 200, y: r.y * MAP_H + (rng() - 0.5) * 200, faction: r.id });
    }

    // 3. 生成城镇（40）、城堡（120）、村庄（300）
    const types = [
      { type: 'town', count: 40, name: '城镇', size: 18, color: '#d4b862' },
      { type: 'castle', count: 120, name: '城堡', size: 12, color: '#a0a0a0' },
      { type: 'village', count: 300, name: '村庄', size: 8, color: '#6a8a6a' },
    ];

    let idCounter = 1;
    const allPoints = [];

    for (const t of types) {
      const pts = Utils.poissonSample(MAP_W - 200, MAP_H - 200,
        t.type === 'town' ? 280 : (t.type === 'castle' ? 150 : 80),
        t.count, seed + idCounter);
      for (const p of pts) {
        // 把点挪离边界
        const x = p.x + 100, y = p.y + 100;
        // 找最近的势力中心
        let best = centers[0], bestD = Infinity;
        for (const c of centers) {
          const d = (x - c.x) ** 2 + (y - c.y) ** 2;
          if (d < bestD) { bestD = d; best = c; }
        }
        // 为村庄分配名字
        let name;
        if (t.type === 'town') {
          const baseNames = GameData.NAMES[best.faction];
          name = Utils.choice(baseNames) + t.name;
        } else if (t.type === 'castle') {
          const baseNames = GameData.NAMES[best.faction];
          name = Utils.choice(baseNames) + '堡';
        } else {
          name = Utils.choice(GameData.VILLAGE_NAMES) +
            (rng() < 0.3 ? (Math.floor(rng() * 99) + 1) + '号' : '');
        }

        const set = {
          id: 's_' + idCounter++,
          type: t.type,
          name,
          x, y,
          faction: best.faction,
          originalFaction: best.faction,
          size: t.size,
          population: t.type === 'town' ? Math.floor(2000 + rng()*5000) :
                       t.type === 'castle' ? Math.floor(300 + rng()*800) :
                       Math.floor(80 + rng()*300),
          wealth: t.type === 'town' ? Math.floor(5000 + rng()*15000) :
                  t.type === 'castle' ? Math.floor(800 + rng()*2000) :
                  Math.floor(200 + rng()*800),
          garrison: [], // 守军兵种数组
          prosperity: 0.5 + rng() * 0.3,
          supply: {}, // 商品价格
          fiefLord: null,
          parentId: null, // 村庄隶属于某个城镇或城堡
          children: [], // 包含的村庄ID
          buildings: [],
          producing: [],
          lastRaidDay: -100,
          besieged: false,
        };
        // 初始化商品价格
        for (const g of GameData.GOODS) {
          const r = 0.6 + rng() * 1.2;
          set.supply[g.id] = Math.max(1, Math.floor(g.basePrice * r));
        }
        // 为城镇和城堡添加守军
        if (t.type === 'town' || t.type === 'castle') {
          const troops = generateGarrison(set, rng);
          set.garrison = troops;
        }
        state.settlements.push(set);
        allPoints.push(set);
      }
    }

    // 4. 将村庄分配给最近的城镇或城堡（隶属关系）
    for (const v of state.settlements) {
      if (v.type !== 'village') continue;
      let best = null, bestD = Infinity;
      for (const s of state.settlements) {
        if (s.type === 'village') continue;
        // 优先同势力
        const d = (v.x - s.x) ** 2 + (v.y - s.y) ** 2 + (s.faction !== v.faction ? 500000 : 0);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best) {
        v.parentId = best.id;
        v.faction = best.faction;
        best.children.push(v.id);
      }
    }

    // 5. 生成领主与初始队伍（每个城镇和城堡有一个领主队伍）
    let lordIdCounter = 1;
    for (const s of state.settlements) {
      if (s.type === 'town' || s.type === 'castle') {
        // 为该地点分配领主（如果还没有）
        const lord = {
          id: 'lord_' + lordIdCounter++,
          name: Utils.choice(GameData.NAMES[s.faction]),
          faction: s.faction,
          homeSettlementId: s.id,
          stat: { str: 8 + Math.floor(rng()*12), agl: 8 + Math.floor(rng()*10), cha: 5 + Math.floor(rng()*12) },
          inventory: [],
          gold: 500 + Math.floor(rng()*2000),
          party: null,
          goal: 'patrol',
          goalTarget: null,
          goalTimer: 0,
          reputation: Math.floor(rng()*50),
        };
        state.factions[s.faction].lords.push(lord.id);
        s.fiefLord = lord.id;
        // 创建领主队伍
        const size = s.type === 'town' ? 20 + Math.floor(rng()*25) : 10 + Math.floor(rng()*15);
        lord.party = createLordParty(lord, s, size, rng);
        state.parties.push(lord.party);
      }
    }

    // 6. 生成商队（每个势力2-3支）
    let carId = 1;
    for (const fid of Object.keys(state.factions)) {
      const n = 2 + Math.floor(rng()*2);
      for (let i = 0; i < n; i++) {
        const homeTown = state.settlements.filter(s => s.type === 'town' && s.faction === fid);
        const home = homeTown[Math.floor(rng()*homeTown.length)];
        if (!home) continue;
        const caravan = {
          id: 'caravan_' + carId++,
          type: 'caravan',
          name: `${home.name}商队`,
          faction: fid,
          x: home.x + (rng()-0.5)*30,
          y: home.y + (rng()-0.5)*30,
          homeId: home.id,
          targetId: null,
          path: [],
          troops: [
            { type: 'caravan_guard', count: 4 + Math.floor(rng()*4) },
            { type: 'mercenary', count: Math.floor(rng()*3) },
          ],
          speed: 35,
          gold: 2000 + Math.floor(rng()*5000),
          goods: {},
          state: 'moving',
          stateTimer: 0,
        };
        // 随机携带商品
        for (let k=0; k<3; k++) {
          const g = Utils.choice(GameData.GOODS);
          caravan.goods[g.id] = (caravan.goods[g.id]||0) + Math.floor(rng()*50) + 10;
        }
        state.parties.push(caravan);
      }
    }

    // 7. 生成劫匪队伍（地图上随机游荡）
    for (let i=0; i<35; i++) {
      const p = {
        id: 'bandit_' + (i+1),
        type: 'bandit',
        name: '劫匪小队',
        faction: 'neutral_bandit',
        x: rng()*MAP_W, y: rng()*MAP_H,
        targetId: null, path: [],
        troops: [{ type: 'wasteland_raider', count: 3 + Math.floor(rng()*6) }],
        speed: 45,
        gold: 50 + Math.floor(rng()*300),
        goods: {},
        state: 'patrol',
        stateTimer: 0,
      };
      // 远离势力中心
      state.parties.push(p);
    }

    // 8. 生成大型劫匪团
    for (let i=0; i<8; i++) {
      const p = {
        id: 'bandit_lord_' + (i+1),
        type: 'bandit_lord',
        name: '劫匪头目',
        faction: 'neutral_bandit',
        x: rng()*MAP_W, y: rng()*MAP_H,
        targetId: null, path: [],
        troops: [
          { type: 'wasteland_raider', count: 10 + Math.floor(rng()*10) },
          { type: 'wasteland_brute', count: 3 + Math.floor(rng()*6) },
        ],
        speed: 40,
        gold: 500 + Math.floor(rng()*2000),
        goods: {},
        state: 'patrol',
        stateTimer: 0,
      };
      state.parties.push(p);
    }

    // 9. 生成玩家初始队伍
    const startTown = state.settlements.find(s => s.type === 'town' && s.faction === 'rhomney') || state.settlements.find(s => s.type === 'town');
    state.parties.push({
      id: 'player',
      type: 'player',
      name: '玩家队伍',
      faction: 'neutral', // 玩家初始为中立
      x: startTown.x + 20,
      y: startTown.y + 20,
      homeId: null,
      targetId: null,
      path: [],
      troops: [
        { type: 'recruit', count: 5 },
      ],
      speed: 45,
      gold: 1000,
      goods: {},
      state: 'idle',
      stateTimer: 0,
    });

    return state;
  }

  function generateGarrison(set, rng) {
    // 根据势力和城镇等级生成守军
    const faction = set.faction;
    const list = [];
    const baseSize = set.type === 'town' ? 40 + Math.floor(rng()*30) : 20 + Math.floor(rng()*20);
    const troopsByFaction = {
      imperial: ['imperial_legionary','imperial_heavy','imperial_cavalry','imperial_archer','recruit'],
      nordia: ['nordia_warrior','nordia_beserker','nordia_jarl','nordia_archer','recruit'],
      vaegir: ['vaegir_raider','vaegir_horse_archer','vaegir_lord','recruit'],
      sultanate: ['sultan_guard','sultan_archer','sultan_infantry','recruit'],
      rhomney: ['rhomney_crossbow','rhomney_mercenary','rhomney_heavy','caravan_guard','recruit'],
      wasteland: ['wasteland_raider','wasteland_brute','wasteland_chief','recruit'],
      neutral: ['caravan_guard','mercenary','recruit','peasant'],
    };
    const pool = troopsByFaction[faction] || troopsByFaction.neutral;
    let remaining = baseSize;
    for (let i = 0; i < 4 && remaining > 0; i++) {
      const type = pool[i];
      const c = Math.max(1, Math.floor(remaining * (i === 0 ? 0.5 : (i === pool.length-1 ? 1 : 0.3))));
      list.push({ type, count: Math.min(remaining, c + Math.floor(rng()*5)) });
      remaining -= Math.min(remaining, c);
    }
    return list.filter(t => t.count > 0);
  }

  function createLordParty(lord, set, size, rng) {
    const troops = generateGarrison(set, rng);
    // 缩小规模为野外队伍
    const scale = size / 50;
    const partyTroops = troops.map(t => ({ type: t.type, count: Math.max(1, Math.floor(t.count * scale * 0.5)) }));
    return {
      id: 'party_lord_' + lord.id,
      lordId: lord.id,
      type: 'lord_party',
      name: lord.name + '的部队',
      faction: lord.faction,
      x: set.x + (rng()-0.5)*30,
      y: set.y + (rng()-0.5)*30,
      homeId: set.id,
      targetId: null,
      path: [],
      troops: partyTroops,
      speed: 40,
      gold: 500 + Math.floor(rng()*1500),
      goods: {},
      state: 'patrol',
      stateTimer: 0,
    };
  }

  function getSettlement(id) { return state.settlements.find(s => s.id === id); }
  function getParty(id) { return state.parties.find(p => p.id === id); }
  function getPlayerParty() { return state.parties.find(p => p.type === 'player'); }

  function getSettlementsNear(x, y, radius) {
    return state.settlements.filter(s => Utils.dist({x,y}, s) <= radius);
  }
  function getPartiesNear(x, y, radius, excludePlayer = true) {
    return state.parties.filter(p => {
      if (excludePlayer && p.type === 'player') return false;
      return Utils.dist({x,y}, p) <= radius;
    });
  }

  // 简单寻路 - 直接朝目标（不使用A*以节省开销，世界为开放地形）
  function movePartyToward(party, targetX, targetY, dt, speedFactor) {
    const dx = targetX - party.x, dy = targetY - party.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return true;
    const speed = (party.speed || 40) * (speedFactor || 1);
    const move = Math.min(d, speed * dt);
    party.x += (dx / d) * move;
    party.y += (dy / d) * move;
    return move >= d - 0.5;
  }

  function captureSettlement(settlementId, newFactionId) {
    const s = getSettlement(settlementId);
    if (!s) return;
    // 从旧势力移除
    const oldFac = state.factions[s.faction];
    if (oldFac) oldFac.territories = (oldFac.territories||[]).filter(id => id !== s.id);
    s.faction = newFactionId;
    const newFac = state.factions[newFactionId];
    if (newFac) (newFac.territories = newFac.territories||[]).push(s.id);
    // 村庄跟随
    for (const vid of s.children) {
      const v = getSettlement(vid);
      if (v) {
        const vOldFac = state.factions[v.faction];
        if (vOldFac) vOldFac.territories = (vOldFac.territories||[]).filter(id => id !== vid);
        v.faction = newFactionId;
        (newFac.territories = newFac.territories||[]).push(vid);
      }
    }
  }

  // 每天结算：收入、随机事件
  function advanceTime(hours) {
    state.day += hours / 24;
    // 每小时更新
    for (const s of state.settlements) {
      // 势力税收简化：每个城镇给势力少量收入
      if (s.type === 'town') {
        const fac = state.factions[s.faction];
        if (fac) fac.gold += s.prosperity * 0.3 * hours;
      }
    }
    // 每天更新商品价格（小幅波动）
    if (state.day % 1 < hours/24) {
      for (const s of state.settlements) {
        if (s.type !== 'town') continue;
        for (const g of GameData.GOODS) {
          const cur = s.supply[g.id] || g.basePrice;
          const delta = (Math.random() - 0.5) * 0.1 * g.basePrice;
          s.supply[g.id] = Math.max(g.basePrice * 0.5, Math.min(g.basePrice * 2, cur + delta));
        }
      }
    }
  }

  function get() { return state; }
  function set(s) { state = s; }

  return {
    generate, getSettlement, getParty, getPlayerParty,
    getSettlementsNear, getPartiesNear, movePartyToward,
    captureSettlement, advanceTime, get, set,
  };
})();
