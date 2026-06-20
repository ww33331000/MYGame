// ============ 势力系统 ============
const FactionRelations = {
  ALLY: 100,
  FRIENDLY: 50,
  NEUTRAL: 0,
  HOSTILE: -50,
  AT_WAR: -100
};

class Faction {
  constructor(id, name, color, culture) {
    this.id = id;
    this.name = name;
    this.color = color;        // '#rrggbb'
    this.culture = culture;    // 文化
    this.relations = {};       // factionId -> -100~100
    this.militaryPower = 100; // 军事力量
    this.economy = 50;         // 经济
    this.territoryCount = 0;
    this.isKingdom = true;     // 是否王国
    this.leaderName = Utils.chineseName();
    this.atWarWith = [];
  }

  setRelation(otherId, value) {
    this.relations[otherId] = Utils.clamp(value, -100, 100);
  }

  changeRelation(otherId, delta) {
    const cur = this.relations[otherId] || 0;
    this.setRelation(otherId, cur + delta);
  }

  getRelation(otherId) {
    return this.relations[otherId] || 0;
  }

  isHostile(otherId) {
    return this.getRelation(otherId) < -30;
  }

  isFriendly(otherId) {
    return this.getRelation(otherId) > 30;
  }

  declareWar(otherId) {
    if (!this.atWarWith.includes(otherId)) {
      this.atWarWith.push(otherId);
      this.setRelation(otherId, -100);
    }
  }

  makePeace(otherId) {
    const idx = this.atWarWith.indexOf(otherId);
    if (idx >= 0) this.atWarWith.splice(idx, 1);
    this.setRelation(otherId, 0);
  }
}

// 预定义的8个势力
function createFactions() {
  const factionData = [
    { id: 'empire',    name: '金狮帝国', color: '#d4af37', culture: '帝国' },
    { id: 'kingdom',   name: '苍月王国', color: '#3b5998', culture: '王国' },
    { id: 'confed',    name: '自由联盟', color: '#58a858', culture: '共和' },
    { id: 'horde',     name: '北境部落', color: '#9b4a4a', culture: '部落' },
    { id: 'theocracy', name: '神圣教国', color: '#d4a6d4', culture: '神权' },
    { id: 'republic',  name: '海滨共和国', color: '#4abac8', culture: '商贸' },
    { id: 'duchy',     name: '暗影公国', color: '#6a4a8a', culture: '封建' },
    { id: 'neutral',   name: '中立领地', color: '#a8a8a8', culture: '中立' }
  ];
  const result = [];
  factionData.forEach(d => result.push(new Faction(d.id, d.name, d.color, d.culture)));
  // 设置初始关系
  result.forEach(f => {
    result.forEach(other => {
      if (f.id === other.id) { f.setRelation(other.id, 100); return; }
      if (f.id === 'neutral' || other.id === 'neutral') { f.setRelation(other.id, 0); return; }
      // 随机友好/敌对
      const r = Math.floor(Math.random() * 100) - 40;
      f.setRelation(other.id, r);
    });
  });
  return result;
}
