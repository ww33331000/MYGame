// ================================
// 大陆风云 - 游戏主循环
// ================================

import { WorldGenerator } from '../world/WorldGenerator.js';
import { Player } from '../entity/Player.js';
import { BattleManager } from '../combat/BattleManager.js';
import { QuestManager } from '../quest/QuestManager.js';

export class Game {
  constructor(canvas, input, renderer, saveLoad, audio, uiManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.renderer = renderer;
    this.saveLoad = saveLoad;
    this.audio = audio;
    this.uiManager = uiManager;
    
    // 游戏状态
    this.state = 'menu'; // menu, world, battle, dialog, paused
    this.previousState = null;
    
    // 游戏世界
    this.world = null;
    this.player = null;
    this.battleManager = null;
    this.questManager = null;
    
    // 当前位置
    this.currentLocation = null;
    
    // 地图视图
    this.mapView = false;
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoom = 1;
    
    // 时间
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // 随机种子
    this.seed = Date.now();
  }
  
  // 开始游戏循环
  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }
  
  // 游戏主循环
  loop(currentTime) {
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.update(this.deltaTime);
    this.render();
    
    requestAnimationFrame(this.loop.bind(this));
  }
  
  // 更新游戏逻辑
  update(dt) {
    if (this.state === 'world') {
      this.updateWorld(dt);
    } else if (this.state === 'battle') {
      this.updateBattle(dt);
    }
  }
  
  // 更新世界状态
  updateWorld(dt) {
    // 处理输入
    this.handleWorldInput();
    
    // 更新玩家
    if (this.player) {
      this.player.update(dt, this);
      
      // 更新相机跟随玩家
      this.cameraX = this.player.x - this.canvas.width / 2 / this.zoom;
      this.cameraY = this.player.y - this.canvas.height / 2 / this.zoom;
    }
    
    // 更新UI
    if (typeof window.updateGameUI === 'function') {
      window.updateGameUI();
    }
  }
  
  // 处理世界输入
  handleWorldInput() {
    const speed = 200;
    
    if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) {
      this.player.y -= speed * this.deltaTime;
      this.player.direction = 'up';
    }
    if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) {
      this.player.y += speed * this.deltaTime;
      this.player.direction = 'down';
    }
    if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) {
      this.player.x -= speed * this.deltaTime;
      this.player.direction = 'left';
    }
    if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) {
      this.player.x += speed * this.deltaTime;
      this.player.direction = 'right';
    }
    
    // 边界检查
    const worldSize = 8192;
    this.player.x = Math.max(0, Math.min(worldSize, this.player.x));
    this.player.y = Math.max(0, Math.min(worldSize, this.player.y));
    
    // 点击交互
    if (this.input.isMouseDown()) {
      this.handleMapClick(this.input.mouse.x, this.input.mouse.y);
    }
  }
  
  // 处理地图点击
  handleMapClick(screenX, screenY) {
    // 转换屏幕坐标到世界坐标
    const worldX = screenX / this.zoom + this.cameraX;
    const worldY = screenY / this.zoom + this.cameraY;
    
    // 检查是否点击了地点
    if (this.world) {
      // 检查城镇
      for (const town of this.world.towns) {
        const dist = Math.hypot(worldX - town.x, worldY - town.y);
        if (dist < 50) {
          this.enterLocation(town);
          return;
        }
      }
      
      // 检查城堡
      for (const castle of this.world.castles) {
        const dist = Math.hypot(worldX - castle.x, worldY - castle.y);
        if (dist < 40) {
          this.enterLocation(castle);
          return;
        }
      }
      
      // 检查村庄
      for (const village of this.world.villages) {
        const dist = Math.hypot(worldX - village.x, worldY - village.y);
        if (dist < 30) {
          this.enterLocation(village);
          return;
        }
      }
    }
  }
  
  // 进入地点
  enterLocation(location) {
    this.currentLocation = location.name;
    
    // 显示地点面板
    const panel = document.getElementById('location-panel');
    if (panel) {
      panel.classList.remove('hidden');
      document.getElementById('location-name').textContent = location.name;
      
      let desc = '';
      if (location.type === 'town') {
        desc = `${location.name}是一座繁荣的城镇，人口${location.population}。`;
        if (location.owner) {
          desc += ` 隶属于${location.owner}。`;
        }
      } else if (location.type === 'castle') {
        desc = `${location.name}是一座坚固的城堡，有${location.garrison}名守卫。`;
      } else {
        desc = `${location.name}是一个宁静的村庄，以农业为生。`;
      }
      document.getElementById('location-desc').textContent = desc;
    }
    
    // 与地点NPC对话等
    this.startDialog(location);
  }
  
  // 开始对话
  startDialog(location) {
    const dialogBox = document.getElementById('dialog-box');
    const choices = document.getElementById('dialog-choices');
    
    dialogBox.classList.remove('hidden');
    document.getElementById('dialog-name').textContent = location.name;
    document.getElementById('dialog-message').textContent = `欢迎来到${location.name}，旅人。`;
    
    choices.innerHTML = '';
    
    const options = [
      { text: '我来这里交易', action: () => this.openTrade(location) },
      { text: '我想招募士兵', action: () => this.openRecruit(location) },
      { text: '有什么任务吗？', action: () => this.askForQuest(location) },
      { text: '我只是路过', action: () => this.closeDialog() }
    ];
    
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'dialog-choice';
      btn.textContent = opt.text;
      btn.addEventListener('click', opt.action);
      choices.appendChild(btn);
    });
  }
  
  // 交易
  openTrade(location) {
    this.closeDialog();
    // 简化版：玩家获得金币或物品
    const gain = Math.floor(Math.random() * 100) + 50;
    this.player.gold += gain;
    alert(`你在交易中赚了 ${gain} 金币！`);
  }
  
  // 招募
  openRecruit(location) {
    this.closeDialog();
    if (this.player.gold >= 100) {
      this.player.gold -= 100;
      this.player.addToArmy({
        id: 'soldier_' + Date.now(),
        name: '雇佣兵',
        hp: 50,
        maxHp: 50,
        damage: 10,
        speed: 80
      });
      alert('你招募了一名雇佣兵！');
    } else {
      alert('金币不足！');
    }
  }
  
  // 询问任务
  askForQuest(location) {
    this.closeDialog();
    if (this.questManager && location.type === 'town') {
      const quest = this.questManager.generateRandomQuest(location, this.player);
      if (quest) {
        this.questManager.addQuest(quest);
        alert(`新任务: ${quest.name}`);
      } else {
        alert('目前没有可用的任务。');
      }
    } else {
      alert('这里没有任务。');
    }
  }
  
  // 关闭对话框
  closeDialog() {
    document.getElementById('dialog-box').classList.add('hidden');
  }
  
  // 更新战斗状态
  updateBattle(dt) {
    if (this.battleManager) {
      this.battleManager.update(dt);
      
      // 更新战斗UI
      document.getElementById('battle-enemy-count').textContent = 
        `敌方: ${this.battleManager.enemyCount}`;
      document.getElementById('battle-ally-count').textContent = 
        `我方: ${this.battleManager.allyCount}`;
      
      // 检查战斗结束
      if (this.battleManager.isBattleOver()) {
        this.endBattle();
      }
    }
  }
  
  // 结束战斗
  endBattle() {
    const result = this.battleManager.getResult();
    
    if (result === 'victory') {
      alert('战斗胜利！');
      // 奖励
      const gold = Math.floor(Math.random() * 200) + 100;
      this.player.gold += gold;
      this.player.addExp(50);
      alert(`获得 ${gold} 金币，50 经验！`);
    } else if (result === 'defeat') {
      alert('战斗失败...');
      // 惩罚
      this.player.currentHp = Math.floor(this.player.maxHp / 2);
    } else {
      alert('战斗撤退');
    }
    
    this.battleManager = null;
    this.setState('world');
    document.getElementById('battle-ui').classList.add('hidden');
  }
  
  // 渲染
  render() {
    // 清空画布
    this.renderer.clear('#0a0a15');
    
    if (this.state === 'world' || this.state === 'battle') {
      this.renderWorld();
    }
  }
  
  // 渲染世界
  renderWorld() {
    const ctx = this.ctx;
    
    // 应用相机变换
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);
    
    // 绘制地形背景
    this.renderTerrain();
    
    // 绘制道路
    this.renderRoads();
    
    // 绘制地点
    this.renderLocations();
    
    // 绘制玩家
    this.renderPlayer();
    
    // 绘制UI覆盖物
    this.renderWorldUI();
    
    ctx.restore();
  }
  
  // 渲染地形
  renderTerrain() {
    const ctx = this.ctx;
    const size = 64;
    
    // 简单网格地形
    const startX = Math.floor(this.cameraX / size) * size;
    const startY = Math.floor(this.cameraY / size) * size;
    const endX = startX + this.canvas.width / this.zoom + size * 2;
    const endY = startY + this.canvas.height / this.zoom + size * 2;
    
    for (let y = startY; y < endY; y += size) {
      for (let x = startX; x < endX; x < endX; x += size) {
        // 基于位置生成地形颜色
        const noise = this.noise(x * 0.01, y * 0.01);
        let color;
        
        if (noise < 0.3) {
          color = '#3d5c3d'; // 森林
        } else if (noise < 0.6) {
          color = '#4a7c4a'; // 草地
        } else if (noise < 0.8) {
          color = '#8b7355'; // 土路
        } else {
          color = '#5c5c5c'; // 山地
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        
        // 网格线
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(x, y, size, size);
      }
    }
  }
  
  // 简单的噪声函数
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  
  // 渲染道路
  renderRoads() {
    if (!this.world || !this.world.roads) return;
    
    const ctx = this.ctx;
    ctx.strokeStyle = '#6b5344';
    ctx.lineWidth = 8;
    ctx.setLineDash([]);
    
    for (const road of this.world.roads) {
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
    }
  }
  
  // 渲染地点
  renderLocations() {
    if (!this.world) return;
    
    const ctx = this.ctx;
    
    // 渲染城镇
    for (const town of this.world.towns) {
      this.drawLocation(town, 40, '#c9a227', '城');
    }
    
    // 渲染城堡
    for (const castle of this.world.castles) {
      this.drawLocation(castle, 32, '#8b4513', '堡');
    }
    
    // 渲染村庄
    for (const village of this.world.villages) {
      this.drawLocation(village, 24, '#228b22', '村');
    }
  }
  
  // 绘制单个地点
  drawLocation(loc, size, color, label) {
    const ctx = this.ctx;
    
    // 绘制边框
    ctx.fillStyle = color;
    ctx.fillRect(loc.x - size/2, loc.y - size/2, size, size);
    
    // 绘制标签
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, loc.x, loc.y);
    
    // 绘制名称
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(loc.name, loc.x, loc.y + size/2 + 10);
  }
  
  // 渲染玩家
  renderPlayer() {
    if (!this.player) return;
    
    const ctx = this.ctx;
    const size = 24;
    
    // 玩家身体
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(this.player.x - size/2, this.player.y - size/2, size, size);
    
    // 方向指示
    ctx.fillStyle = '#ffffff';
    let dx = 0, dy = 0;
    switch (this.player.direction) {
      case 'up': dy = -size/2; break;
      case 'down': dy = size/2; break;
      case 'left': dx = -size/2; break;
      case 'right': dx = size/2; break;
    }
    ctx.fillRect(this.player.x + dx - 4, this.player.y + dy - 4, 8, 8);
    
    // 玩家名称
    ctx.fillStyle = '#ffd700';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(this.player.name, this.player.x, this.player.y - size/2 - 8);
  }
  
  // 渲染世界UI
  renderWorldUI() {
    // 缩放提示
    if (this.zoom !== 1) {
      const ctx = this.ctx;
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(`缩放: ${this.zoom}x`, 10, 20);
    }
  }
  
  // 设置游戏状态
  setState(newState) {
    this.previousState = this.state;
    this.state = newState;
  }
  
  // 切换地图视图
  toggleMapView() {
    this.mapView = !this.mapView;
    if (this.mapView) {
      this.zoom = 0.3;
    } else {
      this.zoom = 1;
    }
  }
  
  // 开始新游戏
  startNewGame(playerName, difficulty) {
    // 生成世界
    const worldGen = new WorldGenerator(this.seed);
    this.world = worldGen.generate();
    this.world.day = 1;
    
    // 创建玩家
    this.player = new Player(playerName);
    this.player.x = this.world.towns[0].x;
    this.player.y = this.world.towns[0].y;
    
    // 应用难度
    this.applyDifficulty(difficulty);
    
    // 创建战斗管理器
    this.battleManager = new BattleManager(this.canvas, this.ctx);
    
    // 创建任务管理器
    this.questManager = new QuestManager();
    
    // 初始化相机
    this.cameraX = this.player.x - this.canvas.width / 2;
    this.cameraY = this.player.y - this.canvas.height / 2;
  }
  
  // 应用难度
  applyDifficulty(difficulty) {
    switch (difficulty) {
      case 'easy':
        this.player.gold = 1000;
        this.player.maxHp = 150;
        break;
      case 'hard':
        this.player.gold = 200;
        this.player.maxHp = 80;
        break;
      default:
        // normal
        this.player.gold = 500;
        this.player.maxHp = 100;
    }
    this.player.currentHp = this.player.maxHp;
    this.player.currentStamina = this.player.maxStamina;
  }
  
  // 保存游戏
  saveCurrentGame(slot) {
    const saveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      player: this.player,
      world: this.world,
      state: this.state,
      difficulty: this.difficulty
    };
    this.saveLoad.save(slot, saveData);
  }
  
  // 加载游戏
  loadGame(data) {
    this.player = data.player;
    this.world = data.world;
    this.state = data.state;
    this.difficulty = data.difficulty;
    this.questManager = new QuestManager();
    this.battleManager = new BattleManager(this.canvas, this.ctx);
    
    // 恢复相机位置
    this.cameraX = this.player.x - this.canvas.width / 2;
    this.cameraY = this.player.y - this.canvas.height / 2;
  }
  
  // 触发战斗
  triggerBattle(enemies) {
    this.battleManager.startBattle(this.player, enemies);
    this.setState('battle');
    document.getElementById('battle-ui').classList.remove('hidden');
  }
}
