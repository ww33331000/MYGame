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
  const layer = document.getElementById('toast-layer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  if (color) el.style.color = color;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
