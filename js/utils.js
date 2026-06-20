// ===== 工具函数库 =====
const Utils = (() => {
  // 伪随机数生成器（可重现）
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function() {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = r + Math.imul(r ^ (r >>> 7), 61 | r) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function weightedChoice(items) {
    let total = 0;
    for (const it of items) total += it.w;
    let r = Math.random() * total;
    for (const it of items) { if ((r -= it.w) <= 0) return it.v; }
    return items[items.length - 1].v;
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function dist2(a, b) { const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }
  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function uid() { return '_' + Math.random().toString(36).substr(2, 9); }

  function formatTime(day) {
    const d = Math.floor(day);
    const h = Math.floor((day - d) * 24);
    return `第${d + 1}天 ${String(h).padStart(2,'0')}:00`;
  }
  function formatNum(n) { return Math.floor(n).toLocaleString('zh-CN'); }

  // 泊松盘采样（用于生成分布较均匀的地点）
  function poissonSample(width, height, minDist, count, seed) {
    const rng = mulberry32(seed);
    const pts = [];
    let attempts = 0;
    const maxAttempts = count * 50;
    while (pts.length < count && attempts < maxAttempts) {
      attempts++;
      const p = { x: rng() * width, y: rng() * height };
      let ok = true;
      for (const q of pts) {
        if (Math.hypot(p.x - q.x, p.y - q.y) < minDist) { ok = false; break; }
      }
      if (ok) pts.push(p);
    }
    return pts;
  }

  // 简单噪声
  function noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  return {
    mulberry32, rand, randInt, choice, weightedChoice,
    dist, dist2, clamp, lerp, uid,
    formatTime, formatNum, poissonSample, noise
  };
})();
