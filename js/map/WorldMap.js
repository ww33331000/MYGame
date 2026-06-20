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
    this.camera.x = Utils.clamp(this.camera.x, 0, this.world.width - this.viewport.w);
    this.camera.y = Utils.clamp(this.camera.y, 0, this.world.height - this.viewport.h);

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
      // 前往并在到达后打开界面
      this.player.startMoveTo(s.x, s.y);
      return true;
    }
    // 点击空地移动
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
    // 简化的纹理绘制 - 用纯色渐变
    const grad = ctx.createLinearGradient(0, 0, this.viewport.w, this.viewport.h);
    grad.addColorStop(0, '#4a5a3a');
    grad.addColorStop(1, '#6a7a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.viewport.w, this.viewport.h);
    // 河流/道路（用简单的线条）
    ctx.fillStyle = 'rgba(80,110,170,0.25)';
    for (let i = 0; i < 6; i++) {
      const rx = (i * 277 % this.world.width) - this.camera.x;
      const ry = (i * 331 % this.world.height) - this.camera.y;
      ctx.beginPath();
      ctx.arc(rx, ry, 15 + (i % 3) * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 山/森林斑点
    ctx.fillStyle = 'rgba(40,60,30,0.4)';
    for (let i = 0; i < 40; i++) {
      const rx = (i * 137 % this.world.width) - this.camera.x;
      const ry = (i * 97 % this.world.height) - this.camera.y;
      ctx.beginPath();
      ctx.arc(rx, ry, 3 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 网格线
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 40 - (this.camera.y % 40));
      ctx.lineTo(this.viewport.w, i * 40 - (this.camera.y % 40));
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
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 绘制小人
    Utils.drawPixelHuman(ctx, sx, sy + 3, 1.5, '#f4d35e', '#fcb', 'sword');
  }
}
