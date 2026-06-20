// ===== 队伍管理：商队、军团、招募 =====
const Party = (() => {

  function getTroopCount(party) {
    return party.troops.reduce((s, t) => s + t.count, 0);
  }

  function calcPartyStrength(party) {
    let strength = 0;
    for (const t of party.troops) {
      const template = GameData.TROOPS[t.type];
      if (!template) continue;
      strength += (template.atk + template.def + template.hp * 0.2) * t.count;
    }
    return Math.floor(strength);
  }

  function calcPartySpeed(party) {
    // 最慢兵种决定速度，考虑玩家的骑术
    let minSpd = Infinity;
    for (const t of party.troops) {
      const template = GameData.TROOPS[t.type];
      if (!template) continue;
      if (template.spd < minSpd) minSpd = template.spd;
    }
    if (minSpd === Infinity) minSpd = 2.0;
    const ridingBonus = 1 + (Character.get()?.skills?.riding || 0) * 0.02;
    return minSpd * ridingBonus;
  }

  // 招募
  function recruitInTown(town, troopType, count) {
    const player = Character.get();
    const pp = World.getPlayerParty();
    const template = GameData.TROOPS[troopType];
    if (!template) return false;
    if (Character.partySizeLimit() < getTroopCount(pp) + count) {
      Game.toast('队伍已满');
      return false;
    }
    const cost = template.wage * count * 5; // 招募费用 = 周薪 x5
    if (player.gold < cost) {
      Game.toast('金币不足');
      return false;
    }
    // 检查town是否有该兵种的文化
    if (town.faction !== 'neutral' && troopType.startsWith(town.faction.substring(0,3)) === false) {
      // 允许招募，但文化匹配的话有折扣
    }
    player.gold -= cost;
    const existing = pp.troops.find(t => t.type === troopType);
    if (existing) existing.count += count;
    else pp.troops.push({ type: troopType, count });
    Game.toast(`招募 ${count} 名 ${template.name}`);
    return true;
  }

  // 解雇士兵
  function dismissTroop(troopType, count) {
    const pp = World.getPlayerParty();
    const existing = pp.troops.find(t => t.type === troopType);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) pp.troops = pp.troops.filter(t => t.type !== troopType);
    Game.toast(`解雇 ${count} 人`);
    return true;
  }

  // 每日军饷
  function dailyUpkeep() {
    const pp = World.getPlayerParty();
    let total = 0;
    for (const t of pp.troops) {
      const tmpl = GameData.TROOPS[t.type];
      if (tmpl) total += tmpl.upkeep * t.count;
    }
    if (total > 0) {
      const player = Character.get();
      if (player.gold >= total) {
        player.gold -= total;
      } else {
        // 钱不够，士气下降，士兵逃跑
        player.gold = 0;
        Game.toast('军饷不足，部分士兵离队！');
        // 损失10%兵力
        for (const t of pp.troops) t.count = Math.max(0, Math.floor(t.count * 0.9));
        pp.troops = pp.troops.filter(t => t.count > 0);
      }
    }
  }

  // 战斗减员
  function applyCasualties(party, ratio) {
    for (const t of party.troops) {
      t.count = Math.max(0, Math.floor(t.count * (1 - ratio * (0.7 + Math.random() * 0.3))));
    }
    party.troops = party.troops.filter(t => t.count > 0);
  }

  // 合并两个队伍的部队（战后补充）
  function mergeTroops(dst, src) {
    for (const t of src.troops) {
      const e = dst.troops.find(x => x.type === t.type);
      if (e) e.count += t.count;
      else dst.troops.push({ type: t.type, count: t.count });
    }
  }

  return {
    getTroopCount, calcPartyStrength, calcPartySpeed,
    recruitInTown, dismissTroop, dailyUpkeep, applyCasualties, mergeTroops
  };
})();

// ===== 势力系统 =====
const Faction = (() => {

  function getFactionInfo(fid) {
    return World.get().factions[fid];
  }

  function isAtWar(a, b) {
    const fa = getFactionInfo(a);
    if (!fa) return false;
    return (fa.atWar || []).includes(b);
  }

  function isFriendly(a, b) {
    if (a === b) return true;
    const fa = getFactionInfo(a);
    if (!fa) return false;
    return (fa.relations[b] || 0) > 30;
  }

  function declareWar(attacker, defender) {
    const fa = getFactionInfo(attacker);
    const fb = getFactionInfo(defender);
    if (!fa || !fb) return;
    if (!fa.atWar.includes(defender)) fa.atWar.push(defender);
    if (!fb.atWar.includes(attacker)) fb.atWar.push(attacker);
    fa.relations[defender] = Math.min(-30, fa.relations[defender] - 40);
    fb.relations[attacker] = Math.min(-30, fb.relations[attacker] - 40);
  }

  function makePeace(a, b) {
    const fa = getFactionInfo(a);
    const fb = getFactionInfo(b);
    if (!fa || !fb) return;
    fa.atWar = (fa.atWar||[]).filter(x => x !== b);
    fb.atWar = (fb.atWar||[]).filter(x => x !== a);
    fa.relations[b] = Math.max(0, fa.relations[b] + 30);
    fb.relations[a] = Math.max(0, fb.relations[a] + 30);
  }

  function getAllFactionsWithStats() {
    const w = World.get();
    return GameData.FACTIONS.map(f => {
      const info = w.factions[f.id];
      const territories = w.settlements.filter(s => s.faction === f.id);
      const lords = (info?.lords || []).length;
      let totalTroops = 0;
      for (const s of territories) {
        if (s.type !== 'village') totalTroops += (s.garrison||[]).reduce((a,b)=>a+b.count,0);
      }
      for (const p of w.parties) {
        if (p.faction === f.id && p.type === 'lord_party') {
          totalTroops += p.troops.reduce((a,b)=>a+b.count,0);
        }
      }
      return {
        ...f,
        gold: Math.floor(info?.gold || 0),
        territories: territories.length,
        towns: territories.filter(s => s.type === 'town').length,
        castles: territories.filter(s => s.type === 'castle').length,
        villages: territories.filter(s => s.type === 'village').length,
        lords, totalTroops,
        atWar: info?.atWar || [],
        relations: info?.relations || {}
      };
    });
  }

  // 向一个势力效忠（玩家加入）
  let playerFactionId = null;
  function swearAllegiance(fid) {
    if (playerFactionId) {
      Game.toast('你已经效忠势力');
      return false;
    }
    const player = Character.get();
    if ((player.reputation[fid] || 0) < 10) {
      Game.toast('你在该势力中的声望不足（需10）');
      return false;
    }
    playerFactionId = fid;
    const pp = World.getPlayerParty();
    pp.faction = fid;
    Game.toast(`你已向 ${GameData.FACTIONS.find(f=>f.id===fid).name} 效忠！`);
    return true;
  }
  function renounceAllegiance() {
    if (!playerFactionId) return;
    const old = playerFactionId;
    playerFactionId = null;
    const pp = World.getPlayerParty();
    pp.faction = 'neutral';
    Character.addReputation(old, -20);
    Game.toast('你放弃了效忠');
  }
  function getPlayerFaction() { return playerFactionId; }
  function setPlayerFaction(fid) { playerFactionId = fid; }

  // 建立玩家自己的势力
  function establishPlayerKingdom(name, color) {
    const w = World.get();
    const id = 'player_kingdom';
    if (w.factions[id]) return false;
    w.factions[id] = {
      id, name: name || '玩家王国', color: color || '#d4b862',
      culture: '自定义', banner: '★',
      gold: Character.get().gold,
      relations: {}, lords: [], atWar: []
    };
    for (const fid of Object.keys(w.factions)) {
      if (fid !== id) {
        w.factions[id].relations[fid] = 0;
        w.factions[fid].relations[id] = 0;
      }
    }
    playerFactionId = id;
    const pp = World.getPlayerParty();
    pp.faction = id;
    Game.toast(`你建立了 ${name || '玩家王国'}！`);
    return true;
  }

  return {
    getFactionInfo, isAtWar, isFriendly, declareWar, makePeace,
    getAllFactionsWithStats, swearAllegiance, renounceAllegiance,
    getPlayerFaction, setPlayerFaction, establishPlayerKingdom
  };
})();
