// ============ 工具函数库 ============
const Utils = {
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); },
  dist2(x1, y1, x2, y2) { return (x2 - x1) ** 2 + (y2 - y1) ** 2; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  angle(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },

  // 带种子的伪随机数生成器
  seededRand(seed) {
    let s = seed || 12345;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  },

  // 生成唯一ID
  uid() { return 'id_' + Math.random().toString(36).substr(2, 9); },

  // 生成中文名字
  chineseName(rng) {
    const surnames = ['李','王','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗'];
    const given1 = ['','子','伯','仲','叔','季','元','永','文','武','天','云','风','雨','雪','山','河','明','志','德'];
    const given2 = ['明','华','强','伟','勇','军','杰','磊','涛','鹏','飞','龙','虎','风','云','雪','霜','雷','电','山'];
    rng = rng || Math.random;
    const s = surnames[Math.floor(rng() * surnames.length)];
    const g1 = given1[Math.floor(rng() * given1.length)];
    const g2 = given2[Math.floor(rng() * given2.length)];
    return s + g1 + g2;
  },

  // 生成城镇名字
  placeName(rng) {
    const prefixes = ['金','银','铁','铜','青','白','黑','红','绿','蓝','新','古','永','安','平','和','昌','盛','兴','隆'];
    const middles = ['阳','阴','南','北','东','西','中','州','城','关','山','水','江','河','湖','海','云','雪','风','雷'];
    const suffixes = ['城','镇','堡','关','寨','庄','村','屯','港','渡'];
    rng = rng || Math.random;
    const p = prefixes[Math.floor(rng() * prefixes.length)];
    const m = middles[Math.floor(rng() * middles.length)];
    const s = suffixes[Math.floor(rng() * suffixes.length)];
    return p + m + s;
  },

  // 在画布上绘制像素风格文字
  drawPixelText(ctx, text, x, y, color, size) {
    ctx.fillStyle = color || '#fff';
    ctx.font = `${size || 12}px "Microsoft YaHei", monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  },

  // 像素风格矩形绘制
  drawPixelRect(ctx, x, y, w, h, color, borderColor) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w - 1, h - 1);
    }
  },

  // 绘制简易像素人物
  drawPixelHuman(ctx, x, y, scale, bodyColor, headColor, weaponType) {
    const s = scale || 2;
    // 身体
    ctx.fillStyle = bodyColor || '#3a6';
    ctx.fillRect(x - 2 * s, y, 4 * s, 6 * s);
    // 头
    ctx.fillStyle = headColor || '#fcb';
    ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, 4 * s);
    // 眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1 * s, y - 3 * s, s, s);
    ctx.fillRect(x + 1 * s, y - 3 * s, s, s);
    // 腿
    ctx.fillStyle = '#543';
    ctx.fillRect(x - 2 * s, y + 6 * s, 2 * s, 3 * s);
    ctx.fillRect(x, y + 6 * s, 2 * s, 3 * s);
    // 武器
    if (weaponType === 'sword') {
      ctx.fillStyle = '#dde';
      ctx.fillRect(x + 3 * s, y - 2 * s, s, 6 * s);
      ctx.fillStyle = '#963';
      ctx.fillRect(x + 2 * s, y + 3 * s, 3 * s, s);
    } else if (weaponType === 'bow') {
      ctx.strokeStyle = '#963';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.arc(x + 4 * s, y + 2 * s, 3 * s, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else if (weaponType === 'spear') {
      ctx.fillStyle = '#dde';
      ctx.fillRect(x + 3 * s, y - 5 * s, s, 12 * s);
      ctx.fillStyle = '#aab';
      ctx.beginPath();
      ctx.moveTo(x + 3 * s, y - 6 * s);
      ctx.lineTo(x + 4 * s + s, y - 4 * s);
      ctx.lineTo(x + 2 * s - s, y - 4 * s);
      ctx.fill();
    }
  },

  // ========== 高级像素角色渲染 v2 ==========
  // 支持：大头/躯干/手臂/腿/武器/盾牌 全部分离，肉眼可识别
  // 支持动作系统：idle / move / attack / defend
  drawPixelCharacter(ctx, x, y, scale, options) {
    options = options || {};
    const s = scale || 2;
    const facing = options.facing || 1;   // 1 右 -1 左
    const action = options.action || 'idle';
    const animPhase = options.animPhase || 0;  // 0..1 动画相位

    // ---- 根据 armorLevel 确定身体颜色 ----
    let bodyColor = options.bodyColor || '#4a4a5a';   // 布甲
    let bodyHighlight = '#6a6a7a';
    if (options.armorLevel) {
      if (options.armorLevel >= 5) { bodyColor = '#aaaacc'; bodyHighlight = '#ddeeff'; }  // 板甲
      else if (options.armorLevel >= 4) { bodyColor = '#777788'; bodyHighlight = '#aaaabb'; }  // 链甲
      else if (options.armorLevel >= 3) { bodyColor = '#5a4a3a'; bodyHighlight = '#8a7a5a'; }  // 锁甲
      else if (options.armorLevel >= 2) { bodyColor = '#5a3a2a'; bodyHighlight = '#8a6a4a'; }  // 皮甲
    }
    const headColor = options.headColor || '#fcb';
    const isHero = options.isHero || false;

    // ---- 动作相关偏移 ----
    // 攻击：武器挥砍动画；移动：腿部摆动；防御：盾牌前推
    let legSwing = 0, armSwing = 0, weaponLift = 0, shieldOffset = 0;
    if (action === 'move') {
      legSwing = Math.sin(animPhase * Math.PI * 2) * 1.2 * s;
      armSwing = Math.sin(animPhase * Math.PI * 2) * 0.8 * s;
    } else if (action === 'attack') {
      // 0..0.5 挥砍准备  0.5..1 挥砍完成
      const p = animPhase;
      weaponLift = Math.sin(p * Math.PI) * 4 * s;
      armSwing = Math.sin(p * Math.PI) * 2 * s;
    } else if (action === 'defend') {
      shieldOffset = 1.5 * s;
    }

    // ---- 披风（英雄） ----
    if (isHero) {
      ctx.fillStyle = options.capeColor || '#f4d35e';
      ctx.beginPath();
      ctx.moveTo(x - 4 * s, y - 1 * s);
      ctx.lineTo(x - 4 * s, y + 9 * s);
      ctx.lineTo(x - 1 * s, y + 10 * s);
      ctx.lineTo(x - 1 * s, y - 1 * s);
      ctx.fill();
      // 金色镶边
      ctx.fillStyle = '#b89856';
      ctx.fillRect(x - 4 * s, y - 1 * s, s, 10 * s);
    }

    // ---- 头部（较大，占比高） ----
    // 帽子/头发区
    if (options.helmetLevel && options.helmetLevel > 0) {
      let helmetColor = '#888899';
      let plumeColor = null;
      if (options.helmetLevel >= 5) { helmetColor = '#f4d35e'; plumeColor = '#f86868'; }
      else if (options.helmetLevel >= 4) { helmetColor = '#aaaabb'; plumeColor = '#f4d35e'; }
      else if (options.helmetLevel >= 3) { helmetColor = '#aaa'; plumeColor = '#f4d35e'; }
      else if (options.helmetLevel >= 2) { helmetColor = '#777'; }
      // 头盔主体（比头稍大）
      ctx.fillStyle = helmetColor;
      ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, 5 * s);
      // 头盔顶装饰/羽毛
      if (plumeColor) {
        ctx.fillStyle = plumeColor;
        ctx.fillRect(x - 1 * s, y - 10 * s, 2 * s, 2 * s);
        ctx.fillRect(x, y - 11 * s, s, s);
      }
      // 面甲开口（Lv3+）
      if (options.helmetLevel >= 3) {
        ctx.fillStyle = '#2a1a1a';
        ctx.fillRect(x - 2 * s, y - 6 * s, 4 * s, s);
      } else {
        // 露脸（低级头盔）
        ctx.fillStyle = headColor;
        ctx.fillRect(x - 2 * s, y - 5 * s, 4 * s, 2 * s);
        // 眼睛
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - 1 * s, y - 4 * s, s, s);
        ctx.fillRect(x + s, y - 4 * s, s, s);
      }
    } else {
      // 头部（头较大，占比高）
      ctx.fillStyle = headColor;
      ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, 5 * s);
      // 头发
      ctx.fillStyle = isHero ? '#542a1a' : '#3a2a1a';
      ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, s);
      // 眼睛（朝向感知）
      ctx.fillStyle = '#1a1a1a';
      const eyeOffset = facing > 0 ? 0 : 0;
      ctx.fillRect(x - 2 * s + eyeOffset, y - 6 * s, s, s);
      ctx.fillRect(x + s + eyeOffset, y - 6 * s, s, s);
      // 嘴
      ctx.fillStyle = '#a64a3a';
      ctx.fillRect(x - s, y - 4 * s, 2 * s, s);
    }

    // ---- 脖子 ----
    ctx.fillStyle = headColor;
    ctx.fillRect(x - s, y - 3 * s, 2 * s, s);

    // ---- 躯干（护甲） ----
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 6 * s);
    // 护甲高亮装饰
    if (options.armorLevel >= 2) {
      ctx.fillStyle = bodyHighlight;
      ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, s);  // 肩部
      ctx.fillRect(x - s, y, 2 * s, 2 * s);           // 中央徽章
    }
    // 腰带
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 3 * s, y + 3 * s, 6 * s, s);

    // ---- 手臂 ----
    // 左臂（持盾侧）
    ctx.fillStyle = bodyColor;
    const leftArmX = facing > 0 ? x - 4 * s : x + 3 * s;
    ctx.fillRect(leftArmX, y - 1 * s + armSwing * 0.3, s, 4 * s);
    // 左臂拳头
    ctx.fillStyle = headColor;
    ctx.fillRect(leftArmX, y + 3 * s + armSwing * 0.3, s, s);
    // 右臂（持武器侧）
    const rightArmX = facing > 0 ? x + 3 * s : x - 4 * s;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(rightArmX, y - 1 * s - armSwing * 0.3, s, 4 * s);
    // 右臂拳头
    ctx.fillStyle = headColor;
    ctx.fillRect(rightArmX, y + 3 * s - armSwing * 0.3, s, s);

    // ---- 腿（两条腿，独立） ----
    ctx.fillStyle = options.boots ? '#3a2a1a' : '#54321a';
    ctx.fillRect(x - 2 * s, y + 4 * s + legSwing, 2 * s, 5 * s);
    ctx.fillRect(x, y + 4 * s - legSwing, 2 * s, 5 * s);
    // 鞋子
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x - 2 * s, y + 8 * s + legSwing, 2 * s, s);
    ctx.fillRect(x, y + 8 * s - legSwing, 2 * s, s);

    // ---- 盾牌（左臂前） ----
    if (options.shieldLevel && options.shieldLevel > 0) {
      let shieldColor = '#5a3a2a';
      let rimColor = '#b89856';
      if (options.shieldLevel >= 4) { shieldColor = '#f4d35e'; rimColor = '#b89856'; }
      else if (options.shieldLevel >= 3) { shieldColor = '#888'; rimColor = '#aaa'; }
      else if (options.shieldLevel >= 2) { shieldColor = '#7a5a3a'; rimColor = '#b89856'; }
      const shX = facing > 0 ? (x - 5 * s - shieldOffset) : (x + 4 * s + shieldOffset);
      const shW = 3 * s, shH = 5 * s;
      ctx.fillStyle = shieldColor;
      ctx.beginPath();
      ctx.ellipse(shX + shW / 2, y + 1 * s, shW / 2, shH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // 盾牌金属环
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      ctx.ellipse(shX + shW / 2, y + 1 * s, shW / 2 + 1, shH / 2 + 1, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      // 中央盾徽
      ctx.fillStyle = '#f86868';
      ctx.fillRect(shX + shW / 2 - s / 2, y + s - s / 2, s, s);
    }

    // ---- 武器（右手边） ----
    if (options.weapon) {
      this.drawPixelWeapon(ctx, x, y, s, options.weapon, facing, weaponLift, armSwing);
    }

    // ---- 英雄光环 ----
    if (isHero) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#f4d35e';
      ctx.beginPath();
      ctx.arc(x, y, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // 金色圆环
      ctx.strokeStyle = '#f4d35e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 8 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  // ========== 武器绘制 v2 ==========
  drawPixelWeapon(ctx, x, y, s, weapon, facing, liftOffset, armOffset) {
    const dir = facing > 0 ? 1 : -1;
    const lift = liftOffset || 0;
    const arm = armOffset || 0;
    // 武器基础位置（右手外侧）
    let baseX = x + dir * 4 * s;
    let baseY = y - 1 * s - lift;

    if (weapon === 'sword' || weapon === 'dagger') {
      // 剑刃
      ctx.fillStyle = weapon === 'sword' ? '#dde' : '#ccd';
      const bladeH = weapon === 'sword' ? 7 * s : 4 * s;
      ctx.fillRect(baseX, baseY, s, bladeH);
      // 刀刃高光
      ctx.fillStyle = '#fff';
      ctx.fillRect(baseX, baseY + s, s, 2 * s);
      // 剑柄横
      ctx.fillStyle = '#b89856';
      ctx.fillRect(baseX - s, baseY + bladeH, 3 * s, s);
      // 剑柄握
      ctx.fillStyle = '#6a3a1a';
      ctx.fillRect(baseX, baseY + bladeH + s, s, 2 * s);
      // 柄尾球
      ctx.fillStyle = '#b89856';
      ctx.fillRect(baseX, baseY + bladeH + 3 * s, s, s);
    } else if (weapon === 'bow') {
      ctx.strokeStyle = '#6a3a1a';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.arc(baseX + dir * s, y + 1 * s, 4 * s, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : 3 * Math.PI / 2);
      ctx.stroke();
      // 弓弦
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(baseX + dir * s, y - 3 * s);
      ctx.lineTo(baseX + dir * s, y + 5 * s);
      ctx.stroke();
      // 弓上箭
      ctx.fillStyle = '#aaa';
      ctx.fillRect(baseX + dir * s - (dir > 0 ? 0 : s), y + 1 * s, 4 * s, 1);
    } else if (weapon === 'spear') {
      // 长矛杆
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(baseX, baseY - 2 * s, s, 14 * s);
      // 矛头
      ctx.fillStyle = '#ccd';
      ctx.beginPath();
      ctx.moveTo(baseX + s / 2, baseY - 5 * s);
      ctx.lineTo(baseX + 2 * s, baseY - 2 * s);
      ctx.lineTo(baseX - s, baseY - 2 * s);
      ctx.fill();
      // 矛头尖高光
      ctx.fillStyle = '#fff';
      ctx.fillRect(baseX, baseY - 4 * s, s, s);
      // 长矛尾铁
      ctx.fillStyle = '#888';
      ctx.fillRect(baseX, baseY + 11 * s, s, s);
    } else if (weapon === 'axe') {
      // 斧柄
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(baseX, baseY, s, 7 * s);
      // 斧头（大）
      ctx.fillStyle = '#888';
      ctx.fillRect(baseX - 2 * s, baseY - s, 5 * s, 3 * s);
      // 斧头高光
      ctx.fillStyle = '#ddd';
      ctx.fillRect(baseX - 2 * s, baseY - s, 5 * s, s);
      // 斧头刃
      ctx.fillStyle = '#eee';
      ctx.fillRect(baseX + 2 * s, baseY - s, s, 3 * s);
    } else if (weapon === 'staff') {
      // 法杖
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(baseX, baseY - 2 * s, s, 12 * s);
      // 法杖顶宝石
      ctx.fillStyle = '#6a3aaa';
      ctx.fillRect(baseX - s, baseY - 3 * s, 3 * s, 2 * s);
      ctx.fillStyle = '#aa6aff';
      ctx.fillRect(baseX, baseY - 3 * s, s, s);
    }
  },

  // 绘制像素化建筑
  drawPixelBuilding(ctx, x, y, w, h, color, roofColor) {
    ctx.fillStyle = color || '#b89856';
    ctx.fillRect(x, y, w, h);
    // 屋顶
    ctx.fillStyle = roofColor || '#8a3a3a';
    ctx.fillRect(x - 2, y - h * 0.3, w + 4, h * 0.3);
    // 窗户
    ctx.fillStyle = '#442';
    const winW = Math.max(2, w * 0.15);
    const winH = Math.max(2, h * 0.15);
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(x + (w * i / 4) - winW / 2, y + h * 0.35, winW, winH);
    }
    // 门
    ctx.fillStyle = '#321';
    ctx.fillRect(x + w / 2 - w * 0.1, y + h - h * 0.35, w * 0.2, h * 0.35);
  },

  // 绘制像素图标
  drawPixelIcon(ctx, type, x, y, size) {
    const s = size || 1;
    ctx.save();
    switch (type) {
      case 'town':
        this.drawPixelBuilding(ctx, x - 10 * s, y - 6 * s, 20 * s, 12 * s, '#b89856', '#8a3a3a');
        break;
      case 'castle':
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 16 * s);
        ctx.fillStyle = '#5a5a6a';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x - 10 * s + i * 6 * s, y - 10 * s, 4 * s, 3 * s);
        }
        ctx.fillStyle = '#321';
        ctx.fillRect(x - 2 * s, y + 2 * s, 4 * s, 6 * s);
        break;
      case 'village':
        this.drawPixelBuilding(ctx, x - 6 * s, y - 2 * s, 12 * s, 8 * s, '#9a7848', '#6a4a2a');
        break;
      case 'player':
        this.drawPixelHuman(ctx, x, y + 4, s, '#6a4aaa', '#fcb', 'sword');
        break;
      case 'enemy':
        this.drawPixelHuman(ctx, x, y + 4, s, '#aa3a3a', '#fcb', 'sword');
        break;
      default:
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 4, y - 4, 8, 8);
    }
    ctx.restore();
  },

  // 格式化数字
  formatNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString();
  },

  // 金币显示
  formatGold(n) { return '💰' + this.formatNum(n); },

  // 碰撞检测（矩形）
  rectCollide(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  },

  // 点在矩形内
  pointInRect(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }
};

// 全局消息提示
function toast(msg, color) {
  try {
    const layer = document.getElementById('toast-layer');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    if (color) el.style.color = color;
    el.remove = el.remove || function() { if (el.parentNode) el.parentNode.removeChild(el); };
    layer.appendChild(el);
    setTimeout(() => {
      try { el.remove(); } catch (e) {}
    }, 3000);
  } catch (e) {
    // 静默失败
  }
}
