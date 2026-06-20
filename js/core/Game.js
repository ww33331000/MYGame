// ============ 游戏主循环 ============
const Game = {
  canvas: null,
  ctx: null,
  running: false,
  lastTime: 0,
  dt: 0,
  gameTime: 0,       // 游戏内时间（秒）
  dayCount: 1,       // 第几天
  fps: 0,
  world: null,       // 世界数据
  player: null,      // 玩家
  ui: null,          // UI管理器
  worldMap: null,    // 世界地图
  battleMap: null,   // 战斗地图

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    Input.init(this.canvas);
    this.ui = new UIManager();

    StateManager.onStateChange((s) => {
      this.ui.clearPanels();
    });

    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  },

  newGame() {
    this.world = new World();
    this.world.generate();
    this.player = new Player(this.world);
    this.worldMap = new WorldMap(this.world, this.player);
    this.battleMap = new BattleMap();
    this.gameTime = 0;
    this.dayCount = 1;
    StateManager.change(GameState.WORLD_MAP);
    toast('踏上征途！欢迎来到铁骑大陆');
  },

  loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this.loop());

    const now = performance.now();
    this.dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS计算
    this.fps = 1 / this.dt;

    // 更新
    this.update(this.dt);

    // 渲染
    this.render();
  },

  update(dt) {
    if (StateManager.current === GameState.TITLE) return;

    // 游戏内时间流逝（世界地图上每秒 = 游戏内1小时）
    if (StateManager.current === GameState.WORLD_MAP) {
      this.gameTime += dt * 3600; // 1 real sec = 1 game hour
      if (this.gameTime >= this.dayCount * 86400) {
        this.dayCount++;
        this.world.onNewDay(this.dayCount, this.player);
      }
    }

    // 各状态更新
    switch (StateManager.current) {
      case GameState.WORLD_MAP:
        this.worldMap.update(dt);
        break;
      case GameState.BATTLE:
        this.battleMap.update(dt);
        break;
    }

    // UI层更新
    this.ui.update();
  },

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    switch (StateManager.current) {
      case GameState.TITLE:
        this.renderTitle();
        break;
      case GameState.WORLD_MAP:
        this.worldMap.render(ctx);
        break;
      case GameState.SETTLEMENT:
      case GameState.SHOP:
      case GameState.TAVERN:
      case GameState.SMITHY:
        // 定居点也在世界地图上渲染
        if (this.worldMap) this.worldMap.render(ctx);
        break;
      case GameState.BATTLE:
        this.battleMap.render(ctx);
        break;
      case GameState.CHARACTER:
      case GameState.INVENTORY:
      case GameState.PARTY:
      case GameState.QUEST:
      case GameState.FACTION:
      case GameState.DIALOG:
        if (this.worldMap) this.worldMap.render(ctx);
        break;
      case GameState.GAME_OVER:
        this.renderGameOver();
        break;
      case GameState.VICTORY:
        this.renderVictory();
        break;
    }

    // UI层
    this.ui.render(ctx);
  },

  renderTitle() {
    const ctx = this.ctx;
    // 像素背景
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 装饰山脉
    ctx.fillStyle = '#2a2a4a';
    for (let i = 0; i < 8; i++) {
      const x = i * 130;
      const h = 80 + Math.sin(i) * 30;
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 60, 400 - h);
      ctx.lineTo(x + 120, 400);
      ctx.fill();
    }

    // 地面
    ctx.fillStyle = '#3a3a2a';
    ctx.fillRect(0, 400, this.canvas.width, 200);

    // 几个像素人物剪影
    for (let i = 0; i < 5; i++) {
      Utils.drawPixelHuman(ctx, 200 + i * 120, 380, 2, '#222', '#443');
    }
  },

  renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20,5,5,0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#f86868';
    ctx.font = '48px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('你已战死沙场', this.canvas.width / 2, this.canvas.height / 2 - 30);
    ctx.fillStyle = '#b89856';
    ctx.font = '18px "Microsoft YaHei"';
    ctx.fillText('第 ' + this.dayCount + ' 天 · 传奇就此陨落', this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.textAlign = 'left';
  },

  renderVictory() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10,20,10,0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#f4d35e';
    ctx.font = '48px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('统一大陆！', this.canvas.width / 2, this.canvas.height / 2 - 30);
    ctx.fillStyle = '#b89856';
    ctx.font = '18px "Microsoft YaHei"';
    ctx.fillText('用时 ' + this.dayCount + ' 天，一代霸主就此诞生！', this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.textAlign = 'left';
  },

  gameOver() {
    StateManager.change(GameState.GAME_OVER);
    this.ui.clearPanels();
    this.ui.showGameOverPanel();
  },

  victory() {
    StateManager.change(GameState.VICTORY);
    this.ui.clearPanels();
    this.ui.showVictoryPanel();
  },

  getCanvas() { return this.canvas; },
  getCtx() { return this.ctx; }
};
