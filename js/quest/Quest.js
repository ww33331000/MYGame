// ============ 任务系统 ============
const QuestType = {
  KILL: 'kill',         // 击杀
  DELIVER: 'deliver',   // 送货
  COLLECT: 'collect',       // 收集
  ESCORT: 'escort',         // 护送
  BOUNTY: 'bounty'          // 赏金
};

class Quest {
  constructor(id, type, title, desc, settlement, target, reward, timeLimit) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.desc = desc;
    this.settlementId = settlement ? settlement.id : null;
    this.settlementName = settlement ? settlement.name : '';
    this.target = target;
    this.rewardGold = reward;
    this.timeLimit = timeLimit;
    this.timeRemaining = timeLimit;
    this.accepted = false;
    this.completed = false;
    this.progress = 0;
    this.progressTarget = 1;
  }

  checkProgress() {
    // 由外部调用更新进度
  }
}

class QuestSystem {
  constructor(world) {
    this.world = world;
    this.activeQuests = [];
    this.completedQuests = [];
    this.questCounter = 0;
  }

  generateRandomQuest(settlement) {
    this.questCounter++;
    const types = [QuestType.KILL, QuestType.DELIVER, QuestType.COLLECT, QuestType.BOUNTY];
    const type = Utils.choice(types);
    let title, desc, target = {}, reward = 0, timeLimit = 30;
    const level = Math.max(1, Game.player ? Game.player.level : 1);
    switch (type) {
      case QuestType.KILL:
        const n = Utils.randInt(3, 8);
        title = '清剿盗匪';
        desc = '城镇附近出现了盗匪出没，消灭 ' + n + ' 名强盗以保居民的安宁。';
        target = { count: n, killed: 0 };
        reward = 50 + n * 20 + level * 15;
        timeLimit = 30;
        break;
      case QuestType.DELIVER:
        title = '货物运输';
        const goods = Utils.choice(['cloth', 'grain', 'salt', 'spice', 'fur']);
        const qty = Utils.randInt(3, 8);
        desc = '将 ' + qty + ' 份' + this.getItemName(goods) + ' 送往 ' + settlement.name + '。';
        target = { itemId: goods, qty: qty, settlementId: settlement.id };
        reward = 80 + qty * 15 + level * 10;
        timeLimit = 20;
        break;
      case QuestType.COLLECT:
        title = '材料收集';
        const mat = Utils.choice(['wood', 'iron_ingot', 'leather']);
        const mqty = Utils.randInt(5, 12);
        desc = '收集 ' + mqty + ' 份' + this.getItemName(mat) + ' 并送到 ' + settlement.name + '。';
        target = { itemId: mat, qty: mqty, settlementId: settlement.id };
        reward = 60 + mqty * 12 + level * 10;
        timeLimit = 25;
        break;
      case QuestType.BOUNTY:
        title = '赏金任务';
        const bn = Utils.randInt(5, 12);
        desc = '消灭 ' + bn + ' 名敌方士兵，证明你的实力。';
        target = { count: bn, killed: 0 };
        reward = 100 + bn * 18 + level * 20;
        timeLimit = 40;
        break;
    }
    return new Quest('q_' + this.questCounter, type, title, desc, settlement, target, reward, timeLimit);
  }

  getItemName(id) {
    for (const cat in EquipmentTemplates) {
      const item = EquipmentTemplates[cat].find(i => i.id === id);
      if (item) return item.name;
    }
    return id;
  }

  acceptQuest(quest) {
    quest.accepted = true;
    this.activeQuests.push(quest);
    toast('接受任务：' + quest.title, '#f4d35e');
  }

  // 玩家击败敌人后调用
  onEnemyKilled(enemy) {
    this.activeQuests.forEach(q => {
      if (!q.accepted && q.completed) return;
      if (q.type === QuestType.KILL && !q.completed) {
        q.target.killed = (q.target.killed || 0) + 1;
        q.progress = q.target.killed;
        if (q.progress >= q.target.count) this.completeQuest(q);
      } else if (q.type === QuestType.BOUNTY && !q.completed) {
        q.target.killed = (q.target.killed || 0) + 1;
        q.progress = q.target.killed;
        if (q.progress >= q.target.count) this.completeQuest(q);
      }
    });
  }

  // 玩家到达某个定居点
  onArriveSettlement(settlement, player) {
    this.activeQuests.forEach(q => {
      if (q.completed) return;
      if (q.type === QuestType.DELIVER || q.type === QuestType.COLLECT) {
        if (q.target.settlementId === settlement.id) {
          const have = player.party.getItemCount(q.target.itemId);
          if (have >= q.target.qty) {
            player.party.removeItem(q.target.itemId, q.target.qty);
            this.completeQuest(q);
          }
        }
      }
    });
  }

  completeQuest(quest) {
    quest.completed = true;
    const idx = this.activeQuests.indexOf(quest);
    if (idx >= 0) {
      this.activeQuests.splice(idx, 1);
      this.completedQuests.push(quest);
    }
    if (Game.player) {
      Game.player.earnGold(quest.rewardGold);
      Game.player.gainExp(Math.floor(quest.rewardGold / 5));
      Game.player.reputation += 2;
      toast('任务完成：' + quest.title + ' (+' + quest.rewardGold + '金)', '#78d878');
    }
  }

  abandonQuest(quest) {
    const idx = this.activeQuests.indexOf(quest);
    if (idx >= 0) {
      this.activeQuests.splice(idx, 1);
      Game.player.reputation = Math.max(0, Game.player.reputation - 3);
      toast('放弃任务：' + quest.title, '#b89856');
    }
  }

  tickDay() {
    // 每日检查时间限制
    this.activeQuests.forEach(q => {
      q.timeRemaining--;
      if (q.timeRemaining <= 0) this.abandonQuest(q);
    });
  }
}
