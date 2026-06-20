import { CombatUnit } from './CombatUnit.js';

export class BattleManager {
    constructor(game, playerParty, enemyParty) {
        this.game = game;
        this.playerParty = playerParty;
        this.enemyParty = enemyParty;

        this.phase = 'tactical';
        this.state = 'active';

        this.playerUnits = [];
        this.enemyUnits = [];

        this.battleCanvas = null;
        this.battleCtx = null;
        this.battleWidth = 0;
        this.battleHeight = 0;

        this.selectedUnit = null;
        this.orders = [];

        this.tacticalOrders = {
            player: 'charge',
            enemy: 'charge'
        };

        this.battleTimer = 0;
        this.maxBattleTime = 180000;
    }

    start() {
        this.initBattleUnits();
        this.initBattleRenderer();
        this.startBattleLoop();
    }

    initBattleUnits() {
        const playerPos = { x: 100, y: 300 };
        this.selectedUnit = new CombatUnit('player', this.game.player, playerPos);
        this.selectedUnit.isPlayer = true;
        this.playerUnits.push(this.selectedUnit);

        for (let i = 0; i < this.playerParty.troops.length; i++) {
            const troop = this.playerParty.troops[i];
            for (let j = 0; j < Math.min(troop.count, 10); j++) {
                const pos = {
                    x: 80 + Math.random() * 60,
                    y: 200 + i * 30 + Math.random() * 20
                };
                this.playerUnits.push(new CombatUnit('ally', troop, pos));
            }
        }

        const enemyData = {
            name: '敌军',
            strength: 15,
            armor: 8,
            speed: 22
        };

        for (let i = 0; i < Math.min(this.enemyParty.getTotalCount(), 15); i++) {
            const pos = {
                x: 700 + Math.random() * 60,
                y: 200 + Math.random() * 200
            };
            this.enemyUnits.push(new CombatUnit('enemy', enemyData, pos));
        }
    }

    initBattleRenderer() {
        this.battleCanvas = document.getElementById('battle-canvas');
        if (this.battleCanvas) {
            this.battleCtx = this.battleCanvas.getContext('2d');
            this.battleWidth = window.innerWidth;
            this.battleHeight = window.innerHeight - 100;
            this.battleCanvas.width = this.battleWidth;
            this.battleCanvas.height = this.battleHeight;
        }
    }

    startBattleLoop() {
        this.lastTime = performance.now();
        this.battleLoop();
    }

    battleLoop() {
        if (this.state !== 'active') return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.battleTimer += deltaTime;
        if (this.battleTimer >= this.maxBattleTime) {
            this.endBattleByTime();
            return;
        }

        requestAnimationFrame(() => this.battleLoop());
    }

    update(deltaTime) {
        for (const unit of this.playerUnits) {
            unit.update(deltaTime, this.playerUnits, this.enemyUnits);
        }

        for (const unit of this.enemyUnits) {
            unit.update(deltaTime, this.enemyUnits, this.playerUnits);
        }

        this.checkVictory();
    }

    render() {
        if (!this.battleCtx) return;

        const ctx = this.battleCtx;
        ctx.fillStyle = '#4a5a3a';
        ctx.fillRect(0, 0, this.battleWidth, this.battleHeight);

        ctx.fillStyle = '#3d4d2d';
        for (let x = 0; x < this.battleWidth; x += 50) {
            for (let y = 0; y < this.battleHeight; y += 50) {
                if ((x + y) % 100 === 0) {
                    ctx.fillRect(x, y, 50, 50);
                }
            }
        }

        for (const unit of this.enemyUnits) {
            unit.render(ctx, '#8b0000');
        }

        for (const unit of this.playerUnits) {
            unit.render(ctx, '#1e3a5f');
        }

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Player Units: ${this.playerUnits.length}`, 10, 20);
        ctx.fillText(`Enemy Units: ${this.enemyUnits.length}`, 10, 40);
        ctx.fillText(`Battle Time: ${Math.floor(this.battleTimer / 1000)}s`, 10, 60);
    }

    checkVictory() {
        const playerAlive = this.playerUnits.filter(u => u.isAlive).length;
        const enemyAlive = this.enemyUnits.filter(u => u.isAlive).length;

        if (enemyAlive === 0) {
            this.endBattle('player');
        } else if (playerAlive === 0) {
            this.endBattle('enemy');
        }
    }

    endBattleByTime() {
        const playerAlive = this.playerUnits.filter(u => u.isAlive).length;
        const enemyAlive = this.enemyUnits.filter(u => u.isAlive).length;

        if (playerAlive > enemyAlive) {
            this.endBattle('player');
        } else if (enemyAlive > playerAlive) {
            this.endBattle('enemy');
        } else {
            this.endBattle('draw');
        }
    }

    endBattle(winner) {
        this.state = 'ended';

        if (winner === 'player') {
            const goldReward = Math.floor(Math.random() * 100) + 50;
            this.game.player.gold += goldReward;
            this.game.player.gainExp(50);

            this.game.endBattle(true);
        } else {
            this.game.player.gainExp(10);
            this.game.endBattle(false);
        }
    }

    playerAttack() {
        if (this.selectedUnit && this.selectedUnit.isPlayer) {
            this.selectedUnit.attack();
        }
    }

    playerDefend() {
        if (this.selectedUnit && this.selectedUnit.isPlayer) {
            this.selectedUnit.setDefending(true);
        }
    }

    playerSpecial() {
        if (this.selectedUnit && this.selectedUnit.isPlayer) {
            this.selectedUnit.useSpecial();
        }
    }

    playerFlee() {
        const fleeChance = 0.3 + (this.game.player.attributes.agility * 0.02);
        if (Math.random() < fleeChance) {
            this.endBattle('fled');
        } else {
            this.game.ui.showNotification('撤退失败!');
        }
    }

    issueOrder(order) {
        this.tacticalOrders.player = order;
    }
}
