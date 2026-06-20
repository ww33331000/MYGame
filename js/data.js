// ===== 游戏静态数据定义 =====
const GameData = (() => {
  // 势力定义
  const FACTIONS = [
    { id: 'imperial', name: '西罗帝国', color: '#c94141', banner: '鹰', culture: '帝国', traits: ['训练有素','重装步兵'], startRel: 0 },
    { id: 'nordia', name: '诺蒂亚王国', color: '#4a86c9', banner: '狼', culture: '北方', traits: ['强壮','耐寒'], startRel: 0 },
    { id: 'vaegir', name: '瓦吉汗国', color: '#86c94a', banner: '豹', culture: '草原', traits: ['擅长骑兵','快速'], startRel: 0 },
    { id: 'sultanate', name: '撒拉逊苏丹国', color: '#c99a4a', banner: '新月', culture: '沙漠', traits: ['精良马军'], startRel: 0 },
    { id: 'rhomney', name: '罗姆尼自由邦', color: '#9a4ac9', banner: '天平', culture: '商业', traits: ['富有','商队'], startRel: 0 },
    { id: 'wasteland', name: '蛮荒部落', color: '#5a4a3a', banner: '骷髅', culture: '部落', traits: ['狂暴','掠夺'], startRel: 0 },
  ];

  // 名字库
  const NAMES = {
    imperial: ['奥古斯都','提比略','卡里古拉','克劳狄','尼禄','伽尔巴','奥托','维特里乌斯','维斯帕先','提图斯','图密善','涅尔瓦','图拉真','哈德良'],
    nordia: ['拉格纳','埃里克','哈拉尔德','克努特','奥拉夫','托尔','比约恩','乌贝','艾瓦','罗洛','贡纳尔','哈康','西古德','英格'],
    vaegir: ['术赤','察合台','窝阔台','拖雷','蒙哥','忽必烈','旭烈兀','拔都','速不台','哲别','木华黎','博尔术','纳牙阿','者勒蔑'],
    sultanate: ['萨拉丁','阿尤布','马穆鲁克','奥斯曼','苏莱曼','巴耶济德','穆拉德','艾哈迈德','优素福','阿卜杜拉','奥马尔','阿里','哈桑','侯赛因'],
    rhomney: ['马可','卢卡','乔瓦尼','洛伦佐','科西莫','皮耶罗','列奥纳多','米开朗基罗','但丁','彼特拉克','薄伽丘','达·芬奇','拉斐尔','多纳泰罗'],
    wasteland: ['赤牙','黑石','断骨','血斧','铁手','碎颅','独眼','双头鹫','食人者','狂嚎','暗矛','野火','雷鸣','毒刺'],
  };
  const VILLAGE_NAMES = ['橡树村','青田庄','白河村','黄石村','黑石村','风车村','枫林渡','芦苇村','松涛庄','荞麦村','梨花村','古井村','月牙村','雾隐村','铁山堡','麦田村','杨柳村','杏花村','稻香庄','青石村','青松岭','红瓦村','翠屏庄','荷塘村','柳荫村','雁归村','鹿鸣庄','凤鸣村','龙腾庄','虎跳村','鱼跃村','鸦巢村','燕归庄','云遮村','日升村','月落庄','星点村','火烧村','水泊村','土坡村','金沙村','银溪村','铜岭村','铁炉村','玉镜村','珍珠村','翡翠岭','玛瑙村','水晶庄','琥珀村','珊瑚村','象牙村','龙骨村','凤凰庄','麒麟村','玄武岭','白虎村','朱雀庄','青龙村'];

  // 兵种树
  const TROOPS = {
    // 通用农民/基础
    recruit: { name: '新兵', type: 'inf', lvl: 1, hp: 40, atk: 8, def: 2, spd: 2.0, wage: 2, upkeep: 1, color: '#9a9a9a' },
    peasant: { name: '农民义勇', type: 'inf', lvl: 2, hp: 50, atk: 10, def: 3, spd: 2.0, wage: 3, upkeep: 1, color: '#8b7355' },
    // 帝国
    imperial_legionary: { name: '帝国军团兵', type: 'inf', lvl: 5, hp: 80, atk: 18, def: 12, spd: 1.8, wage: 8, upkeep: 3, color: '#c94141' },
    imperial_heavy: { name: '帝国重装步兵', type: 'inf', lvl: 8, hp: 120, atk: 24, def: 20, spd: 1.5, wage: 14, upkeep: 5, color: '#a02020' },
    imperial_cavalry: { name: '帝国骑兵', type: 'cav', lvl: 7, hp: 110, atk: 22, def: 10, spd: 3.2, wage: 16, upkeep: 6, color: '#d45555' },
    imperial_archer: { name: '帝国弓兵', type: 'rng', lvl: 6, hp: 65, atk: 20, def: 5, spd: 2.0, wage: 10, upkeep: 3, color: '#e07070', range: 180 },
    // 诺蒂亚
    nordia_warrior: { name: '诺蒂亚战士', type: 'inf', lvl: 5, hp: 90, atk: 20, def: 8, spd: 2.0, wage: 8, upkeep: 3, color: '#4a86c9' },
    nordia_beserker: { name: '狂战士', type: 'inf', lvl: 8, hp: 130, atk: 28, def: 8, spd: 2.2, wage: 15, upkeep: 5, color: '#2060a0' },
    nordia_jarl: { name: '诺蒂亚领主亲兵', type: 'inf', lvl: 10, hp: 160, atk: 32, def: 16, spd: 1.9, wage: 22, upkeep: 7, color: '#103060' },
    nordia_archer: { name: '诺蒂亚猎手', type: 'rng', lvl: 6, hp: 70, atk: 22, def: 6, spd: 2.2, wage: 11, upkeep: 3, color: '#6a96d9', range: 200 },
    // 瓦吉
    vaegir_raider: { name: '瓦吉袭掠者', type: 'cav', lvl: 5, hp: 80, atk: 18, def: 6, spd: 3.6, wage: 10, upkeep: 4, color: '#86c94a' },
    vaegir_horse_archer: { name: '瓦吉骑射手', type: 'cav', lvl: 7, hp: 95, atk: 22, def: 8, spd: 3.4, wage: 16, upkeep: 5, color: '#60a020', range: 160 },
    vaegir_lord: { name: '瓦吉可汗卫队', type: 'cav', lvl: 10, hp: 160, atk: 32, def: 18, spd: 3.2, wage: 25, upkeep: 8, color: '#306010' },
    // 撒拉逊
    sultan_guard: { name: '苏丹马穆鲁克', type: 'cav', lvl: 8, hp: 130, atk: 26, def: 14, spd: 3.0, wage: 18, upkeep: 6, color: '#c99a4a' },
    sultan_archer: { name: '撒拉逊弩手', type: 'rng', lvl: 7, hp: 70, atk: 24, def: 5, spd: 1.9, wage: 12, upkeep: 4, color: '#d4a96a', range: 220 },
    sultan_infantry: { name: '沙漠步兵', type: 'inf', lvl: 6, hp: 90, atk: 20, def: 10, spd: 1.9, wage: 10, upkeep: 3, color: '#a07828' },
    // 罗姆尼
    rhomney_crossbow: { name: '自由邦弩手', type: 'rng', lvl: 6, hp: 65, atk: 22, def: 4, spd: 1.9, wage: 12, upkeep: 3, color: '#9a4ac9', range: 220 },
    rhomney_mercenary: { name: '自由邦雇佣军', type: 'inf', lvl: 6, hp: 90, atk: 20, def: 10, spd: 2.0, wage: 14, upkeep: 4, color: '#8a3ab9' },
    rhomney_heavy: { name: '自由邦重装', type: 'inf', lvl: 8, hp: 125, atk: 25, def: 18, spd: 1.6, wage: 20, upkeep: 6, color: '#6a1a99' },
    // 蛮荒
    wasteland_raider: { name: '蛮荒劫掠者', type: 'inf', lvl: 4, hp: 75, atk: 18, def: 4, spd: 2.4, wage: 5, upkeep: 2, color: '#5a4a3a' },
    wasteland_brute: { name: '蛮荒蛮兵', type: 'inf', lvl: 6, hp: 110, atk: 24, def: 6, spd: 2.2, wage: 10, upkeep: 4, color: '#3a2a1a' },
    wasteland_chief: { name: '蛮荒酋长', type: 'inf', lvl: 8, hp: 150, atk: 30, def: 12, spd: 2.1, wage: 18, upkeep: 6, color: '#1a0a00' },
    // 商队护卫/雇佣兵
    caravan_guard: { name: '商队护卫', type: 'inf', lvl: 3, hp: 65, atk: 14, def: 6, spd: 2.0, wage: 6, upkeep: 2, color: '#c9a961' },
    mercenary: { name: '雇佣兵', type: 'inf', lvl: 5, hp: 85, atk: 18, def: 8, spd: 2.0, wage: 10, upkeep: 3, color: '#d4b862' },
  };

  // 装备类型
  const WEAPON_TYPES = ['剑','斧','锤','长杆','弓','弩','匕首'];
  const ARMOR_TYPES = ['布甲','皮甲','锁甲','板甲'];
  const HEADGEAR = ['皮盔','铁盔','精良头盔','大盔'];
  const SHIELDS = ['小圆盾','方盾','鸢盾','塔盾'];

  // 武器模板
  const WEAPONS = [
    { id: 'w_sword_1', name: '铁剑', type: '剑', atk: 8, spd: 1.0, price: 120, rarity: 'common', req: 0 },
    { id: 'w_sword_2', name: '精钢长剑', type: '剑', atk: 14, spd: 0.95, price: 380, rarity: 'uncommon', req: 3 },
    { id: 'w_sword_3', name: '贵族佩剑', type: '剑', atk: 22, spd: 1.0, price: 1200, rarity: 'rare', req: 6 },
    { id: 'w_sword_4', name: '龙牙巨剑', type: '剑', atk: 38, spd: 0.8, price: 4200, rarity: 'epic', req: 10 },
    { id: 'w_axe_1', name: '战斧', type: '斧', atk: 10, spd: 0.85, price: 150, rarity: 'common', req: 0 },
    { id: 'w_axe_2', name: '双刃斧', type: '斧', atk: 18, spd: 0.8, price: 480, rarity: 'uncommon', req: 3 },
    { id: 'w_axe_3', name: '诺蒂亚巨斧', type: '斧', atk: 30, spd: 0.7, price: 1600, rarity: 'rare', req: 6 },
    { id: 'w_axe_4', name: '雷鸣斧', type: '斧', atk: 44, spd: 0.65, price: 5400, rarity: 'legendary', req: 12 },
    { id: 'w_mace_1', name: '钉头锤', type: '锤', atk: 9, spd: 0.8, price: 140, rarity: 'common', req: 0 },
    { id: 'w_mace_2', name: '重型战锤', type: '锤', atk: 20, spd: 0.7, price: 520, rarity: 'uncommon', req: 3 },
    { id: 'w_mace_3', name: '碎颅者', type: '锤', atk: 32, spd: 0.6, price: 1800, rarity: 'rare', req: 6 },
    { id: 'w_pole_1', name: '长矛', type: '长杆', atk: 10, spd: 0.9, price: 100, rarity: 'common', req: 0 },
    { id: 'w_pole_2', name: '精锐长矛', type: '长杆', atk: 16, spd: 0.9, price: 320, rarity: 'uncommon', req: 3 },
    { id: 'w_pole_3', name: '方天画戟', type: '长杆', atk: 28, spd: 0.8, price: 1400, rarity: 'rare', req: 6 },
    { id: 'w_bow_1', name: '猎弓', type: '弓', atk: 10, spd: 1.1, price: 130, rarity: 'common', req: 0, range: 180 },
    { id: 'w_bow_2', name: '长弓', type: '弓', atk: 16, spd: 1.0, price: 420, rarity: 'uncommon', req: 3, range: 220 },
    { id: 'w_bow_3', name: '精灵之弓', type: '弓', atk: 26, spd: 1.1, price: 1500, rarity: 'rare', req: 6, range: 240 },
    { id: 'w_crossbow_1', name: '轻弩', type: '弩', atk: 12, spd: 0.7, price: 200, rarity: 'common', req: 0, range: 200 },
    { id: 'w_crossbow_2', name: '重弩', type: '弩', atk: 22, spd: 0.6, price: 600, rarity: 'uncommon', req: 4, range: 240 },
    { id: 'w_dagger_1', name: '匕首', type: '匕首', atk: 6, spd: 1.4, price: 60, rarity: 'common', req: 0 },
    { id: 'w_dagger_2', name: '淬毒匕首', type: '匕首', atk: 12, spd: 1.4, price: 260, rarity: 'uncommon', req: 2 },
  ];

  const ARMORS = [
    { id: 'a_cloth_1', name: '布衣', type: '布甲', def: 2, hp: 10, price: 50, rarity: 'common', req: 0 },
    { id: 'a_leather_1', name: '皮甲', type: '皮甲', def: 5, hp: 20, price: 180, rarity: 'common', req: 0 },
    { id: 'a_leather_2', name: '强化皮甲', type: '皮甲', def: 8, hp: 30, price: 380, rarity: 'uncommon', req: 2 },
    { id: 'a_chain_1', name: '锁子甲', type: '锁甲', def: 12, hp: 40, price: 800, rarity: 'uncommon', req: 4 },
    { id: 'a_chain_2', name: '精良锁甲', type: '锁甲', def: 18, hp: 55, price: 1800, rarity: 'rare', req: 7 },
    { id: 'a_plate_1', name: '板甲', type: '板甲', def: 24, hp: 70, price: 3500, rarity: 'rare', req: 10 },
    { id: 'a_plate_2', name: '帝国板甲', type: '板甲', def: 34, hp: 95, price: 7800, rarity: 'epic', req: 13 },
    { id: 'a_plate_3', name: '龙鳞甲', type: '板甲', def: 48, hp: 130, price: 18000, rarity: 'legendary', req: 16 },
  ];

  const HEADGEARS = [
    { id: 'h_leather', name: '皮盔', def: 2, hp: 5, price: 80, rarity: 'common', req: 0 },
    { id: 'h_iron', name: '铁盔', def: 5, hp: 10, price: 240, rarity: 'uncommon', req: 2 },
    { id: 'h_fine', name: '精良头盔', def: 9, hp: 18, price: 700, rarity: 'rare', req: 5 },
    { id: 'h_great', name: '大盔', def: 14, hp: 28, price: 2000, rarity: 'epic', req: 9 },
  ];

  const SHIELDS_ALL = [
    { id: 's_small', name: '小圆盾', def: 4, block: 20, price: 150, rarity: 'common', req: 0 },
    { id: 's_square', name: '方盾', def: 8, block: 30, price: 400, rarity: 'uncommon', req: 3 },
    { id: 's_kite', name: '鸢盾', def: 12, block: 40, price: 900, rarity: 'rare', req: 6 },
    { id: 's_tower', name: '塔盾', def: 18, block: 55, price: 2200, rarity: 'epic', req: 10 },
  ];

  // 商品/交易品（影响商队贸易系统）
  const GOODS = [
    { id: 'g_grain', name: '谷物', basePrice: 8, weight: 2, category: 'food' },
    { id: 'g_meat', name: '鲜肉', basePrice: 20, weight: 2, category: 'food' },
    { id: 'g_fish', name: '咸鱼', basePrice: 15, weight: 2, category: 'food' },
    { id: 'g_wine', name: '酒', basePrice: 40, weight: 2, category: 'food' },
    { id: 'g_salt', name: '盐', basePrice: 25, weight: 1, category: 'luxury' },
    { id: 'g_wool', name: '羊毛', basePrice: 18, weight: 2, category: 'raw' },
    { id: 'g_leather', name: '皮革', basePrice: 22, weight: 2, category: 'raw' },
    { id: 'g_iron', name: '铁锭', basePrice: 35, weight: 3, category: 'raw' },
    { id: 'g_cloth', name: '布匹', basePrice: 28, weight: 1, category: 'raw' },
    { id: 'g_fur', name: '皮毛', basePrice: 45, weight: 1, category: 'luxury' },
    { id: 'g_spice', name: '香料', basePrice: 120, weight: 1, category: 'luxury' },
    { id: 'g_amber', name: '琥珀', basePrice: 180, weight: 1, category: 'luxury' },
    { id: 'g_oil', name: '橄榄油', basePrice: 55, weight: 2, category: 'food' },
    { id: 'g_cheese', name: '奶酪', basePrice: 30, weight: 2, category: 'food' },
    { id: 'g_honey', name: '蜂蜜', basePrice: 50, weight: 1, category: 'luxury' },
  ];

  // 打造材料
  const CRAFT_MATS = [
    { id: 'm_iron_ore', name: '铁矿石', basePrice: 10 },
    { id: 'm_steel', name: '钢锭', basePrice: 40 },
    { id: 'm_wood', name: '木料', basePrice: 8 },
    { id: 'm_leather_hide', name: '生皮', basePrice: 12 },
    { id: 'm_gem', name: '宝石', basePrice: 200 },
    { id: 'm_mythril', name: '秘银', basePrice: 800 },
  ];

  // 任务模板
  const QUEST_TEMPLATES = [
    { type: 'deliver_goods', name: '运送货物', duration: 15, reward: [150, 400], minRep: 0 },
    { type: 'kill_bandits', name: '清剿匪徒', duration: 10, reward: [200, 500], minRep: 0 },
    { type: 'rescue_lord', name: '营救领主', duration: 20, reward: [800, 2000], minRep: 5 },
    { type: 'collect_tax', name: '征收赋税', duration: 10, reward: [300, 800], minRep: 2 },
    { type: 'escort_caravan', name: '护送商队', duration: 12, reward: [250, 700], minRep: 1 },
    { type: 'spy_enemy', name: '刺探敌情', duration: 8, reward: [300, 900], minRep: 3 },
    { type: 'deliver_message', name: '传递信件', duration: 6, reward: [80, 250], minRep: 0 },
    { type: 'hunt_beast', name: '猎杀野兽', duration: 8, reward: [180, 500], minRep: 0 },
    { type: 'forge_alliance', name: '促成联盟', duration: 25, reward: [1200, 3500], minRep: 8 },
  ];

  function getAllItems() {
    return [
      ...WEAPONS.map(w => ({ ...w, slot: 'weapon', kind: 'weapon' })),
      ...ARMORS.map(a => ({ ...a, slot: 'armor', kind: 'armor' })),
      ...HEADGEARS.map(h => ({ ...h, slot: 'head', kind: 'armor' })),
      ...SHIELDS_ALL.map(s => ({ ...s, slot: 'shield', kind: 'armor' })),
      ...GOODS.map(g => ({ ...g, slot: 'goods', kind: 'goods', atk: 0, def: 0, hp: 0, req: 0, rarity: 'common' })),
      ...CRAFT_MATS.map(m => ({ ...m, slot: 'mats', kind: 'mats', atk: 0, def: 0, hp: 0, req: 0, rarity: 'common' })),
    ];
  }

  function getItem(id) {
    return getAllItems().find(x => x.id === id);
  }

  return {
    FACTIONS, NAMES, VILLAGE_NAMES,
    TROOPS, WEAPONS, ARMORS, HEADGEARS, SHIELDS_ALL,
    GOODS, CRAFT_MATS, QUEST_TEMPLATES,
    getAllItems, getItem
  };
})();
