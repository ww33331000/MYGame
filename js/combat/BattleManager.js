// ================================
// 大陆风云 - 战斗管理器
// ================================

export class BattleManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // 战斗状态
    this.state = 'idle'; // idle, active, paused, ended
    this.result = null; // victory, defeat, flee
    
    // 参战单位
    this.allyUnits = [];
    this.enemyUnits = [];
    this.allUnits = [];
    
    // 战斗地图
    this.battleMap = {
      width: 800,
      height: 600,
      terrain: []
    };
    
    // 战斗统计
    this.allyCount = 0;
    this.enemyCount = 0;
    this.round = 0;
    
    // 玩家引用
    this.player = null;
  }
  
  // 开始战斗
  startBattle(player, enemies) {
    this.player = player;
    this.state = 'active';
    this.result = null;
    this.round = 0;
    
    // 初始化友方单位 (玩家)
    this.allyUnits = [{
      id: 'player',
      name: player.name,
      x: 100,
      y: this.battleMap.height / 2,
      hp: player.currentHp,
      maxHp: player.maxHp,
      damage: player.attack,
      defense: player.defense,
      speed: player.speed,
      team: 0,
      state: 'idle',
      attackCooldown: 0
    }];
    
    // 添加玩家的军团单位
    if (player.army && player.army.units.length > 0) {
      for (let i = 0; i < player.army.units.length; i++) {
        const unit = player.army.units[i];
        this.allyUnits.push({
          id: unit.id,
          name: unit.name,
          x: 50 + Math.random() * 50,
          y: 100 + i * 50,
          hp: unit.hp,
          maxHp: unit.maxHp,
          damage: unit.damage,
          defense: unit.defense || 5,
          speed: unit.speed || 80,
          team: 0,
          state: 'idle',
          attackCooldown: 0
        });
      }
    }
    
    // 初始化敌方单位
    this.enemyUnits = [];
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      this.enemyUnits.push({
        id: enemy.id || `enemy_${i}`,
        name: enemy.name || '敌人',
        x: this.battleMap.width - 100,
        y: 100 + i * 50,
        hp: enemy.hp || 50,
        maxHp: enemy.maxHp || 50,
        damage: enemy.damage || 10,
        defense: enemy.defense || 3,
        speed: enemy.speed || 70,
        team: 1,
        state: 'idle',
        attackCooldown: 0
      });
    }
    
    // 合并所有单位
    this.allUnits = [...this.allyUnits, ...this.enemyUnits];
    
    // 更新计数
    this.allyCount = this.allyUnits.length;
    this.enemyCount = this.enemyUnits.length;
    
    // 生成地形
    this.generateTerrain();
  }
  
  // 生成地形
  generateTerrain() {
    const gridSize = 40;
    const cols = Math.ceil(this.battleMap.width / gridSize);
    const rows = Math.ceil(this.battleMap.height / gridSize);
    
    this.battleMap.terrain = [];
    
    for (let y = 0; y < rows; y++) {
      this.battleMap.terrain[y] = [];
      for (let x = 0; x < cols; x++) {
        // 简单随机地形
        const r = Math.random();
        let terrain;
        
        if (r < 0.7) {
          terrain = 'plain'; // 平原
        } else if (r < 0.85) {
          terrain = 'forest'; // 树林 (减速)
        } else {
          terrain = 'rock'; // 岩石 (阻挡)
        }
        
        this.battleMap.terrain[y][x] = {
          type: terrain,
          passable: terrain !== 'rock'
        };
      }
    }
  }
  
  // 更新战斗
  update(dt) {
    if (this.state !== 'active') return;
    
    this.round++;
    
    // 更新所有单位
    for (const unit of this.allUnits) {
      if (unit.hp <= 0) {
        unit.state = 'dead';
        continue;
      }
      
      // 冷却计时
      if (unit.attackCooldown > 0) {
        unit.attackCooldown -= dt;
      }
      
      // 找目标
      const target = this.findTarget(unit);
      
      if (target) {
        const dist = this.distanceTo(unit, target);
        const attackRange = 40;
        
        if (dist <= attackRange) {
          // 攻击
          this.attackUnit(unit, target);
        } else {
          // 移动向目标
          this.moveToward(unit, target, dt);
        }
      }
    }
    
    // 移除死亡单位
    this.allyUnits = this.allyUnits.filter(u => u.hp > 0);
    this.enemyUnits = this.enemyUnits.filter(u => u.hp > 0);
    this.allUnits = [...this.allyUnits, ...this.enemyUnits];
    
    // 更新计数
    this.allyCount = this.allyUnits.length;
    this.enemyCount = this.enemyUnits.length;
    
    // 更新玩家状态
    if (this.player) {
      const playerUnit = this.allyUnits.find(u => u.id === 'player');
      if (playerUnit) {
        this.player.currentHp = playerUnit.hp;
      }
    }
  }
  
  // 找目标
  findTarget(unit) {
    const enemies = unit.team === 0 ? this.enemyUnits : this.allyUnits;
    
    let nearest = null;
    let nearestDist = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      
      const dist = this.distanceTo(unit, enemy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }
  
  // 距离计算
  distanceTo(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  
  // 移动向目标
  moveToward(unit, target, dt) {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 5) return;
    
    // 检查地形
    const terrain = this.getTerrainAt(unit.x + dx / dist * 10, unit.y + dy / dist * 10);
    const speedMod = terrain === 'forest' ? 0.7 : terrain === 'rock' ? 0 : 1;
    
    if (speedMod === 0) return; // 无法通过
    
    const speed = (unit.speed || 80) * speedMod * dt;
    
    unit.x += (dx / dist) * speed;
    unit.y += (dy / dist) * speed;
    
    // 边界检查
    unit.x = Math.max(20, Math.min(this.battleMap.width - 20, unit.x));
    unit.y = Math.max(20, Math.min(this.battleMap.height - 20, unit.y));
    
    unit.state = 'moving';
  }
  
  // 获取地形
  getTerrainAt(x, y) {
    const gridSize = 40;
    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);
    
    if (this.battleMap.terrain[row] && this.battleMap.terrain[row][col]) {
      return this.battleMap.terrain[row][col].type;
    }
    return 'plain';
  }
  
  // 攻击
  attackUnit(attacker, defender) {
    if (attacker.attackCooldown > 0) return;
    
    // 计算伤害
    const baseDamage = attacker.damage || 10;
    const armorReduction = (defender.defense || 0) * 0.5;
    const damage = Math.max(1, Math.floor(baseDamage - armorReduction));
    
    defender.hp -= damage;
    
    // 重置冷却
    attacker.attackCooldown = 1; // 1秒冷却
    
    attacker.state = 'attacking';
    
    // 检查是否死亡
    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.state = 'dead';
    }
  }
  
  // 渲染战斗
  render() {
    const ctx = this.ctx;
    
    // 清空
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制地形
    this.renderTerrain();
    
    // 绘制单位
    this.renderUnits();
    
    // 绘制HP条
    this.renderHPBars();
  }
  
  // 渲染地形
  renderTerrain() {
    const ctx = this.ctx;
    const gridSize = 40;
    
    for (let y = 0; y < this.battleMap.terrain.length; y++) {
      for (let x = 0; x < this.battleMap.terrain[y].length; x++) {
        const terrain = this.battleMap.terrain[y][x];
        
        switch (terrain.type) {
          case 'forest':
            ctx.fillStyle = '#1a3d1a';
            break;
          case 'rock':
            ctx.fillStyle = '#555555';
            break;
          default:
            ctx.fillStyle = '#3d5c3d';
        }
        
        ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        
        // 网格线
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
      }
    }
  }
  
  // 渲染单位
  renderUnits() {
    const ctx = this.ctx;
    
    for (const unit of this.allUnits) {
      if (unit.state === 'dead') continue;
      
      // 单位颜色
      ctx.fillStyle = unit.team === 0 ? '#4488ff' : '#ff4444';
      
      // 单位大小
      const size = 24;
      ctx.fillRect(unit.x - size/2, unit.y - size/2, size, size);
      
      // 方向指示
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(unit.x - 4, unit.y - size/2 - 4, 8, 8);
      
      // 名称
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(unit.name, unit.x, unit.y - size/2 - 12);
    }
  }
  
  // 渲染HP条
  renderHPBars() {
    const ctx = this.ctx;
    
    for (const unit of this.allUnits) {
      if (unit.state === 'dead') continue;
      
      const barWidth = 40;
      const barHeight = 4;
      const x = unit.x - barWidth / 2;
      const y = unit.y - 20;
      
      // 背景
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // HP
      const hpPercent = unit.hp / unit.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffff44' : '#ff4444';
      ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
      
      // 边框
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    }
  }
  
  // 检查战斗是否结束
  isBattleOver() {
    if (this.allyUnits.length === 0) {
      this.result = 'defeat';
      this.state = 'ended';
      return true;
    }
    
    if (this.enemyUnits.length === 0) {
      this.result = 'victory';
      this.state = 'ended';
      return true;
    }
    
    return false;
  }
  
  // 获取战斗结果
  getResult() {
    return this.result;
  }
  
  // 尝试撤退
  attemptFlee() {
    // 撤退需要通过随机判定
    const fleeChance = 0.4;
    
    if (Math.random() < fleeChance) {
      this.result = 'flee';
      this.state = 'ended';
      return true;
    }
    
    return false;
  }
}
