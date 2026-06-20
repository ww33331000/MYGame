// ================================
// 大陆风云 - 任务管理器
// ================================

export class QuestManager {
  constructor() {
    this.activeQuests = [];
    this.completedQuests = [];
    this.failedQuests = [];
    
    // 任务模板
    this.questTemplates = this.initializeTemplates();
  }
  
  initializeTemplates() {
    return {
      // 护送任务
      escort: {
        type: 'escort',
        baseReward: { gold: 100, exp: 50 },
        durations: [300, 600, 900], // 5分钟, 10分钟, 15分钟
        distances: [500, 1000, 2000]
      },
      
      // 剿匪任务
      bandit: {
        type: 'bandit',
        baseReward: { gold: 150, exp: 75 },
        enemyCounts: [3, 5, 8],
        enemyTypes: ['强盗', '山贼', '匪徒']
      },
      
      // 贸易任务
      trade: {
        type: 'trade',
        baseReward: { gold: 80, exp: 40 },
        profitMargins: [0.2, 0.35, 0.5]
      },
      
      // 调查任务
      investigate: {
        type: 'investigate',
        baseReward: { gold: 120, exp: 60 },
        clueCounts: [3, 5, 7]
      },
      
      // 竞技任务
      tournament: {
        type: 'tournament',
        baseReward: { gold: 200, exp: 100 },
        rounds: [3, 5, 7]
      },
      
      // 收集任务
      collect: {
        type: 'collect',
        baseReward: { gold: 60, exp: 30 },
        itemTypes: ['矿石', '草药', '皮革', '布料'],
        quantities: [5, 10, 20]
      }
    };
  }
  
  // 生成随机任务
  generateRandomQuest(location, player) {
    if (!location || !player) return null;
    
    // 根据玩家等级和位置类型决定任务类型
    const questTypes = this.getAvailableQuestTypes(location, player);
    const selectedType = questTypes[Math.floor(Math.random() * questTypes.length)];
    
    // 创建任务实例
    const quest = this.createQuest(selectedType, location, player);
    
    return quest;
  }
  
  // 获取可用的任务类型
  getAvailableQuestTypes(location, player) {
    const types = [];
    
    if (location.type === 'town') {
      types.push('escort', 'bandit', 'trade', 'investigate', 'tournament');
    } else if (location.type === 'castle') {
      types.push('bandit', 'collect');
    } else {
      types.push('collect', 'escort');
    }
    
    // 根据玩家等级筛选
    if (player.level < 3) {
      // 低级玩家
      return types.filter(t => ['collect', 'escort'].includes(t));
    }
    
    return types;
  }
  
  // 创建任务
  createQuest(type, location, player) {
    const template = this.questTemplates[type];
    if (!template) return null;
    
    const difficulty = this.calculateDifficulty(player);
    
    const quest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      name: this.generateQuestName(type, location),
      description: this.generateDescription(type, location, difficulty),
      location: location.id,
      locationName: location.name,
      
      // 难度相关
      difficulty: difficulty,
      difficultyLabel: ['简单', '普通', '困难'][difficulty],
      
      // 奖励
      reward: this.calculateReward(template, difficulty),
      
      // 期限 (如果是限时任务)
      timeLimit: this.hasTimeLimit(type) ? template.durations[difficulty] : null,
      startTime: Date.now(),
      
      // 进度
      progress: 0,
      target: this.getTarget(type, difficulty),
      targetCount: this.getTargetCount(type, difficulty),
      
      // 状态
      status: 'active', // active, completed, failed
      
      // 完成后回调
      onComplete: null,
      onFail: null
    };
    
    return quest;
  }
  
  // 计算难度
  calculateDifficulty(player) {
    const level = player.level;
    
    if (level <= 5) return 0; // 简单
    if (level <= 15) return 1; // 普通
    return 2; // 困难
  }
  
  // 计算奖励
  calculateReward(template, difficulty) {
    const multiplier = [1, 1.5, 2][difficulty];
    
    return {
      gold: Math.floor(template.baseReward.gold * multiplier),
      exp: Math.floor(template.baseReward.exp * multiplier)
    };
  }
  
  // 获取目标数量
  getTargetCount(type, difficulty) {
    switch (type) {
      case 'bandit':
        return [3, 5, 8][difficulty];
      case 'collect':
        return [5, 10, 20][difficulty];
      case 'escort':
        return 1;
      case 'tournament':
        return [3, 5, 7][difficulty];
      default:
        return 1;
    }
  }
  
  // 获取目标
  getTarget(type, difficulty) {
    switch (type) {
      case 'bandit':
        return ['强盗', '山贼', '匪徒'][difficulty];
      case 'collect':
        return ['矿石', '草药', '皮革'][Math.floor(Math.random() * 3)];
      case 'escort':
        return '商人';
      case 'trade':
        return '商品';
      case 'investigate':
        return '线索';
      case 'tournament':
        return '对手';
      default:
        return '目标';
    }
  }
  
  // 是否有时间限制
  hasTimeLimit(type) {
    return ['escort', 'trade'].includes(type);
  }
  
  // 生成任务名称
  generateQuestName(type, location) {
    const prefixes = {
      bandit: ['剿灭', '清剿', '扫荡'],
      collect: ['收集', '采集', '获取'],
      escort: ['护送', '保卫', '护卫'],
      trade: ['贸易', '运输', '买卖'],
      investigate: ['调查', '探查', '搜寻'],
      tournament: ['竞技', '比武', '大赛']
    };
    
    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    return `${prefix}${location.name}的${this.getTarget(type, 1)}`;
  }
  
  // 生成描述
  generateDescription(type, location, difficulty) {
    const difficultyText = ['简单', '普通', '困难'][difficulty];
    
    const descriptions = {
      bandit: `在${location.name}附近出现了强盗据点,需要你前往清剿。`,
      collect: `${location.name}的居民需要收集一些${this.getTarget(type, difficulty)}。`,
      escort: `一位商人需要从${location.name}护送到另一个城镇。`,
      trade: `有人想在${location.name}进行一笔贸易,需要你帮忙。`,
      investigate: `${location.name}发生了一些奇怪的事情,需要调查。`,
      tournament: `${location.name}正在举办竞技大赛,邀请你参加。`
    };
    
    return descriptions[type] + ` 难度: ${difficultyText}`;
  }
  
  // 添加任务
  addQuest(quest) {
    if (!quest) return;
    
    this.activeQuests.push(quest);
  }
  
  // 更新任务进度
  updateQuestProgress(questId, progress) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    quest.progress = Math.min(progress, quest.targetCount);
    
    if (quest.progress >= quest.targetCount) {
      this.completeQuest(questId);
    }
  }
  
  // 增加任务进度
  incrementQuestProgress(questId, amount = 1) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    this.updateQuestProgress(questId, quest.progress + amount);
  }
  
  // 完成任务
  completeQuest(questId) {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    
    const quest = this.activeQuests[questIndex];
    quest.status = 'completed';
    
    // 移动到已完成
    this.activeQuests.splice(questIndex, 1);
    this.completedQuests.push(quest);
    
    return quest;
  }
  
  // 任务失败
  failQuest(questId) {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    
    const quest = this.activeQuests[questIndex];
    quest.status = 'failed';
    
    this.activeQuests.splice(questIndex, 1);
    this.failedQuests.push(quest);
  }
  
  // 检查任务时限
  checkQuestTimeouts() {
    const now = Date.now();
    
    for (const quest of this.activeQuests) {
      if (quest.timeLimit) {
        const elapsed = (now - quest.startTime) / 1000; // 秒
        if (elapsed > quest.timeLimit) {
          this.failQuest(quest.id);
        }
      }
    }
  }
  
  // 获取任务摘要
  getQuestSummary() {
    return {
      active: this.activeQuests.length,
      completed: this.completedQuests.length,
      failed: this.failedQuests.length,
      quests: this.activeQuests.map(q => ({
        id: q.id,
        name: q.name,
        type: q.type,
        progress: `${q.progress}/${q.targetCount}`,
        reward: q.reward
      }))
    };
  }
  
  // 序列化
  serialize() {
    return {
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
      failedQuests: this.failedQuests
    };
  }
  
  // 反序列化
  deserialize(data) {
    if (data) {
      this.activeQuests = data.activeQuests || [];
      this.completedQuests = data.completedQuests || [];
      this.failedQuests = data.failedQuests || [];
    }
  }
}
