// ===== 角色属性与背包 =====
const Character = (() => {
  let player = null;

  function createPlayer(name) {
    player = {
      id: 'player',
      name: name || '无名勇士',
      stats: { str: 12, agl: 12, cha: 10, int: 10 }, // 力量、敏捷、魅力、智力
      level: 1, exp: 0, expNext: 100,
      hp: 100, maxHp: 100,
      gold: 1000,
      renown: 0, // 声望
      honor: 0,
      reputation: {}, // 每个势力的声望 factionId -> (-100 to 100)
      skills: {
        leadership: 1, // 带兵上限
        tactics: 1, // 战斗加成
        trade: 1, // 交易加成
        smithing: 1, // 打造
        riding: 1, // 速度加成
        firstAid: 1, // 战斗后回血
      },
      skillPoints: 3,
      attrPoints: 3,
      equipment: {
        weapon: 'w_sword_1',
        armor: 'a_leather_1',
        head: 'h_leather',
        shield: 's_small',
      },
      flags: { firstDayDone: false },
    };
    for (const f of GameData.FACTIONS) player.reputation[f.id] = 0;
    return player;
  }

  function get() { return player; }
  function set(p) { player = p; }

  function totalAtk() {
    const w = player.equipment.weapon ? GameData.getItem(player.equipment.weapon) : null;
    let atk = player.stats.str * 0.5 + (w?.atk || 0);
    return Math.floor(atk);
  }
  function totalDef() {
    let d = 0;
    for (const slot of ['armor','head','shield']) {
      const it = player.equipment[slot] ? GameData.getItem(player.equipment[slot]) : null;
      if (it) d += it.def || 0;
    }
    d += player.stats.str * 0.2;
    return Math.floor(d);
  }
  function totalMaxHp() {
    let hp = 80 + player.stats.str * 3 + player.level * 10;
    for (const slot of ['armor','head']) {
      const it = player.equipment[slot] ? GameData.getItem(player.equipment[slot]) : null;
      if (it) hp += it.hp || 0;
    }
    return Math.floor(hp);
  }
  function partySizeLimit() { return 10 + player.skills.leadership * 8 + player.level * 2; }

  function gainExp(amt) {
    player.exp += amt;
    while (player.exp >= player.expNext) {
      player.exp -= player.expNext;
      player.level++;
      player.expNext = Math.floor(player.expNext * 1.4);
      player.skillPoints += 2;
      player.attrPoints += 2;
      Game.toast(`升级到 ${player.level} 级！+2属性点 +2技能点`);
    }
  }

  function addReputation(factionId, amt) {
    if (!player.reputation[factionId]) player.reputation[factionId] = 0;
    player.reputation[factionId] = Utils.clamp(player.reputation[factionId] + amt, -100, 100);
  }

  return { createPlayer, get, set, totalAtk, totalDef, totalMaxHp, partySizeLimit, gainExp, addReputation };
})();

// ===== 背包与物品 =====
const Inventory = (() => {
  let items = []; // {id, itemId, qty, equipped: bool}
  let capacity = 50;

  function init() {
    items = [];
    // 初始装备：剑、皮甲、皮盔、小圆盾
    add('w_sword_1', 1);
    add('a_leather_1', 1);
    add('h_leather', 1);
    add('s_small', 1);
    add('g_grain', 20);
    capacity = 50;
  }

  function getAll() { return items; }
  function setAll(arr) { items = arr; }
  function getCapacity() { return capacity; }

  function getByItemId(itemId) { return items.find(i => i.itemId === itemId); }

  function count() {
    return items.reduce((s, i) => s + i.qty, 0);
  }

  function add(itemId, qty = 1) {
    const existing = items.find(i => i.itemId === itemId);
    if (existing) existing.qty += qty;
    else items.push({ uid: Utils.uid(), itemId, qty });
  }

  function remove(itemId, qty = 1) {
    const existing = items.find(i => i.itemId === itemId);
    if (!existing) return false;
    existing.qty -= qty;
    if (existing.qty <= 0) items = items.filter(i => i.itemId !== itemId);
    return true;
  }

  function hasItem(itemId, qty = 1) {
    const existing = items.find(i => i.itemId === itemId);
    return existing && existing.qty >= qty;
  }

  // 装备：将itemId装备到对应slot（同时消耗原装备的标记）
  function equip(itemId) {
    const existing = items.find(i => i.itemId === itemId);
    if (!existing) return false;
    const it = GameData.getItem(itemId);
    if (!it || !it.slot || it.slot === 'goods' || it.slot === 'mats') return false;
    if (it.req && Character.get().level < it.req) {
      Game.toast(`等级不足（需要${it.req}级）`);
      return false;
    }
    const oldItem = Character.get().equipment[it.slot];
    Character.get().equipment[it.slot] = itemId;
    // 更新最大HP
    Character.get().maxHp = Character.totalMaxHp();
    Character.get().hp = Math.min(Character.get().hp, Character.get().maxHp);
    if (oldItem && oldItem !== itemId) {
      // 旧装备已在背包中无需额外处理（它一直未消耗）
    }
    Game.toast(`已装备 ${it.name}`);
    return true;
  }

  function unequip(slot) {
    const cur = Character.get().equipment[slot];
    if (!cur) return;
    Character.get().equipment[slot] = null;
    Character.get().maxHp = Character.totalMaxHp();
    Character.get().hp = Math.min(Character.get().hp, Character.get().maxHp);
  }

  // ============= 打造系统 =============
  const RECIPES = [
    { id: 'r_sword_2', result: 'w_sword_2', cost: { m_steel: 3, m_leather_hide: 2, m_wood: 1 }, gold: 100, req: 2 },
    { id: 'r_sword_3', result: 'w_sword_3', cost: { m_steel: 5, m_gem: 1, m_leather_hide: 3 }, gold: 300, req: 5 },
    { id: 'r_axe_3', result: 'w_axe_3', cost: { m_steel: 6, m_wood: 3 }, gold: 350, req: 5 },
    { id: 'r_mace_3', result: 'w_mace_3', cost: { m_steel: 7, m_wood: 2 }, gold: 400, req: 5 },
    { id: 'r_chain_1', result: 'a_chain_1', cost: { m_steel: 8, m_leather_hide: 4 }, gold: 200, req: 3 },
    { id: 'r_chain_2', result: 'a_chain_2', cost: { m_steel: 12, m_leather_hide: 6, m_gem: 1 }, gold: 500, req: 6 },
    { id: 'r_plate_1', result: 'a_plate_1', cost: { m_steel: 20, m_leather_hide: 5, m_gem: 2 }, gold: 1000, req: 9 },
    { id: 'r_plate_2', result: 'a_plate_2', cost: { m_steel: 30, m_mythril: 3, m_gem: 3 }, gold: 2000, req: 12 },
    { id: 'r_plate_3', result: 'a_plate_3', cost: { m_mythril: 15, m_gem: 8, m_steel: 40 }, gold: 5000, req: 15 },
    { id: 'r_great_helm', result: 'h_great', cost: { m_steel: 10, m_leather_hide: 3 }, gold: 500, req: 7 },
    { id: 'r_kite', result: 's_kite', cost: { m_steel: 6, m_wood: 4 }, gold: 300, req: 5 },
    { id: 'r_tower', result: 's_tower', cost: { m_steel: 12, m_wood: 6 }, gold: 700, req: 8 },
    { id: 'r_bow_2', result: 'w_bow_2', cost: { m_wood: 6, m_leather_hide: 3 }, gold: 150, req: 2 },
    { id: 'r_bow_3', result: 'w_bow_3', cost: { m_wood: 10, m_leather_hide: 5, m_gem: 1 }, gold: 500, req: 6 },
    { id: 'r_crossbow_2', result: 'w_crossbow_2', cost: { m_steel: 5, m_wood: 5 }, gold: 250, req: 4 },
    { id: 'r_pole_3', result: 'w_pole_3', cost: { m_steel: 8, m_wood: 4, m_leather_hide: 2 }, gold: 400, req: 6 },
  ];

  function getRecipes() { return RECIPES; }

  function canCraft(recipe) {
    if (Character.get().skills.smithing < recipe.req) return false;
    if (Character.get().gold < recipe.gold) return false;
    for (const [mid, qty] of Object.entries(recipe.cost)) {
      if (!hasItem(mid, qty)) return false;
    }
    return true;
  }

  function craft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    if (!canCraft(recipe)) {
      Game.toast('材料不足或技能等级不够');
      return false;
    }
    Character.get().gold -= recipe.gold;
    for (const [mid, qty] of Object.entries(recipe.cost)) remove(mid, qty);
    add(recipe.result, 1);
    const resultItem = GameData.getItem(recipe.result);
    Game.toast(`打造成功：${resultItem.name}`);
    Character.gainExp(20);
    return true;
  }

  return {
    init, getAll, setAll, getCapacity, getByItemId, count,
    add, remove, hasItem, equip, unequip,
    getRecipes, canCraft, craft
  };
})();
