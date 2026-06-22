// ============ 大地图系统 ============
class WorldMap {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.camera = { x: player.x - 480, y: player.y - 300, w: 960, h: 600 };
    this.viewport = { w: 960, h: 600 };
    this.mouseDrag = { x: 0, y: 0, down: false, startX: 0, startY: 0 };
    this.hoveredSettlement = null;
    this.pendingMove = null;
  }

  update(dt) {
    // 玩家移动
    if (this.player.isMoving) {
      const arrived = this.player.updateMovement(dt);
      if (arrived) {
        // 检查到达位置是否在某个定居点
        const s = this.getSettlementAt(this.player.x, this.player.y, 25);
        if (s) {
          // 打开定居点界面
          this.player.stopMove();
          if (Game.ui) Game.ui.openSettlement(s);
        }
      }
    }

    // 巡逻AI
    this.world.updatePatrols(dt);

    // 更新摄像机跟随
    const targetCamX = this.player.x - this.viewport.w / 2;
    const targetCamY = this.player.y - this.viewport.h / 2;
    this.camera.x = Utils.lerp(this.camera.x, targetCamX, 0.1);
    this.camera.y = Utils.lerp(this.camera.y, targetCamY, 0.1);
    // 限制在陆地边界内
    if (this.world.landBounds) {
      const lb = this.world.landBounds;
      const maxX = Math.max(0, Math.min(this.world.width - this.viewport.w, lb.maxX + 100 - this.viewport.w));
      const maxY = Math.max(0, Math.min(this.world.height - this.viewport.h, lb.maxY + 100 - this.viewport.h));
      const minX = Math.min(this.world.width - this.viewport.w, Math.max(0, lb.minX - 100));
      const minY = Math.min(this.world.height - this.viewport.h, Math.max(0, lb.minY - 100));
      this.camera.x = Utils.clamp(this.camera.x, minX, maxX);
      this.camera.y = Utils.clamp(this.camera.y, minY, maxY);
    } else {
      this.camera.x = Utils.clamp(this.camera.x, 0, this.world.width - this.viewport.w);
      this.camera.y = Utils.clamp(this.camera.y, 0, this.world.height - this.viewport.h);
    }

    // 检查遭遇战
    if (!this.player.isMoving) return;
    const enemies = this.world.checkEncounter(this.player, 20);
    if (enemies.length > 0 && Math.random() < 0.02) {
      const enemy = enemies[0];
      this.player.stopMove();
      Game.ui.openBattle({
        enemies: enemy.units.map(u => u.clone()),
        enemyName: enemy.factionId === 'bandit' ? '强盗部队' : '敌方巡逻',
        onVictory: () => {
          const gold = Utils.randInt(20, 80) * (1 + enemy.units.length);
          this.player.earnGold(gold);
          toast('获得 ' + gold + ' 金币', '#78d878');
          this.player.gainExp(20 + enemy.units.length * 5);
          // 从巡逻列表移除
          const idx = this.world.patrols.indexOf(enemy);
          if (idx >= 0) this.world.patrols.splice(idx, 1);
        }
      });
      return;
    }
    // 随机遭遇
    const rand = this.world.checkRandomBandit(this.player);
    if (rand) {
      this.player.stopMove();
      Game.ui.openBattle({
        enemies: rand.units.map(u => u.clone()),
        enemyName: '流浪强盗',
        onVictory: () => {
          const gold = Utils.randInt(10, 40) * rand.units.length;
          this.player.earnGold(gold);
          toast('获得 ' + gold + ' 金币', '#78d878');
          this.player.gainExp(15 + rand.units.length * 3);
        }
      });
    }
  }

  getSettlementAt(wx, wy, radius) {
    for (const s of this.world.settlements) {
      if (Utils.dist(s.x, s.y, wx, wy) < (radius || 15)) return s;
    }
    return null;
  }

  // 鼠标点击地图（世界坐标）
  onWorldClick(wx, wy) {
    const s = this.getSettlementAt(wx, wy, 20);
    if (s) {
      this.player.startMoveTo(s.x, s.y);
      return true;
    }
    // 检查点击位置是否是陆地
    if (!this.world.isLand(wx, wy)) {
      // 找到最近的陆地作为目标
      const nearest = this.world.findNearestLand(wx, wy, 100);
      this.player.startMoveTo(nearest.x, nearest.y);
      toast('正在向最近的陆地移动...', '#b89856');
      return true;
    }
    this.player.startMoveTo(wx, wy);
    return true;
  }

  screenToWorld(sx, sy) {
    return { x: sx + this.camera.x, y: sy + this.camera.y };
  }

  render(ctx) {
    // 背景 - 区域地图
    this.drawTerrain(ctx);
    // 绘制定居点
    this.world.settlements.forEach(s => {
      if (s.x < this.camera.x - 20 || s.x > this.camera.x + this.viewport.w + 20) return;
      if (s.y < this.camera.y - 20 || s.y > this.camera.y + this.viewport.h + 20) return;
      this.drawSettlement(ctx, s);
    });
    // 绘制巡逻部队（仅显示为红点
    this.world.patrols.forEach(p => this.drawPatrol(ctx, p));
    // 绘制玩家
    this.drawPlayer(ctx);
    // 绘制移动目标标记
    if (this.player.isMoving) {
      ctx.strokeStyle = 'rgba(244,211,94,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.player.targetX - this.camera.x, this.player.targetY - this.camera.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 绘制提示
    if (this.hoveredSettlement) {
      const s = this.hoveredSettlement;
      const sx = s.x - this.camera.x;
      const sy = s.y - this.camera.y;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(sx - 60, sy - 75, 120, 30);
      ctx.fillStyle = '#f4d35e';
      ctx.font = '11px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, sx, sy - 68);
      const f = this.world.getFaction(s.factionId);
      if (f) {
        ctx.fillStyle = f.color;
        ctx.fillText(f.name, sx, sy - 55);
      }
      ctx.textAlign = 'left';
    }
  }

  drawTerrain(ctx) {
    if (!this.world.terrainGrid) {
      // 兼容旧版本
      const grad = ctx.createLinearGradient(0, 0, this.viewport.w, this.viewport.h);
      grad.addColorStop(0, '#4a5a3a');
      grad.addColorStop(1, '#6a7a4a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewport.w, this.viewport.h);
      return;
    }

    // 海洋背景
    ctx.fillStyle = '#1a3a6a';
    ctx.fillRect(0, 0, this.viewport.w, this.viewport.h);
    // 海洋纹理 - 波浪
    ctx.fillStyle = 'rgba(120,180,220,0.15)';
    for (let i = 0; i < 20; i++) {
      const rx = ((i * 311) % (this.viewport.w + 100)) - 50;
      const ry = ((i * 173) % (this.viewport.h + 100)) - 50;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 30, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 计算可见的网格范围
    const startCol = Math.max(0, Math.floor(this.camera.x / this.world.gridSize));
    const endCol = Math.min(this.world.gridCols, Math.ceil((this.camera.x + this.viewport.w) / this.world.gridSize));
    const startRow = Math.max(0, Math.floor(this.camera.y / this.world.gridSize));
    const endRow = Math.min(this.world.gridRows, Math.ceil((this.camera.y + this.viewport.h) / this.world.gridSize));

    // 颜色映射
    const terrainColors = {
      0: null,             // 海洋不绘制（背景已画）
      1: '#6a8a4a',        // 平原
      2: '#3a5a2a',        // 森林
      3: '#7a7a6a',        // 山地
      4: '#9a9a8a'         // 高地
    };

    const gs = this.world.gridSize;
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const t = this.world.terrainGrid[row][col];
        if (t === 0) continue;
        const color = terrainColors[t];
        if (!color) continue;
        const x = col * gs - this.camera.x;
        const y = row * gs - this.camera.y;
        // 抖动颜色变化以增加细节
        const n = this.world.noise2D(col * 13, row * 17);
        const light = 0.85 + n * 0.3;
        const r = parseInt(color.substr(1, 2), 16) * light;
        const g = parseInt(color.substr(3, 2), 16) * light;
        const b = parseInt(color.substr(5, 2), 16) * light;
        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(x, y, gs, gs);
        // 绘制地形特征
        if (t === 2) {
          // 森林 - 树点
          ctx.fillStyle = 'rgba(20,40,10,0.6)';
          ctx.fillRect(x + 4, y + 4, 4, 4);
          ctx.fillRect(x + 14, y + 12, 3, 3);
        } else if (t === 3) {
          // 山地 - 三角
          ctx.fillStyle = 'rgba(80,80,70,0.8)';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 20);
          ctx.lineTo(x + 12, y + 6);
          ctx.lineTo(x + 20, y + 20);
          ctx.fill();
        } else if (t === 4) {
          // 高地 - 雪顶
          ctx.fillStyle = 'rgba(240,240,230,0.8)';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 20);
          ctx.lineTo(x + 12, y + 4);
          ctx.lineTo(x + 20, y + 20);
          ctx.fill();
        }
      }
    }

    // 网格线（仅陆地）
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let r = startRow; r <= endRow; r++) {
      const yy = r * gs - this.camera.y;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(this.viewport.w, yy);
      ctx.stroke();
    }
    for (let c = startCol; c <= endCol; c++) {
      const xx = c * gs - this.camera.x;
      ctx.beginPath();
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, this.viewport.h);
      ctx.stroke();
    }
  }

  drawSettlement(ctx, s) {
    const sx = s.x - this.camera.x;
    const sy = s.y - this.camera.y;
    const faction = this.world.getFaction(s.factionId);
    // 根据类型和颜色绘制
    let color = '#a8a8a8';
    if (faction) color = faction.color;
    // 圆形背景（显示势力色）
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, s.type === 'town' ? 14 : s.type === 'castle' ? 12 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 图标
    Utils.drawPixelIcon(ctx, s.type, sx, sy, 1.2);
    // 名字（仅town和castle显示名字）
    if (s.type !== 'village') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '10px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, sx, sy + 15);
      ctx.textAlign = 'left';
    }
    // 正在围攻标记
    if (s.isSiege) {
      ctx.fillStyle = '#f86868';
      ctx.fillRect(sx + 8, sy - 12, 4, 4);
    }
  }

  drawPatrol(ctx, p) {
    const sx = p.x - this.camera.x;
    const sy = p.y - this.camera.y;
    if (sx < -10 || sx > this.viewport.w + 10) return;
    if (sy < -10 || sy > this.viewport.h + 10) return;
    const faction = this.world.getFaction(p.factionId);
    if (!faction) {
      // 强盗红点
      ctx.fillStyle = '#a82828';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = faction.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }

  drawPlayer(ctx) {
    const sx = this.player.x - this.camera.x;
    const sy = this.player.y - this.camera.y;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 12, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 玩家光环（英雄标志）
    const time = Date.now() / 1000;
    const glow = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = 'rgba(244,211,94,' + (0.2 + glow * 0.15) + ')';
    ctx.beginPath();
    ctx.arc(sx, sy + 2, 14, 0, Math.PI * 2);
    ctx.fill();
    // 角色朝向
    const facing = this.player.isMoving ? (this.player.targetX > this.player.x ? 1 : -1) : 1;
    // 装备可视化
    const eq = this.player.equipment;
    const weapon = eq.weapon ? (eq.weapon.weaponType || 'sword') : 'sword';
    // 头部颜色根据头盔变
    let helmetLevel = 0;
    if (eq.helmet) helmetLevel = eq.helmet.level || 1;
    let armorLevel = 0;
    if (eq.armor) armorLevel = eq.armor.level || 1;
    let shieldLevel = 0;
    if (eq.shield) shieldLevel = eq.shield.level || 1;
    Utils.drawPixelCharacter(ctx, sx, sy + 2, 2.2, {
      isHero: true,
      capeColor: '#f4d35e',
      weapon: weapon,
      helmetLevel: helmetLevel,
      armorLevel: armorLevel,
      shieldLevel: shieldLevel,
      boots: true,
      facing: facing,
      level: this.player.level
    });
    // 名字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText(this.player.name, sx, sy - 18);
    ctx.textAlign = 'left';
  }
}
