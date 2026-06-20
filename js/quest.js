// ===== 任务系统 =====
const Quest = (() => {
  let active = [];
  let available = []; // 各地点可领取的任务

  function getAll() { return active; }
  function setAll(arr) { active = arr; }
  function getAvailable() { return available; }

  function getAvailableAt(settlementId) {
    return available.filter(q => q.issuedAt === settlementId && !q.accepted);
  }

  function generateForSettlement(settlement) {
    if (settlement.type === 'village') return;
    const existing = available.filter(q => q.issuedAt === settlement.id);
    // 最多3个
    while (existing.length < 3) {
      const tmpl = Utils.choice(GameData.QUEST_TEMPLATES);
      // 声望检查
      const player = Character.get();
      const rep = player.reputation[settlement.faction] || 0;
      if (rep < tmpl.minRep) continue;
      const q = {
        id: 'q_' + Utils.uid(),
        type: tmpl.type,
        name: tmpl.name,
        template: tmpl,
        issuedAt: settlement.id,
        faction: settlement.faction,
        targetFaction: null,
        targetSettlement: null,
        rewardGold: Utils.randInt(tmpl.reward[0], tmpl.reward[1]),
        rewardRep: 1 + Math.floor(tmpl.reward[1]/300),
        duration: tmpl.duration,
        accepted: false,
        completed: false,
        dayIssued: World.get().day,
        dayDeadline: World.get().day + tmpl.duration,
        // 动态数据
        goodsRequired: null,
        enemiesKilled: 0,
        enemiesRequired: 0,
        delivered: false,
      };
      // 根据任务类型设置目标
      const w = World.get();
      const towns = w.settlements.filter(s => s.type === 'town' && s.id !== settlement.id);
      if (tmpl.type === 'deliver_goods') {
        q.targetSettlement = Utils.choice(towns).id;
        const g = Utils.choice(GameData.GOODS);
        q.goodsRequired = { itemId: g.id, name: g.name, qty: 20 + Math.floor(Math.random()*30) };
      } else if (tmpl.type === 'kill_bandits') {
        q.enemiesRequired = 10 + Math.floor(Math.random()*15);
      } else if (tmpl.type === 'rescue_lord') {
        // 在敌方领地有被俘领主（简化：去某敌对城堡）
        const enemyFac = GameData.FACTIONS.filter(f => Faction.isAtWar(settlement.faction, f.id));
        if (enemyFac.length === 0) continue;
        const f = Utils.choice(enemyFac);
        const castles = w.settlements.filter(s => s.type === 'castle' && s.faction === f.id);
        if (castles.length === 0) continue;
        q.targetSettlement = Utils.choice(castles).id;
        q.targetFaction = f.id;
      } else if (tmpl.type === 'collect_tax') {
        // 去该城镇管辖的几个村庄
        const villages = w.settlements.filter(v => v.parentId === settlement.id || (v.type === 'village' && v.faction === settlement.faction));
        if (villages.length === 0) continue;
        q.targetSettlement = Utils.choice(villages).id;
      } else if (tmpl.type === 'escort_caravan') {
        q.targetSettlement = Utils.choice(towns).id;
      } else if (tmpl.type === 'spy_enemy') {
        const enemyFac = GameData.FACTIONS.filter(f => Faction.isAtWar(settlement.faction, f.id));
        if (enemyFac.length === 0) continue;
        const f = Utils.choice(enemyFac);
        const settles = w.settlements.filter(s => s.faction === f.id);
        if (settles.length === 0) continue;
        q.targetSettlement = Utils.choice(settles).id;
      } else if (tmpl.type === 'deliver_message') {
        q.targetSettlement = Utils.choice(towns).id;
      } else if (tmpl.type === 'hunt_beast') {
        q.enemiesRequired = 3 + Math.floor(Math.random()*5);
      } else if (tmpl.type === 'forge_alliance') {
        // 需要找一个非敌对势力
        const nonEnemy = GameData.FACTIONS.filter(f => f.id !== settlement.faction && !Faction.isAtWar(settlement.faction, f.id));
        if (nonEnemy.length === 0) continue;
        q.targetFaction = Utils.choice(nonEnemy).id;
      }
      available.push(q);
      existing.push(q);
      if (existing.length >= 3) break;
    }
  }

  function refresh() {
    // 清理过期的未领取任务
    const w = World.get();
    available = available.filter(q => !q.accepted && (w.day - q.dayIssued) < 20);
  }

  function accept(qid) {
    const q = available.find(q => q.id === qid);
    if (!q) return false;
    q.accepted = true;
    active.push(q);
    Game.toast(`接取任务：${q.name}`);
    return true;
  }

  function abandon(qid) {
    const idx = active.findIndex(q => q.id === qid);
    if (idx < 0) return false;
    const q = active[idx];
    Character.addReputation(q.faction, -3);
    active.splice(idx, 1);
    Game.toast(`放弃任务：${q.name}`);
    return true;
  }

  // 检查任务完成条件（在关键事件中调用）
  function onSettlementVisited(settlement) {
    const w = World.get();
    for (const q of active) {
      if (q.completed) continue;
      if (q.type === 'deliver_goods' && q.targetSettlement === settlement.id) {
        if (q.goodsRequired && Inventory.hasItem(q.goodsRequired.itemId, q.goodsRequired.qty)) {
          Inventory.remove(q.goodsRequired.itemId, q.goodsRequired.qty);
          q.delivered = true;
          q.completed = true;
          finishQuest(q);
        }
      }
      if (q.type === 'deliver_message' && q.targetSettlement === settlement.id) {
        q.completed = true;
        finishQuest(q);
      }
      if (q.type === 'collect_tax' && q.targetSettlement === settlement.id) {
        q.completed = true;
        finishQuest(q);
      }
      if (q.type === 'escort_caravan' && q.targetSettlement === settlement.id) {
        q.completed = true;
        finishQuest(q);
      }
      if (q.type === 'spy_enemy' && q.targetSettlement === settlement.id) {
        q.completed = true;
        finishQuest(q);
      }
    }
  }

  function onEnemyDefeated(enemyType, enemyCount) {
    for (const q of active) {
      if (q.completed) continue;
      if (q.type === 'kill_bandits' && enemyType === 'bandit') {
        q.enemiesKilled += enemyCount;
        if (q.enemiesKilled >= q.enemiesRequired) {
          q.completed = true;
          finishQuest(q);
        }
      }
      if (q.type === 'hunt_beast' && (enemyType === 'bandit' || enemyType === 'bandit_lord')) {
        q.enemiesKilled += enemyCount;
        if (q.enemiesKilled >= q.enemiesRequired) {
          q.completed = true;
          finishQuest(q);
        }
      }
      if (q.type === 'rescue_lord' && enemyType === 'lord_party') {
        q.completed = true;
        finishQuest(q);
      }
    }
  }

  function finishQuest(q) {
    const player = Character.get();
    player.gold += q.rewardGold;
    Character.addReputation(q.faction, q.rewardRep);
    player.renown += Math.floor(q.rewardGold / 100);
    Character.gainExp(Math.floor(q.rewardGold / 10));
    Game.toast(`任务完成：${q.name} (+${q.rewardGold}金, +${q.rewardRep}声望)`);
  }

  // 每日更新：检查失败
  function dailyUpdate() {
    const w = World.get();
    const failed = [];
    for (const q of active) {
      if (!q.completed && w.day > q.dayDeadline) {
        failed.push(q);
      }
    }
    for (const q of failed) {
      Character.addReputation(q.faction, -5);
      Game.toast(`任务失败：${q.name}`);
      active = active.filter(x => x.id !== q.id);
    }
  }

  return {
    getAll, setAll, getAvailable, getAvailableAt, generateForSettlement,
    refresh, accept, abandon, onSettlementVisited, onEnemyDefeated, dailyUpdate
  };
})();
