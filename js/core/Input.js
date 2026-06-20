// ================================
// 大陆风云 - 输入管理
// ================================

export class Input {
  constructor(canvas) {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      clicked: false
    };
    this.keysJustPressed = {};
    
    this.setupListeners(canvas);
  }
  
  setupListeners(canvas) {
    // 键盘事件
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.keysJustPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    // 鼠标事件
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });
    
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.clicked = true;
      }
    });
    
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.down = false;
      }
    });
    
    // 阻止右键菜单
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  // 检查按键是否按下
  isKeyDown(code) {
    return this.keys[code] || false;
  }
  
  // 检查按键是否刚刚按下
  isKeyJustPressed(code) {
    return this.keysJustPressed[code] || false;
  }
  
  // 清除刚按下的状态
  clearJustPressed() {
    this.keysJustPressed = {};
  }
  
  // 检查鼠标是否按下
  isMouseDown() {
    return this.mouse.down;
  }
  
  // 检查鼠标是否刚刚点击
  isMouseClicked() {
    return this.mouse.clicked;
  }
  
  // 清除鼠标点击状态
  clearMouseClicked() {
    this.mouse.clicked = false;
  }
  
  // 获取鼠标位置
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }
}
