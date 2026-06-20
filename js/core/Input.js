// ============ 输入管理 ============
const Input = {
  keys: {},
  mouse: { x: 0, y: 0, down: false, clicked: false, rightClicked: false, rightDown: false },
  canvasRect: null,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { this.mouse.down = true; this.mouse.clicked = true; }
      if (e.button === 2) { this.mouse.rightDown = true; this.mouse.rightClicked = true; }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 触摸支持
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.mouse.x = (t.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (t.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.down = true;
      this.mouse.clicked = true;
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.mouse.x = (t.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (t.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('touchend', (e) => { this.mouse.down = false; });
  },

  update() {
    // clicked在使用后需手动重置
  },

  consumeClick() { const c = this.mouse.clicked; this.mouse.clicked = false; return c; },
  consumeRightClick() { const c = this.mouse.rightClicked; this.mouse.rightClicked = false; return c; },

  isDown(key) { return !!this.keys[key.toLowerCase()]; }
};
