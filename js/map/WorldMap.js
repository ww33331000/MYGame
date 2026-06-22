// ============ 大地图系统 v2 ============
// 参考骑马与砍杀布局：玩家居中、HUD顶部、小地图右下、势力分区显示
class WorldMap {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    // 视口尺寸（1440x900）
    this.viewport = { w: 1440, h: 900 };
    this.camera = {
      x: player.x - this.viewport.w / 2,
      y: player.y - this.viewport.h / 2
    };
    this.mouseDrag = { x: 0, y: 0, down: false };
    this.hoveredSettlement = null;
    this.pendingMove = null;
    // 小地图参数
    this.minimap = {
      w: 220, h: 165,
      x: this.viewport.w - 230,
      y: this.viewport.h - 175
    };
    this.animationTime = 0;
  }

  update(dt) {
    this.animationTime += dt;
    // 玩家移动
    if (this.player.isMoving) {
      const arrived = this.player.updateMovement(dt);
      if (arrived) {
        const s = this.getSettlementAt(this.player.x, this.player.y, 25);
        if (s) {
          this.player.stopMove();
          if (Game.ui) Game.ui.openSettlement(s);
        }
      }
    }
    // 巡逻AI
    this.world.updatePatrols(dt);
    // 摄像机跟随（平滑）
    const targetCamX = this.player.x - this.viewport.w / 2;
    const targetCamY = this.player.y - this.viewport.h / 2;
    this.camera.x = Utils.lerp(this.camera.x, targetCamX, 0.08);
    this.camera.y = Utils.lerp(this.camera.y, targetCamY, 0.08);
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
    // 遭遇检测
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
          const idx = this.world.patrols.indexOf(enemy);
          if (idx >= 0) this.world.patrols.splice(idx, 1);
        }
      });
      return;
    }
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

  onWorldClick(wx, wy) {
    const s = this.getSettlementAt(wx, wy, 20);
    if (s) {
      this.player.startMoveTo(s.x, s.y);
      return true;
    }
    if (!this.world.isLand(wx, wy)) {
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
    // ---- 地形 ----
    this.drawTerrain(ctx);
    // ---- 据点 ----
    this.world.settlements.forEach(s => {
      if (s.x < this.camera.x - 20 || s.x > this.camera.x + this.viewport.w + 20) return;
      if (s.y < this.camera.y - 20 || s.y > this.camera.y + this.viewport.h + 20) return;
      this.drawSettlement(ctx, s);
    });
    // ---- 巡逻部队 ----
    this.world.patrols.forEach(p => this.drawPatrol(ctx, p));
    // ---- 玩家 ----
    this.drawPlayer(ctx);
    // ---- 移动目标标记 ----
    if (this.player.isMoving) {
      const tx = this.player.targetX - this.camera.x;
      const ty = this.player.targetY - this.camera.y;
      ctx.strokeStyle = 'rgba(244,211,94,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244,211,94,0.3)';
      ctx.beginPath();
      ctx.arc(tx, ty, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    // ---- 势力分区半透明叠加 ----
    this.drawFactionZones(ctx);
    // ---- 骑砍风格 HUD ----
    this.drawHUD(ctx);
    // ---- 小地图 ----
    this.drawMinimap(ctx);
    // ---- 提示 ----
    if (this.hoveredSettlement) {
      const s = this.hoveredSettlement;
      const sx = s.x - this.camera.x;
      const sy = s.y - this.camera.y;
      ctx.fillStyle = 'rgba(0,0,0,0.88)';
      ctx.fillRect(sx - 80, sy - 80, 160, 36);
      ctx.strokeStyle = '#8a7a3e';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 80, sy - 80, 160, 36);
      ctx.fillStyle = '#f4d35e';
      ctx.font = 'bold 13px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, sx, sy - 65);
      const f = this.world.getFaction(s.factionId);
      if (f) {
        ctx.fillStyle = f.color;
        ctx.font = '11px "Microsoft YaHei"';
        ctx.fillText(f.name + ' · ' + this.getTypeName(s.type), sx, sy - 51);
      }
      ctx.textAlign = 'left';
    }
  }

  getTypeName(t) {
    if (t === 'town') return '城镇';
    if (t === 'castle') return '城堡';
    return '村庄';
  }

  // ===== 势力分区着色 =====
  drawFactionZones(ctx) {
    // 为每个势力绘制半透明势力范围
    const zone = this.world.factionZones;
    if (!zone) return;
    const nonNeutral = this.world.factions.filter(f => f.id !== 'neutral');
    nonNeutral.forEach(f => {
      const z = zone[f.id];
      if (!z) return;
      // 势力范围椭圆（屏幕坐标）
      const cx = z.cx - this.camera.x;
      const cy = z.cy - this.camera.y;
      const rx = z.radius;
      const ry = z.radius * (this.viewport.w / this.world.width);
      // 半透明势力色
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
  }

  // ===== 骑砍风格 HUD =====
  drawHUD(ctx) {
    // 顶部信息栏（模仿骑砍）
    const hudY = 8;
    const hudH = 42;
    ctx.fillStyle = 'rgba(12,12,24,0.88)';
    ctx.fillRect(0, hudY, this.viewport.w, hudH);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, hudY, this.viewport.w, hudH);

    // 左侧：玩家信息
    ctx.fillStyle = '#f4d35e';
    ctx.font = 'bold 16px "Microsoft YaHei"';
    ctx.fillText(this.player.name, 14, hudY + 27);
    ctx.fillStyle = '#b89856';
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillText('Lv' + this.player.level + ' · 第 ' + Game.dayCount + ' 天', 14, hudY + 40);

    // 中间：时间和地点
    const hours = Math.floor(Game.gameTime / 3600) % 24;
    const timeStr = (hours < 10 ? '0' : '') + hours + ':00';
    const terrainNames = { 0: '海洋', 1: '平原', 2: '森林', 3: '山地', 4: '高地' };
    const terrain = this.world.getTerrain(this.player.x, this.player.y);
    ctx.fillStyle = '#d0d0d8';
    ctx.font = '14px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr + ' · ' + (terrainNames[terrain] || '平原'), this.viewport.w / 2, hudY + 26);

    // 当前所在据点
    const nearSettlement = this.getNearestSettlement(this.player.x, this.player.y);
    if (nearSettlement) {
      ctx.fillStyle = '#b89856';
      ctx.font = '11px "Microsoft YaHei"';
      ctx.fillText('📍 ' + nearSettlement.name, this.viewport.w / 2, hudY + 40);
    }
    ctx.textAlign = 'left';

    // 右侧：资源
    ctx.fillStyle = '#f4d35e';
    ctx.font = 'bold 14px "Microsoft YaHei"';
    ctx.textAlign = 'right';
    ctx.fillText('💰 ' + this.player.party.gold, this.viewport.w - 14, hudY + 22);
    ctx.fillStyle = '#b89856';
    ctx.font = '11px "Microsoft YaHei"';
    ctx.fillText('部队 ' + this.player.party.members.length + ' 人', this.viewport.w - 14, hudY + 37);
    ctx.textAlign = 'left';

    // 底部信息栏（简化）
    const botY = this.viewport.h - 38;
    ctx.fillStyle = 'rgba(12,12,24,0.85)';
    ctx.fillRect(0, botY, this.viewport.w, 38);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, botY, this.viewport.w, 38);

    // 左下：控制提示
    ctx.fillStyle = '#888';
    ctx.font = '11px "Microsoft YaHei"';
    ctx.fillText('左键点击移动 · 右键缩放 · 滚轮缩放', 14, botY + 24);

    // 右下：坐标
    ctx.textAlign = 'right';
    ctx.fillText('世界坐标: (' + Math.floor(this.player.x) + ', ' + Math.floor(this.player.y) + ')', this.viewport.w - 14, botY + 24);
    ctx.textAlign = 'left';
  }

  getNearestSettlement(x, y) {
    let nearest = null, minD = Infinity;
    this.world.settlements.forEach(s => {
      const d = Utils.dist(s.x, s.y, x, y);
      if (d < minD) { minD = d; nearest = s; }
    });
    return minD < 80 ? nearest : null;
  }

  // ===== 小地图 =====
  drawMinimap(ctx) {
    const mm = this.minimap;
    // 背景
    ctx.fillStyle = 'rgba(10,15,30,0.92)';
    ctx.fillRect(mm.x, mm.y, mm.w, mm.h);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(mm.x, mm.y, mm.w, mm.h);
    // 标题
    ctx.fillStyle = '#8a7a3e';
    ctx.font = 'bold 11px "Microsoft YaHei"';
    ctx.fillText('大 陆 地 图', mm.x + 8, mm.y + 14);

    // 缩放比例
    const scaleX = mm.w / this.world.width;
    const scaleY = (mm.h - 20) / this.world.height;

    // 绘制地形（简化）
    const terrainColors = { 0: '#1a3a6a', 1: '#6a8a4a', 2: '#3a5a2a', 3: '#7a7a6a', 4: '#9a9a8a' };
    const step = 3; // 每3个格子画一个像素
    for (let row = 0; row < this.world.gridRows; row += step) {
      for (let col = 0; col < this.world.gridCols; col += step) {
        const t = this.world.terrainGrid[row][col];
        const color = terrainColors[t] || '#1a3a6a';
        const px = mm.x + col * scaleX;
        const py = mm.y + 18 + row * scaleY;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      }
    }

    // 绘制据点
    this.world.settlements.forEach(s => {
      const faction = this.world.getFaction(s.factionId);
      const color = faction ? faction.color : '#888';
      const px = mm.x + s.x * scaleX;
      const py = mm.y + 18 + s.y * scaleY;
      const r = s.type === 'town' ? 3 : s.type === 'castle' ? 2 : 1.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 绘制巡逻队
    this.world.patrols.forEach(p => {
      const px = mm.x + p.x * scaleX;
      const py = mm.y + 18 + p.y * scaleY;
      ctx.fillStyle = '#f86868';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 绘制玩家位置（黄色闪烁点）
    const ppx = mm.x + this.player.x * scaleX;
    const ppy = mm.y + 18 + this.player.y * scaleY;
    const pulse = (Math.sin(this.animationTime * 4) + 1) / 2;
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath();
    ctx.arc(ppx, ppy, 3 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 绘制当前视口框
    const vx = mm.x + this.camera.x * scaleX;
    const vy = mm.y + 18 + this.camera.y * scaleY;
    const vw = this.viewport.w * scaleX;
    const vh = this.viewport.h * scaleY;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);

    // 小地图边框
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(mm.x, mm.y, mm.w, mm.h);
  }

  drawTerrain(ctx) {
    if (!this.world.terrainGrid) {
      ctx.fillStyle = '#3a5a3a';
      ctx.fillRect(0, 0, this.viewport.w, this.viewport.h);
      return;
    }

    // 海洋背景
    ctx.fillStyle = '#1a3a6a';
    ctx.fillRect(0, 0, this.viewport.w, this.viewport.h);

    // 波浪效果
    ctx.fillStyle = 'rgba(120,180,220,0.12)';
    for (let i = 0; i < 30; i++) {
      const rx = ((i * 317 + this.animationTime * 10) % (this.viewport.w + 80)) - 40;
      const ry = ((i * 197) % (this.viewport.h + 60)) - 30;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 可见网格范围
    const startCol = Math.max(0, Math.floor(this.camera.x / this.world.gridSize));
    const endCol = Math.min(this.world.gridCols, Math.ceil((this.camera.x + this.viewport.w) / this.world.gridSize));
    const startRow = Math.max(0, Math.floor(this.camera.y / this.world.gridSize));
    const endRow = Math.min(this.world.gridRows, Math.ceil((this.camera.y + this.viewport.h) / this.world.gridSize));

    const terrainColors = {
      0: null,
      1: '#6a8a4a',
      2: '#3a5a2a',
      3: '#7a7a6a',
      4: '#9a9a8a'
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
        const n = this.world.noise2D(col * 13, row * 17);
        const light = 0.82 + n * 0.36;
        const r = parseInt(color.substr(1, 2), 16) * light;
        const g = parseInt(color.substr(3, 2), 16) * light;
        const b = parseInt(color.substr(5, 2), 16) * light;
        ctx.fillStyle = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')';
        ctx.fillRect(x, y, gs, gs);

        // 地形细节
        if (t === 2) {
          ctx.fillStyle = 'rgba(20,50,10,0.55)';
          ctx.fillRect(x + 4, y + 4, 4, 4);
          ctx.fillRect(x + 14, y + 12, 3, 3);
        } else if (t === 3) {
          ctx.fillStyle = 'rgba(80,80,70,0.75)';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 20);
          ctx.lineTo(x + 12, y + 6);
          ctx.lineTo(x + 20, y + 20);
          ctx.fill();
        } else if (t === 4) {
          ctx.fillStyle = 'rgba(240,240,230,0.8)';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 20);
          ctx.lineTo(x + 12, y + 4);
          ctx.lineTo(x + 20, y + 20);
          ctx.fill();
        }
      }
    }
  }

  drawSettlement(ctx, s) {
    const sx = s.x - this.camera.x;
    const sy = s.y - this.camera.y;
    const faction = this.world.getFaction(s.factionId);
    const color = faction ? faction.color : '#a8a8a8';

    // 势力色圆晕
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, s.type === 'town' ? 16 : s.type === 'castle' ? 14 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 图标
    Utils.drawPixelIcon(ctx, s.type, sx, sy, 1.5);

    // 名字
    if (s.type !== 'village') {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = 'bold 12px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, sx, sy + 18);
      ctx.textAlign = 'left';
    }

    // 围攻标记
    if (s.isSiege) {
      ctx.fillStyle = '#f86868';
      ctx.fillRect(sx + 10, sy - 14, 5, 5);
    }
  }

  drawPatrol(ctx, p) {
    const sx = p.x - this.camera.x;
    const sy = p.y - this.camera.y;
    if (sx < -10 || sx > this.viewport.w + 10 || sy < -10 || sy > this.viewport.h + 10) return;
    const faction = this.world.getFaction(p.factionId);
    if (!faction) {
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
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawPlayer(ctx) {
    const sx = this.player.x - this.camera.x;
    const sy = this.player.y - this.camera.y;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 英雄光晕（脉动）
    const time = Date.now() / 1000;
    const glow = (Math.sin(time * 2.5) + 1) / 2;
    ctx.save();
    ctx.globalAlpha = 0.18 + glow * 0.14;
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath();
    ctx.arc(sx, sy + 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 朝向
    const facing = this.player.isMoving ? (this.player.targetX > this.player.x ? 1 : -1) : 1;
    // 装备
    const eq = this.player.equipment;
    const weapon = eq.weapon ? (eq.weapon.weaponType || 'sword') : 'sword';
    const helmetLevel = eq.helmet ? (eq.helmet.level || 1) : 0;
    const armorLevel = eq.armor ? (eq.armor.level || 1) : 0;
    const shieldLevel = eq.shield ? (eq.shield.level || 1) : 0;
    // 动作
    const action = this.player.isMoving ? 'move' : 'idle';
    const animPhase = (this.animationTime * 2) % 1;
    Utils.drawPixelCharacter(ctx, sx, sy + 2, 3, {
      isHero: true,
      capeColor: '#f4d35e',
      weapon: weapon,
      helmetLevel: helmetLevel,
      armorLevel: armorLevel,
      shieldLevel: shieldLevel,
      boots: true,
      facing: facing,
      level: this.player.level,
      action: action,
      animPhase: animPhase
    });
    // 名字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText(this.player.name, sx, sy - 20);
    ctx.textAlign = 'left';
  }
}
