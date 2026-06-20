// ===== 渲染系统（世界地图 + 战斗渲染 + HUD）=====
const Render = (() => {

  let canvas, ctx;
  let camera = { x: 0, y: 0, zoom: 1 };
  let hoverSettlement = null;
  let terrainCache = null;
  let lastFrame = 0;

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  // 生成地形（简单基于网格的噪声地形）
  function generateTerrain(w, h) {
    const size = 6;
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    const grid = [];
    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      for (let x = 0; x < cols; x++) {
        const nx = x / cols, ny = y / rows;
        const elev = Math.sin(nx * 6) * Math.cos(ny * 5)
                   + 0.5 * Math.sin(nx * 13 + 2.1)
                   + 0.3 * Math.cos(ny * 9 + 1.4);
        grid[y][x] = elev;
      }
    }
    terrainCache = { grid, size, cols, rows };
  }

  function getCamera() { return camera; }

  function worldToScreen(wx, wy) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    return {
      x: (wx - camera.x) * camera.zoom + cw / 2,
      y: (wy - camera.y) * camera.zoom + ch / 2,
    };
  }

  function screenToWorld(sx, sy) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    return {
      x: (sx - cw / 2) / camera.zoom + camera.x,
      y: (sy - ch / 2) / camera.zoom + camera.y,
    };
  }

  function setCameraTarget(x, y) {
    camera.x = x;
    camera.y = y;
  }

  function panCamera(tx, ty, dt) {
    camera.x += (tx - camera.x) * Math.min(1, dt * 3);
    camera.y += (ty - camera.y) * Math.min(1, dt * 3);
  }

  // ========= 世界地图渲染 =========
  function renderWorld(state, dt) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    // 背景（海）
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(0, 0, cw, ch);

    // 地形
    if (terrainCache) {
      const z = camera.zoom;
      const cell = terrainCache.size;
      for (let gy = 0; gy < terrainCache.rows; gy++) {
        for (let gx = 0; gx < terrainCache.cols; gx++) {
          const wx = gx * cell;
          const wy = gy * cell;
          const s = worldToScreen(wx, wy);
          if (s.x < -cell * z || s.x > cw + cell * z) continue;
          if (s.y < -cell * z || s.y > ch + cell * z) continue;
          const e = terrainCache.grid[gy][gx];
          let color;
          if (e < -0.8) color = '#1a2a4a';          // 深海
          else if (e < -0.3) color = '#3a6a8a';     // 浅海
          else if (e < 0.2) color = '#5a7a3a';      // 平原/草地
          else if (e < 0.6) color = '#8a6a3a';      // 山丘
          else if (e < 1.0) color = '#6a6a6a';      // 山地
          else color = '#eeeeee';                   // 雪山
          ctx.fillStyle = color;
          ctx.fillRect(Math.floor(s.x), Math.floor(s.y), Math.ceil(cell * z + 1), Math.ceil(cell * z + 1));
        }
      }
    }

    // 势力边界（简化：在地点附近绘制势力小标识）
    for (const s of state.settlements) {
      const pos = worldToScreen(s.x, s.y);
      if (pos.x < -40 || pos.x > cw + 40 || pos.y < -40 || pos.y > ch + 40) continue;
      // 绘制隶属关系 - 村庄与母城的线
      if (s.type === 'village' && s.parentId) {
        const parent = state.settlements.find(p => p.id === s.parentId);
        if (parent) {
          const pp = worldToScreen(parent.x, parent.y);
          ctx.strokeStyle = 'rgba(200,150,80,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pp.x, pp.y);
          ctx.stroke();
        }
      }
    }

    // 按类型排序绘制（城堡在村落后，城镇在最前）
    const sorted = [...state.settlements].sort((a, b) => {
      const ord = { village: 0, castle: 1, town: 2 };
      return ord[a.type] - ord[b.type];
    });
    for (const s of sorted) {
      const pos = worldToScreen(s.x, s.y);
      if (pos.x < -40 || pos.x > cw + 40 || pos.y < -40 || pos.y > ch + 40) continue;
      const faction = GameData.FACTIONS.find(f => f.id === s.faction);
      const color = faction ? faction.color : '#888';
      drawSettlement(pos.x, pos.y, s.type, color, s === hoverSettlement);
    }

    // 绘制地图上的队伍（AI和玩家）
    for (const p of state.parties) {
      const pos = worldToScreen(p.x, p.y);
      if (pos.x < -20 || pos.x > cw + 20 || pos.y < -20 || pos.y > ch + 20) continue;
      drawParty(pos.x, pos.y, p);
    }

    // 绘制玩家移动目标指示
    if (Game.getTargetMove()) {
      const t = worldToScreen(Game.getTargetMove().x, Game.getTargetMove().y);
      ctx.strokeStyle = '#d4b862';
      ctx.lineWidth = 2;
      const r = 8 + Math.sin(performance.now() / 200) * 3;
      ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.stroke();
    }

    // 鼠标悬停地点提示
    if (hoverSettlement) {
      const pos = worldToScreen(hoverSettlement.x, hoverSettlement.y);
      const facName = GameData.FACTIONS.find(f => f.id === hoverSettlement.faction)?.name || hoverSettlement.faction;
      const text = hoverSettlement.name + ' [' + facName + ']';
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(pos.x + 10, pos.y - 30, text.length * 8 + 10, 20);
      ctx.fillStyle = '#d4b862';
      ctx.font = '12px Courier New';
      ctx.fillText(text, pos.x + 15, pos.y - 16);
    }
  }

  function drawSettlement(x, y, type, color, hover) {
    ctx.save();
    if (hover) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    if (type === 'town') {
      // 城镇：较大的方形建筑群
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 10, y - 8, 20, 14);
      ctx.fillStyle = color;
      ctx.fillRect(x - 8, y - 6, 16, 4);
      ctx.fillRect(x - 6, y - 10, 12, 4);
      // 旗帜
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - 16, 2, 8);
      ctx.fillRect(x + 1, y - 14, 5, 3);
    } else if (type === 'castle') {
      // 城堡：堡垒形
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x - 8, y - 6, 16, 12);
      ctx.fillStyle = color;
      ctx.fillRect(x - 8, y - 8, 4, 4);
      ctx.fillRect(x + 4, y - 8, 4, 4);
      ctx.fillRect(x - 2, y - 10, 4, 4);
      // 旗帜
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - 14, 2, 6);
    } else {
      // 村庄：小屋
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 5, y - 2, 10, 6);
      ctx.fillStyle = color;
      ctx.fillRect(x - 5, y - 4, 10, 3);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x - 1, y - 0, 2, 3);
    }
    ctx.restore();
  }

  function drawParty(x, y, p) {
    ctx.save();
    let color = '#d4b862';
    let size = 4;
    if (p.type === 'player') { color = '#d4b862'; size = 5; }
    else if (p.type === 'lord_party') {
      const fac = GameData.FACTIONS.find(f => f.id === p.faction);
      color = fac ? fac.color : '#aaa';
      size = 4;
    } else if (p.type === 'caravan') {
      color = '#6ac4a0'; size = 3;
    } else if (p.type === 'bandit') {
      color = '#c46a6a'; size = 3;
    } else if (p.type === 'bandit_lord') {
      color = '#a03030'; size = 4;
    }
    // 绘制像素小人
    ctx.fillStyle = color;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.fillStyle = '#2a2a1a';
    ctx.fillRect(x - size, y - size, size * 2, 1);
    if (p.type === 'player') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size - 1, y - size - 1, size * 2 + 2, size * 2 + 2);
    }
    ctx.restore();
  }

  // ========= 战斗渲染 =========
  function renderBattle(state, dt) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    // 战场背景
    ctx.fillStyle = '#3a4a2a';
    ctx.fillRect(0, 0, cw, ch);
    // 草地像素纹理
    ctx.fillStyle = '#2a3a1a';
    for (let i = 0; i < 200; i++) {
      const gx = (i * 91) % cw;
      const gy = (i * 37) % ch;
      ctx.fillRect(gx, gy, 2, 2);
    }
    // 缩放战斗单位
    const scaleX = cw / 900;
    const scaleY = ch / 500;
    const scale = Math.min(scaleX, scaleY);
    ctx.save();
    ctx.translate(cw / 2 - 900 * scale / 2, ch / 2 - 500 * scale / 2);
    ctx.scale(scale, scale);
    // 绘制所有单位
    const alive = [...state.player, ...state.enemy].filter(u => u.hp > 0);
    for (const u of alive) {
      const color = u.side === 'player' ? (u.isHero ? '#e0d080' : '#6ac4a0') : '#c46a6a';
      // 身体
      ctx.fillStyle = color;
      ctx.fillRect(u.x - 6, u.y - 8, 12, 16);
      // 头
      ctx.fillStyle = '#f0d8a8';
      ctx.fillRect(u.x - 4, u.y - 12, 8, 6);
      // HP条
      ctx.fillStyle = '#2a1a1a';
      ctx.fillRect(u.x - 10, u.y - 20, 20, 3);
      ctx.fillStyle = u.side === 'player' ? '#6ac46a' : '#c46a6a';
      ctx.fillRect(u.x - 10, u.y - 20, Math.floor(20 * u.hp / u.maxHp), 3);
    }
    // 投射物
    for (const p of state.projectiles || []) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    // 命中特效
    for (const e of state.effects || []) {
      const alpha = e.life / 0.3;
      ctx.fillStyle = 'rgba(255,200,80,' + alpha.toFixed(2) + ')';
      ctx.fillRect(e.x - 4, e.y - 4, 8, 8);
    }
    ctx.restore();
  }

  // ========= HUD =========
  function renderHUD(state) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const p = Character.get();
    const w = World.get();
    const pp = World.getPlayerParty();
    // 顶部状态
    ctx.fillStyle = 'rgba(20,20,30,0.8)';
    ctx.fillRect(10, 10, 280, 50);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(10, 10, 280, 50);
    ctx.fillStyle = '#d4b862';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(p.name + '  Lv.' + p.level, 20, 28);
    ctx.fillStyle = '#e8e4d4';
    ctx.font = '12px Courier New';
    ctx.fillText('第' + Math.floor(w.day + 1) + '天 · ' + p.gold + '金', 20, 46);
    // HP条
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(120, 20, 160, 8);
    ctx.fillStyle = '#c46a6a';
    ctx.fillRect(120, 20, Math.floor(160 * p.hp / p.maxHp), 8);
    // EXP
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(120, 32, 160, 6);
    ctx.fillStyle = '#6ac46a';
    ctx.fillRect(120, 32, Math.floor(160 * p.exp / p.expNext), 6);
    ctx.fillStyle = '#8b7355';
    ctx.font = '10px Courier New';
    ctx.fillText('队伍: ' + Party.getTroopCount(pp) + ' 战力: ' + Party.calcPartyStrength(pp), 20, 54);

    // 右下角 mini map
    const mapW = 150, mapH = 100;
    const mx = cw - mapW - 10, my = 10;
    ctx.fillStyle = 'rgba(20,20,30,0.85)';
    ctx.fillRect(mx, my, mapW, mapH);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(mx, my, mapW, mapH);
    const sx = mapW / w.mapSize.w, sy = mapH / w.mapSize.h;
    for (const s of w.settlements) {
      const px = mx + s.x * sx, py = my + s.y * sy;
      if (s.type === 'town') ctx.fillStyle = '#d4b862';
      else if (s.type === 'castle') ctx.fillStyle = '#aaa';
      else ctx.fillStyle = '#6a8a6a';
      ctx.fillRect(px - 1, py - 1, s.type === 'town' ? 3 : 2, s.type === 'town' ? 3 : 2);
    }
    // 玩家
    if (pp) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(mx + pp.x * sx - 2, my + pp.y * sy - 2, 4, 4);
    }
  }

  function getHoverSettlement(x, y) {
    return hoverSettlement;
  }

  function setHoverFromScreen(x, y) {
    const w = World.get();
    if (!w) return null;
    const worldPos = screenToWorld(x, y);
    let best = null, bestD = 25;
    for (const s of w.settlements) {
      const d = Math.hypot(s.x - worldPos.x, s.y - worldPos.y);
      if (d < bestD) { bestD = d; best = s; }
    }
    hoverSettlement = best;
    return best;
  }

  function findPartyNear(x, y) {
    const w = World.get();
    const worldPos = screenToWorld(x, y);
    let best = null, bestD = 20;
    for (const p of w.parties) {
      if (p.type === 'player') continue;
      const d = Math.hypot(p.x - worldPos.x, p.y - worldPos.y);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  return {
    init, resize, generateTerrain, renderWorld, renderBattle, renderHUD,
    getCamera, setCameraTarget, panCamera, worldToScreen, screenToWorld,
    getHoverSettlement, setHoverFromScreen, findPartyNear
  };
})();
