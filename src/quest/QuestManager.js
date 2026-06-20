export class QuestManager {
    constructor(game) {
        this.game = game;
        this.activeQuests = [];
        this.availableQuests = [];
        this.completedQuests = [];
        this.questTemplates = [];

        this.loadTemplates();
    }

    loadTemplates() {
        this.questTemplates = [
            {
                id: 'bandit_hunt',
                name: '讨伐强盗',
                description: '在附近的山林中，有一群强盗盘踞。消灭他们。',
                type: 'kill',
                difficulty: 1,
                objectives: [{ type: 'kill', targetType: 'bandit', count: 5 }],
                rewards: { gold: 150, exp: 100, reputation: 5 }
            },
            {
                id: 'escort_caravan',
                name: '商队护送',
                description: '一位商人需要护送他的商队安全抵达目的地。',
                type: 'escort',
                difficulty: 2,
                objectives: [{ type: 'escort', targetType: 'caravan', count: 1 }],
                rewards: { gold: 300, exp: 150, reputation: 10 }
            },
            {
                id: 'deliver_goods',
                name: '货物运送',
                description: '将一批货物从A地点运送到B地点。',
                type: 'deliver',
                difficulty: 1,
                objectives: [{ type: 'deliver', targetType: 'goods', count: 1 }],
                rewards: { gold: 100, exp: 50, reputation: 3 }
            },
            {
                id: 'gather_resources',
                name: '资源采集',
                description: '为城镇收集指定的资源。',
                type: 'gather',
                difficulty: 1,
                objectives: [{ type: 'gather', targetType: 'resources', count: 10 }],
                rewards: { gold: 80, exp: 60, reputation: 2 }
            },
            {
                id: 'capture_castle',
                name: '攻城略地',
                description: '攻占指定的城堡。',
                type: 'capture',
                difficulty: 5,
                objectives: [{ type: 'capture', targetType: 'castle', count: 1 }],
                rewards: { gold: 1000, exp: 500, reputation: 50 }
            }
        ];
    }

    generateRandomQuest(difficulty = 1) {
        const available = this.questTemplates.filter(q => q.difficulty <= difficulty);
        const template = available[Math.floor(Math.random() * available.length)];

        if (!template) return null;

        return {
            ...template,
            id: `${template.id}_${Date.now()}`,
            progress: 0,
            status: 'active'
        };
    }

    addQuest(quest) {
        if (!quest) return;

        if (quest.type === 'main') {
            this.activeQuests.unshift(quest);
        } else {
            this.availableQuests.push(quest);
        }
    }

    acceptQuest(questId) {
        const index = this.availableQuests.findIndex(q => q.id === questId);
        if (index > -1) {
            const quest = this.availableQuests.splice(index, 1)[0];
            quest.status = 'active';
            this.activeQuests.push(quest);
            return true;
        }
        return false;
    }

    abandonQuest(questId) {
        const index = this.activeQuests.findIndex(q => q.id === questId);
        if (index > -1) {
            this.activeQuests.splice(index, 1);
            return true;
        }
        return false;
    }

    completeQuest(questId) {
        const index = this.activeQuests.findIndex(q => q.id === questId);
        if (index > -1) {
            const quest = this.activeQuests.splice(index, 1)[0];
            quest.status = 'completed';
            this.completedQuests.push(quest);

            if (this.game.player && quest.rewards) {
                this.game.player.gold += quest.rewards.gold || 0;
                this.game.player.gainExp(quest.rewards.exp || 0);
            }

            return quest;
        }
        return null;
    }

    updateQuestProgress(questId, progress) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (quest) {
            quest.progress = progress;

            const objective = quest.objectives[0];
            if (objective && quest.progress >= objective.count) {
                this.completeQuest(questId);
            }

            return true;
        }
        return false;
    }

    getActiveQuests() {
        return this.activeQuests;
    }

    getAvailableQuests() {
        return this.availableQuests;
    }

    getCompletedQuests() {
        return this.completedQuests;
    }

    getQuestById(id) {
        return this.activeQuests.find(q => q.id === id) ||
            this.availableQuests.find(q => q.id === id) ||
            this.completedQuests.find(q => q.id === id);
    }

    generateDailyQuests() {
        const playerLevel = this.game.player?.level || 1;
        const difficulty = Math.max(1, Math.floor(playerLevel / 3) + 1);

        const numQuests = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < numQuests; i++) {
            const quest = this.generateRandomQuest(difficulty);
            if (quest) {
                this.addQuest(quest);
            }
        }
    }

    loadFromData(data) {
        this.activeQuests = data.activeQuests || [];
        this.availableQuests = data.availableQuests || [];
        this.completedQuests = data.completedQuests || [];
    }

    toJSON() {
        return {
            activeQuests: this.activeQuests,
            availableQuests: this.availableQuests,
            completedQuests: this.completedQuests
        };
    }
}
