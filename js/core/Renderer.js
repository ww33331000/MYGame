// ================================
// 大陆风云 - 渲染器
// ================================

export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // 像素风格设置
    this.applyPixelStyle();
  }
  
  applyPixelStyle() {
    // 禁用抗锯齿
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }
  
  // 清空画布
  clear(color = '#0a0a15') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  // 设置相机
  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }
  
  // 应用相机变换
  applyCameraTransform() {
    this.ctx.save();
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }
  
  // 取消相机变换
  restoreCameraTransform() {
    this.ctx.restore();
  }
  
  // 绘制精灵
  drawSprite(sprite, x, y, width = null, height = null, flipX = false) {
    if (!sprite || !sprite.image) return;
    
    const w = width || sprite.width;
    const h = height || sprite.height;
    
    this.ctx.save();
    
    if (flipX) {
      this.ctx.translate(x + w, y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(sprite.image, 0, 0, w, h);
    } else {
      this.ctx.drawImage(sprite.image, x, y, w, h);
    }
    
    this.ctx.restore();
  }
  
  // 绘制像素矩形
  drawPixelRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
  }
  
  // 绘制像素边框矩形
  drawPixelRectOutline(x, y, width, height, color, lineWidth = 2) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(Math.floor(x), Math.floor(y), width, height);
  }
  
  // 绘制圆形
  drawCircle(x, y, radius, color, fill = true) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }
  
  // 绘制线条
  drawLine(x1, y1, x2, y2, color, lineWidth = 2) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
  
  // 绘制文字
  drawText(text, x, y, options = {}) {
    const {
      color = '#ffffff',
      size = 16,
      align = 'left',
      baseline = 'top',
      font = '"Press Start 2P", monospace'
    } = options;
    
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px ${font}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }
  
  // 绘制带阴影的文字
  drawTextShadow(text, x, y, options = {}) {
    const {
      shadowColor = '#000000',
      shadowOffsetX = 2,
      shadowOffsetY = 2,
      ...rest
    } = options;
    
    // 绘制阴影
    this.drawText(text, x + shadowOffsetX, y + shadowOffsetY, {
      ...rest,
      color: shadowColor
    });
    
    // 绘制主文字
    this.drawText(text, x, y, options);
  }
  
  // 绘制血条
  drawHealthBar(x, y, width, height, current, max, color = '#ff4444', bgColor = '#333333') {
    const percent = Math.max(0, Math.min(1, current / max));
    
    // 背景
    this.drawPixelRect(x, y, width, height, bgColor);
    
    // 血量
    if (percent > 0) {
      this.drawPixelRect(x, y, width * percent, height, color);
    }
    
    // 边框
    this.drawPixelRectOutline(x, y, width, height, '#ffffff', 1);
  }
  
  // 绘制进度条
  drawProgressBar(x, y, width, height, progress, color, bgColor = '#333333') {
    this.drawHealthBar(x, y, width, height, progress, 1, color, bgColor);
  }
  
  // 绘制网格
  drawGrid(cellSize, color = 'rgba(255,255,255,0.1)') {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    
    const startX = Math.floor(this.camera.x / cellSize) * cellSize;
    const startY = Math.floor(this.camera.y / cellSize) * cellSize;
    
    for (let x = startX; x < this.camera.x + this.width / this.camera.zoom + cellSize; x += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.camera.y);
      this.ctx.lineTo(x, this.camera.y + this.height / this.camera.zoom);
      this.ctx.stroke();
    }
    
    for (let y = startY; y < this.camera.y + this.height / this.camera.zoom + cellSize; y += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.camera.x, y);
      this.ctx.lineTo(this.camera.x + this.width / this.camera.zoom, y);
      this.ctx.stroke();
    }
  }
  
  // 绘制带纹理的矩形
  drawTexturedRect(x, y, width, height, color, texturePattern = null) {
    if (texturePattern) {
      this.ctx.fillStyle = texturePattern;
    } else {
      this.ctx.fillStyle = color;
    }
    this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
  }
  
  // 批量绘制相同颜色的矩形
  drawBatchRects(rects, color) {
    this.ctx.fillStyle = color;
    for (const rect of rects) {
      this.ctx.fillRect(Math.floor(rect.x), Math.floor(rect.y), rect.width, rect.height);
    }
  }
}
