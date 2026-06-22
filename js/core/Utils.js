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

  // 高级像素角色渲染 - 支持完整装备
  drawPixelCharacter(ctx, x, y, scale, options) {
    options = options || {};
    const s = scale || 1.5;
    const w = 4 * s;   // 宽度
    const h = 12 * s;  // 总高度
    const facing = options.facing || 1;
    // 身体颜色
    let bodyColor = options.bodyColor || '#4a4a5a';  // 布甲
    if (options.armorLevel) {
      if (options.armorLevel >= 5) bodyColor = '#aaaacc';  // 板甲
      else if (options.armorLevel >= 4) bodyColor = '#777788';  // 链甲
      else if (options.armorLevel >= 3) bodyColor = '#5a4a3a';  // 锁甲
      else if (options.armorLevel >= 2) bodyColor = '#5a3a2a';  // 皮甲
    }
    const headColor = options.headColor || '#fcb';
    const isHero = options.isHero || false;
    // 披风（英雄标志）
    if (isHero) {
      ctx.fillStyle = options.capeColor || '#f4d35e';
      ctx.beginPath();
      ctx.moveTo(x - 3 * s, y - 1 * s);
      ctx.lineTo(x - 3 * s, y + 7 * s);
      ctx.lineTo(x - 1.5 * s, y + 8 * s);
      ctx.lineTo(x - 2 * s, y - 1 * s);
      ctx.fill();
      // 披风金色镶边
      ctx.fillStyle = '#b89856';
      ctx.fillRect(x - 3 * s, y - 1 * s, s, 8 * s);
    }
    // 靴子
    if (options.boots) {
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 2 * s, y + 7 * s, 2 * s, 2 * s);
      ctx.fillRect(x, y + 7 * s, 2 * s, 2 * s);
    } else {
      ctx.fillStyle = '#543';
      ctx.fillRect(x - 2 * s, y + 7 * s, 2 * s, 2 * s);
      ctx.fillRect(x, y + 7 * s, 2 * s, 2 * s);
    }
    // 身体（护甲）
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - 2 * s, y, 4 * s, 7 * s);
    // 护甲细节 - 等级3以上
    if (options.armorLevel && options.armorLevel >= 3) {
      ctx.fillStyle = bodyColor === '#aaaacc' ? '#ddddee' : (bodyColor === '#777788' ? '#aaaabb' : '#8a7a4a');
      ctx.fillRect(x - 2 * s, y + 1 * s, 4 * s, s);  // 肩部
      ctx.fillRect(x - s, y + 3 * s, 2 * s, s);      // 中央条
    }
    // 手臂
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - 3 * s, y + s, s, 4 * s);
    ctx.fillRect(x + 2 * s, y + s, s, 4 * s);
    // 头
    let headFillColor = headColor;
    // 头盔
    if (options.helmetLevel) {
      let helmetColor = '#888899';
      if (options.helmetLevel >= 4) helmetColor = '#f4d35e';
      else if (options.helmetLevel >= 3) helmetColor = '#aaa';
      ctx.fillStyle = helmetColor;
      ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, 3 * s);
      // 高级头盔装饰
      if (options.helmetLevel >= 4) {
        ctx.fillStyle = '#f86868';
        ctx.fillRect(x - s, y - 5 * s, 2 * s, s);
      }
      headFillColor = helmetColor; // 头盔覆盖头部
    }
    if (!options.helmetLevel) {
      ctx.fillStyle = headFillColor;
      ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, 4 * s);
    }
    // 头发/眉毛
    if (!options.helmetLevel) {
      ctx.fillStyle = '#543';
      ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, s);
    }
    // 眼睛
    ctx.fillStyle = '#000';
    if (facing > 0) {
      ctx.fillRect(x - 1 * s, y - 2 * s, s, s);
      ctx.fillRect(x + 1 * s, y - 2 * s, s, s);
    } else {
      ctx.fillRect(x - 2 * s, y - 2 * s, s, s);
      ctx.fillRect(x, y - 2 * s, s, s);
    }
    // 嘴
    if (!options.helmetLevel || options.helmetLevel < 4) {
      ctx.fillStyle = '#a64a3a';
      ctx.fillRect(x - s, y, 2 * s, s);
    }
    // 武器
    if (options.weapon) {
      this.drawPixelWeapon(ctx, x, y, s, options.weapon, facing);
    }
    // 盾牌（左手）
    if (options.shieldLevel) {
      let shieldColor = '#5a3a2a';
      if (options.shieldLevel >= 4) shieldColor = '#f4d35e';
      else if (options.shieldLevel >= 3) shieldColor = '#888';
      else if (options.shieldLevel >= 2) shieldColor = '#7a5a3a';
      ctx.fillStyle = shieldColor;
      const shieldX = facing > 0 ? x - 4 * s : x + 3 * s;
      ctx.fillRect(shieldX, y, 3 * s, 4 * s);
      // 盾牌装饰
      ctx.fillStyle = '#f4d35e';
      ctx.fillRect(shieldX + s, y + s, s, 2 * s);
    }
    // 等级标记
    if (options.level && options.level > 0) {
      // 头顶皇冠/等级
      if (isHero) {
        ctx.fillStyle = '#f4d35e';
        ctx.fillRect(x - 2 * s, y - 6 * s, 4 * s, s);
        ctx.fillStyle = '#f86868';
        ctx.fillRect(x - s, y - 7 * s, s, s);
        ctx.fillRect(x, y - 7 * s, s, s);
      }
    }
  },

  // 绘制武器
  drawPixelWeapon(ctx, x, y, s, weapon, facing) {
    const dir = facing > 0 ? 1 : -1;
    const wx = x + dir * 3 * s;
    if (weapon === 'sword' || weapon === 'dagger') {
      // 剑刃
      ctx.fillStyle = weapon === 'sword' ? '#dde' : '#ccd';
      ctx.fillRect(wx, y - 2 * s, s, 6 * s);
      // 剑柄
      ctx.fillStyle = '#6a3a1a';
      ctx.fillRect(wx, y + 3 * s, s, s);
      // 剑柄横
      ctx.fillStyle = '#b89856';
      ctx.fillRect(wx - s, y + 2 * s, 3 * s, s);
      // 剑刃高亮
      if (weapon === 'sword') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(wx, y - 1 * s, s, 2 * s);
      }
    } else if (weapon === 'bow') {
      ctx.strokeStyle = '#6a3a1a';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.arc(wx + dir * s, y + 2 * s, 4 * s, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : 3 * Math.PI / 2);
      ctx.stroke();
      // 弓弦
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx + dir * s, y - 2 * s);
      ctx.lineTo(wx + dir * s, y + 6 * s);
      ctx.stroke();
    } else if (weapon === 'spear') {
      // 长矛
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(wx, y - 5 * s, s, 12 * s);
      // 矛头
      ctx.fillStyle = '#ccd';
      ctx.beginPath();
      ctx.moveTo(wx, y - 7 * s);
      ctx.lineTo(wx + 2 * s, y - 4 * s);
      ctx.lineTo(wx - s, y - 4 * s);
      ctx.fill();
    } else if (weapon === 'axe') {
      // 斧头
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(wx, y, s, 6 * s);
      ctx.fillStyle = '#888';
      ctx.fillRect(wx - 2 * s, y, 4 * s, 3 * s);
      ctx.fillStyle = '#aab';
      ctx.fillRect(wx - 2 * s, y + 3 * s, s, s);
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
