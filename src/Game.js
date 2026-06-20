import { GameLoop } from './core/GameLoop.js';
import { InputHandler } from './core/InputHandler.js';
import { AudioManager } from './core/AudioManager.js';
import { DataManager } from './data/DataManager.js';
import { SaveManager } from './data/SaveManager.js';
import { WorldMap } from './world/WorldMap.js';
import { Player } from './entity/Player.js';
import { Party } from './entity/Party.js';
import { BattleManager } from './battle/BattleManager.js';
import { UIManager } from './ui/UIManager.js';
import { QuestManager } from './quest/QuestManager.js';

export class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = 'loading';
        this.previousState = null;

        this.gameLoop = null;
        this.input = null;
        this.audio = null;
        this.data = null;
        this.save = null;
        this.world = null;
        this.player = null;
        this.party = null;
        this.battle = null;
        this.ui = null;
        this.quests = null;

        this.day = 1;
        this.lastUpdate = 0;
    }

    async init() {
        this.setupCanvas();
        this.setupEventListeners();

        this.data = new DataManager();
        this.save = new SaveManager();
        this.audio = new AudioManager();
        this.input = new InputHandler(this.canvas);
        this.ui = new UIManager(this);

        await this.data.loadAll();

        this.showScreen('main-menu');
        this.hideScreen('loading-screen');

        this.ui.updateMenuButtons();

        if (this.save.hasSaveData()) {
            document.getElementById('btn-continue').classList.remove('hidden');
        } else {
            document.getElementById('btn-continue').classList.add('hidden');
        }

        this.state = 'menu';
    }

    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.showScreen('character-create');
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.ui.showSettings();
        });

        document.getElementById('btn-confirm-create').addEventListener('click', () => {
            this.startNewGame();
        });

        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.updateAttributePreview(e.target.dataset.bg);
            });
        });

        document.querySelectorAll('.hud-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state === 'hud') {
                    this.ui.showPauseMenu();
                }
            });
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.ui.showPanel(tab);
            });
        });

        document.getElementById('btn-close-inventory')?.addEventListener('click', () => {
            this.ui.hideAllPanels();
        });

        document.getElementById('btn-close-party')?.addEventListener('click', () => {
            this.ui.hideAllPanels();
        });

        document.getElementById('btn-close-quest')?.addEventListener('click', () => {
            this.ui.hideAllPanels();
        });

        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.ui.hidePauseMenu();
        });

        document.getElementById('btn-save')?.addEventListener('click', () => {
            this.saveGame();
            this.ui.hidePauseMenu();
        });

        document.getElementById('btn-load')?.addEventListener('click', () => {
            this.loadGame();
            this.ui.hidePauseMenu();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('btn-attack')?.addEventListener('click', () => {
            if (this.battle) this.battle.playerAttack();
        });

        document.getElementById('btn-defend')?.addEventListener('click', () => {
            if (this.battle) this.battle.playerDefend();
        });

        document.getElementById('btn-special')?.addEventListener('click', () => {
            if (this.battle) this.battle.playerSpecial();
        });

        document.getElementById('btn-flee')?.addEventListener('click', () => {
            if (this.battle) this.battle.playerFlee();
        });
    }

    updateAttributePreview(background) {
        const bonuses = {
            soldier: { str: 2, agi: 1, int: 0, cha: 1 },
            merchant: { str: 0, agi: 1, int: 2, cha: 1 },
            noble: { str: 1, agi: 0, int: 1, cha: 2 },
            peasant: { str: 1, agi: 2, int: 1, cha: 0 }
        };

        const bonus = bonuses[background] || bonuses.soldier;
        document.getElementById('attr-str').textContent = bonus.str >= 0 ? `+${bonus.str}` : bonus.str;
        document.getElementById('attr-agi').textContent = bonus.agi >= 0 ? `+${bonus.agi}` : bonus.agi;
        document.getElementById('attr-int').textContent = bonus.int >= 0 ? `+${bonus.int}` : bonus.int;
        document.getElementById('attr-cha').textContent = bonus.cha >= 0 ? `+${bonus.cha}` : bonus.cha;
    }

    startNewGame() {
        const name = document.getElementById('player-name').value.trim() || '无名旅人';
        const gender = document.querySelector('.gender-btn.selected')?.dataset.gender || 'male';
        const background = document.querySelector('.bg-btn.selected')?.dataset.bg || 'soldier';

        this.player = new Player(name, gender, background);
        this.player.gold = 500;

        this.world = new WorldMap(this.data);
        this.world.generate();

        this.party = new Party('玩家队伍', this.player);
        this.party.position = { x: this.world.startPosition.x, y: this.world.startPosition.y };

        this.quests = new QuestManager(this);

        this.battle = null;

        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD();

        this.state = 'playing';

        this.gameLoop = new GameLoop(this);
        this.gameLoop.start();

        this.showWorldMap();
    }

    loadGame() {
        const saveData = this.save.load();
        if (!saveData) return;

        this.player = new Player(saveData.player.name, saveData.player.gender, 'soldier');
        Object.assign(this.player, saveData.player);

        this.world = new WorldMap(this.data);
        this.world.loadFromData(saveData.world);

        this.party = new Party('玩家队伍', this.player);
        this.party.loadFromData(saveData.party);

        this.quests = new QuestManager(this);
        this.quests.loadFromData(saveData.quests);

        this.day = saveData.day || 1;

        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD();

        this.state = 'playing';

        this.gameLoop = new GameLoop(this);
        this.gameLoop.start();

        this.showWorldMap();
    }

    saveGame() {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            player: this.player.toJSON(),
            world: this.world.toJSON(),
            party: this.party.toJSON(),
            quests: this.quests.toJSON(),
            day: this.day
        };
        this.save.save(saveData);
        this.ui.showNotification('游戏已保存');
    }

    quitToMenu() {
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        this.ui.hideAllScreens();
        this.ui.hideHUD();
        this.showScreen('main-menu');
        this.state = 'menu';
    }

    showScreen(screenId) {
        document.getElementById(screenId)?.classList.remove('hidden');
    }

    hideScreen(screenId) {
        document.getElementById(screenId)?.classList.add('hidden');
    }

    showWorldMap() {
        this.ui.hideAllScreens();
        this.ui.showScreen('world-map');
        this.state = 'world';

        if (this.world) {
            this.world.render();
        }
    }

    showBattle(enemyParty) {
        this.ui.hideAllScreens();
        this.ui.showScreen('battle-screen');
        this.state = 'battle';

        this.battle = new BattleManager(this, this.party, enemyParty);
        this.battle.start();
    }

    endBattle(victory) {
        this.battle = null;
        this.showWorldMap();

        if (victory) {
            this.ui.showNotification('战斗胜利!');
        } else {
            this.ui.showNotification('战斗失败...');
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing' && this.state !== 'world') return;

        if (this.party && this.party.isMoving) {
            this.party.update(deltaTime);

            if (this.party.reachedDestination) {
                this.checkLocationEvents();
            }
        }

        if (this.world) {
            this.world.update(deltaTime);
        }
    }

    render() {
        if (!this.ctx) return;

        this.ctx.fillStyle = '#1a1208';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.world && (this.state === 'world' || this.state === 'playing')) {
            this.world.render(this.ctx, this.canvas);
        }
    }

    checkLocationEvents() {
        if (!this.world || !this.party) return;

        const locations = this.world.getLocationsNear(this.party.position.x, this.party.position.y, 30);

        if (locations.length > 0) {
            const location = locations[0];
            this.ui.showLocationInfo(location);
        }
    }

    advanceDay() {
        this.day++;
        document.getElementById('hud-date').textContent = `第${this.day}天`;

        if (this.party) {
            this.party.morale = Math.min(100, this.party.morale + 5);
        }
    }
}
