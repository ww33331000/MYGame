// ============ 战斗地图 v2 ============
// 使用新版角色绘制（头/躯干/手臂/腿/武器/盾牌）+ 动作动画
class BattleMap {
  constructor() {
    this.reset();
  }

  reset() {
    this.width = 1440;
    this.height = 900;
    this.allies = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.finished = false;
    this.victory = false;
    this.onVictoryCb = null;
    this.onDefeatCb = null;
    this.timer = 0;
    this.battleSpeed = 1;
    this.paused = false;
    this.animTime = 0;
  }

  setup(enemies, options) {
    options = options || {};
    this.reset();
    this.enemyName = options.enemyName || '敌军';
    this.onVictoryCb = options.onVictory;
    this.onDefeatCb = options.onDefeat;
    // 生成玩家军队
    this.allies = Game.player.party.members
      .filter(m => !m.isDead)
      .map(m => {
        const unit = m.clone();
        unit.isAlly = true;
        unit.hp = m.hp;
        unit.maxHp = m.maxHp;
        unit.baseDamage = m.baseDamage;
        unit.baseDefense = m.baseDefense;
        return unit;
      });
    // 放置单位（更大的战场）
    this.allies.forEach((u, i) => {
      u.x = 120 + (i % 5) * 40;
      u.y = 200 + Math.floor(i / 5) * 50;
      u.targetX = u.x;
      u.targetY = u.y;
      u.attackCooldown = 1;
      u.facing = 1;
      u.isDead = false;
      u.action = 'idle';
      u.animPhase = Math.random();
      u.actionTimer = 0;
    });
    // 敌人
    this.enemies = enemies.map((u, i) => {
      u.isAlly = false;
      u.x = this.width - 180 + (i % 5) * 40;
      u.y = 200 + Math.floor(i / 5) * 50;
      u.targetX = u.x;
      u.targetY = u.y;
      u.attackCooldown = 0.5 + Math.random() * 1.5;
      u.facing = -1;
      u.isDead = false;
      u.action = 'idle';
      u.animPhase = Math.random();
      u.actionTimer = 0;
      return u;
    });
  }

  update(dt) {
    if (this.paused) return;
    if (this.finished) return;
    dt *= this.battleSpeed;
    this.timer += dt;
    this.animTime += dt;
    // 更新所有单位
    const allUnits = this.allies.concat(this.enemies);
    allUnits.forEach(u => {
      // 更新动画相位
      if (u.action === 'move') {
        u.animPhase = (this.animTime * 3) % 1;
      }
      this.updateUnit(u, dt, allUnits);
    });
    // 移除死亡单位后保留1秒再从绘制移除
    // 更新弹道
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      // 击中检测
      const targets = p.ally ? this.enemies : this.allies;
      for (const t of targets) {
        if (!t.isDead && Utils.dist(p.x, p.y, t.x, t.y) < 12) {
          const dmg = t.takeDamage(p.damage);
          this.addEffect(t.x, t.y, '-' + Math.floor(dmg), '#ff6868');
          return false;
        }
      }
      return p.life > 0;
    });
    // 更新特效
    this.effects = this.effects.filter(e => {
      e.life -= dt;
      return e.life > 0;
    });
    // 检查结束
    const aliveAllies = this.allies.filter(u => !u.isDead);
    const aliveEnemies = this.enemies.filter(u => !u.isDead);
    if (aliveAllies.length === 0 && !this.finished) {
      this.finished = true;
      this.victory = false;
      setTimeout(() => this.endBattle(), 1500);
    } else if (aliveEnemies.length === 0 && !this.finished) {
      this.finished = true;
      this.victory = true;
      setTimeout(() => this.endBattle(), 1500);
    }
  }

  updateUnit(unit, dt, all) {
    if (unit.isDead) return;
    unit.attackCooldown -= dt;
    // 寻找目标
    const enemies = unit.isAlly ? this.enemies : this.allies;
    let target = null;
    let bestDist = 99999;
    enemies.forEach(e => {
      if (e.isDead) return;
      const d = Utils.dist(unit.x, unit.y, e.x, e.y);
      if (d < bestDist) { bestDist = d; target = e; }
    });
    if (!target) { unit.action = 'idle'; return; }
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const atkRange = unit.ranged ? 180 : 35;
    unit.facing = dx > 0 ? 1 : -1;
    if (dist > atkRange) {
      // 移动
      unit.action = 'move';
      const vx = dx / dist;
      const vy = dy / dist;
      const speed = 70 * unit.speed;
      let avoidX = 0, avoidY = 0;
      all.forEach(o => {
        if (o === unit || o.isDead) return;
        const d = Utils.dist(unit.x, unit.y, o.x, o.y);
        if (d < 18 && d > 0) {
          avoidX -= (o.x - unit.x) / d;
          avoidY -= (o.y - unit.y) / d;
        }
      });
      unit.x += (vx + avoidX * 0.3) * speed * dt;
      unit.y += (vy + avoidY * 0.3) * speed * dt;
    } else if (unit.attackCooldown <= 0) {
      // 攻击动画（0.4秒）
      unit.action = 'attack';
      unit.actionTimer = 0.4;
      if (unit.ranged) {
        this.shootArrow(unit, target);
      } else {
        const dmg = target.takeDamage(Math.floor(unit.getTotalDamage() * (0.8 + Math.random() * 0.4)));
        this.addEffect(target.x, target.y, '-' + Math.floor(dmg), '#ff6868');
        this.addEffect(target.x, target.y, null, '#ffaa44', 'slash');
      }
      unit.attackCooldown = 1.0 / unit.speed;
    } else {
      // 防御待机
      if (unit.actionTimer > 0) {
        unit.actionTimer -= dt;
      } else {
        unit.action = unit.action === 'attack' ? 'idle' : unit.action;
      }
    }
    unit.x = Utils.clamp(unit.x, 20, this.width - 20);
    unit.y = Utils.clamp(unit.y, 120, this.height - 20);
  }

  shootArrow(unit, target) {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.projectiles.push({
      x: unit.x, y: unit.y,
      vx: dx / dist * 280,
      vy: dy / dist * 280,
      damage: Math.floor(unit.getTotalDamage() * (0.8 + Math.random() * 0.4)),
      life: 2.5,
      ally: unit.isAlly
    });
    this.addEffect(unit.x, unit.y, null, '#f4d35e', 'muzzle');
  }

  addEffect(x, y, text, color, type) {
    this.effects.push({ x, y, text, color: color || '#fff', type: type || 'text', life: 0.8, maxLife: 0.8, vy: -30 });
  }

  endBattle() {
    if (this.victory) {
      // 同步玩家单位HP
      Game.player.party.members.forEach((m, i) => {
        if (this.allies[i]) {
          m.hp = this.allies[i].hp;
          m.isDead = this.allies[i].isDead;
        }
      });
      if (Game.player.hp > 0 && this.onVictoryCb) this.onVictoryCb();
      Game.ui.clearPanels();
      StateManager.change(GameState.WORLD_MAP);
      toast('胜利！', '#78d878');
      // 若玩家HP为0则游戏结束
    } else {
      Game.player.party.members.forEach((m, i) => {
        if (this.allies[i]) {
          m.hp = Math.floor(this.allies[i].maxHp * 0.2);
          m.isDead = false;
        }
      });
      Game.player.hp = Math.max(1, Math.floor(Game.player.maxHp * 0.15));
      Game.ui.clearPanels();
      StateManager.change(GameState.WORLD_MAP);
      toast('战败...', '#f86868');
      Game.player.x = Utils.clamp(Game.player.x + Utils.randInt(-40, 40), 50, Game.world.width - 50);
      Game.player.y = Utils.clamp(Game.player.y + Utils.randInt(-40, 40), 50, Game.world.height - 50);
    }
  }

  render(ctx) {
    // 战场背景（大尺寸）
    ctx.fillStyle = '#3a4a2a';
    ctx.fillRect(0, 0, this.width, this.height);
    // 地面纹理
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(58,74,42,0.5)';
      const rx = (i * 83) % this.width;
      const ry = 100 + ((i * 97) % (this.height - 120));
      ctx.fillRect(rx, ry, 12, 5);
    }
    // 草地细节
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = 'rgba(70,90,50,0.4)';
      const rx = (i * 113 + 30) % this.width;
      const ry = 100 + ((i * 131) % (this.height - 130));
      ctx.fillRect(rx, ry, 3, 6);
    }
    // 绘制单位
    const all = this.allies.concat(this.enemies);
    all.forEach(u => this.drawUnit(ctx, u));
    // 弹道
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.ally ? '#f4d35e' : '#f86868';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    // 特效
    this.effects.forEach(e => {
      const alpha = e.life / e.maxLife;
      ctx.globalAlpha = alpha;
      if (e.text) {
        ctx.fillStyle = e.color;
        ctx.font = 'bold 18px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText(e.text, e.x, e.y + (e.maxLife - e.life) * e.vy);
        ctx.textAlign = 'left';
      } else if (e.type === 'slash') {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x - 12, e.y - 12);
        ctx.lineTo(e.x + 12, e.y + 12);
        ctx.stroke();
      } else {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    // 顶部信息条
    const allyAlive = this.allies.filter(u => !u.isDead).length;
    const enemyAlive = this.enemies.filter(u => !u.isDead).length;
    ctx.fillStyle = 'rgba(10,10,20,0.88)';
    ctx.fillRect(0, 0, this.width, 40);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, 40);
    ctx.fillStyle = '#78d878';
    ctx.font = 'bold 16px "Microsoft YaHei"';
    ctx.fillText('我方: ' + allyAlive + '/' + this.allies.length, 20, 27);
    ctx.fillStyle = '#f86868';
    ctx.fillText(this.enemyName + ': ' + enemyAlive + '/' + this.enemies.length, 200, 27);
    ctx.fillStyle = '#b89856';
    ctx.fillText('时间: ' + Math.floor(this.timer) + 's', 480, 27);
    ctx.fillStyle = '#888';
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillText('点击加速 | 空格暂停', 620, 27);
    // 结束提示
    if (this.finished) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, this.height / 2 - 50, this.width, 100);
      ctx.fillStyle = this.victory ? '#78d878' : '#f86868';
      ctx.font = 'bold 42px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText(this.victory ? '胜  利!' : '战  败', this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    }
  }

  drawUnit(ctx, u) {
    if (u.isDead) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#553';
      ctx.fillRect(u.x - 8, u.y + 10, 16, 4);
      ctx.fillStyle = '#8a3a3a';
      ctx.fillRect(u.x - 4, u.y + 11, 3, 2);
      ctx.fillRect(u.x + 2, u.y + 12, 3, 2);
      ctx.globalAlpha = 1;
      return;
    }
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(u.x, u.y + 12, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // HP条
    const barW = 30;
    const hpPct = u.hp / u.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(u.x - barW / 2 - 1, u.y - 28, barW + 2, 6);
    ctx.fillStyle = '#331';
    ctx.fillRect(u.x - barW / 2, u.y - 27, barW, 4);
    if (hpPct > 0.6) ctx.fillStyle = '#78d878';
    else if (hpPct > 0.3) ctx.fillStyle = '#f4d35e';
    else ctx.fillStyle = '#f86868';
    ctx.fillRect(u.x - barW / 2, u.y - 27, barW * hpPct, 4);
    // 动作相位
    let animPhase = u.animPhase || 0;
    // 攻击动作的动画
    let actionPhase = 0;
    if (u.action === 'attack' && u.actionTimer > 0) {
      actionPhase = 1 - (u.actionTimer / 0.4);
    }
    // 装备数据
    const options = {
      weapon: u.ranged ? 'bow' : (u.weaponType || 'sword'),
      facing: u.facing,
      level: u.level,
      action: u.action || 'idle',
      animPhase: animPhase
    };
    if (u.isPlayer && Game.player) {
      const eq = Game.player.equipment;
      options.weapon = eq.weapon ? (eq.weapon.weaponType || 'sword') : 'sword';
      options.helmetLevel = eq.helmet ? (eq.helmet.level || 1) : 0;
      options.armorLevel = eq.armor ? (eq.armor.level || 1) : 0;
      options.shieldLevel = eq.shield ? (eq.shield.level || 1) : 0;
      options.isHero = true;
      options.capeColor = '#f4d35e';
      options.boots = true;
    } else {
      if (u.level >= 6) options.armorLevel = 4;
      else if (u.level >= 4) options.armorLevel = 3;
      else if (u.level >= 2) options.armorLevel = 2;
      else options.armorLevel = 1;
      if (u.ranged) options.weapon = 'bow';
      else if (u.weaponType) options.weapon = u.weaponType;
      else options.weapon = 'sword';
      if (u.level >= 5) options.helmetLevel = 3;
      else if (u.level >= 3) options.helmetLevel = 2;
      if (!u.ranged && u.level >= 3) options.shieldLevel = 2;
      options.boots = u.level >= 3;
      // 敌人红色偏暗，友军绿色偏亮
      if (!u.isAlly) {
        options.bodyColor = u.isAlly ? '#6a8a4a' : '#6a4a4a';
      }
    }
    // 攻击动作用特殊相位
    if (u.action === 'attack') {
      options.animPhase = actionPhase;
    }
    // 渲染角色（大尺寸）
    Utils.drawPixelCharacter(ctx, u.x, u.y - 3, 2.5, options);
    // 标识
    if (u.isPlayer) {
      ctx.strokeStyle = '#f4d35e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(u.x, u.y - 4, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f4d35e';
      ctx.font = 'bold 11px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText('Lv' + u.level, u.x, u.y - 35);
      ctx.textAlign = 'left';
    } else if (u.level >= 5) {
      ctx.fillStyle = '#f4d35e';
      ctx.font = 'bold 10px "Microsoft YaHei"';
      ctx.textAlign = 'center';
      ctx.fillText('Lv' + u.level, u.x, u.y - 33);
      ctx.textAlign = 'left';
    }
    // 阵营标识
    if (!u.isPlayer) {
      ctx.fillStyle = u.isAlly ? '#78d878' : '#f86868';
      ctx.beginPath();
      ctx.arc(u.x + 10, u.y - 24, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
