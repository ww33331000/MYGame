// ================================
// 大陆风云 - UI管理器
// ================================

export class UIManager {
  constructor() {
    this.panels = new Map();
    this.dialogs = [];
    this.tooltips = [];
    this.hoveredElement = null;
  }
  
  // 显示面板
  showPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.remove('hidden');
      this.panels.set(panelId, panel);
    }
  }
  
  // 隐藏面板
  hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('hidden');
      this.panels.delete(panelId);
    }
  }
  
  // 切换面板
  togglePanel(panelId) {
    if (this.panels.has(panelId)) {
      this.hidePanel(panelId);
    } else {
      this.showPanel(panelId);
    }
  }
  
  // 隐藏所有面板
  hideAllPanels() {
    for (const panelId of this.panels.keys()) {
      this.hidePanel(panelId);
    }
  }
  
  // 显示对话框
  showDialog(config) {
    const {
      speaker = '',
      portrait = '',
      message = '',
      choices = []
    } = config;
    
    const dialogBox = document.getElementById('dialog-box');
    if (!dialogBox) return;
    
    // 设置内容
    document.getElementById('dialog-name').textContent = speaker;
    document.getElementById('dialog-message').textContent = message;
    
    const portraitImg = document.getElementById('dialog-portrait-img');
    if (portraitImg) {
      portraitImg.src = portrait || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23333" width="64" height="64"/></svg>';
    }
    
    // 设置选项
    const choicesContainer = document.getElementById('dialog-choices');
    if (choicesContainer) {
      choicesContainer.innerHTML = '';
      
      choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'dialog-choice';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
          if (choice.action) {
            choice.action();
          }
          this.hideDialog();
        });
        choicesContainer.appendChild(btn);
      });
    }
    
    dialogBox.classList.remove('hidden');
    this.dialogs.push(dialogBox);
  }
  
  // 隐藏对话框
  hideDialog() {
    const dialogBox = document.getElementById('dialog-box');
    if (dialogBox) {
      dialogBox.classList.add('hidden');
      this.dialogs = this.dialogs.filter(d => d !== dialogBox);
    }
  }
  
  // 显示提示
  showTooltip(text, x, y) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: rgba(0,0,0,0.9);
      color: #fff;
      padding: 5px 10px;
      font-size: 10px;
      font-family: "Press Start 2P", monospace;
      pointer-events: none;
      z-index: 1000;
      border: 2px solid #c9a227;
    `;
    
    document.body.appendChild(tooltip);
    this.tooltips.push(tooltip);
    
    return tooltip;
  }
  
  // 隐藏提示
  hideTooltip(tooltip) {
    if (tooltip && tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
      this.tooltips = this.tooltips.filter(t => t !== tooltip);
    }
  }
  
  // 显示通知
  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(74, 55, 40, 0.95);
      color: #c9a227;
      padding: 15px 30px;
      font-size: 12px;
      font-family: "Press Start 2P", monospace;
      border: 3px solid #c9a227;
      z-index: 1000;
      animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
  
  // 显示加载画面
  showLoading(message = '加载中...') {
    const loading = document.createElement('div');
    loading.id = 'loading-screen';
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a15;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    
    loading.innerHTML = `
      <div style="color: #c9a227; font-size: 24px; font-family: 'Press Start 2P', monospace; margin-bottom: 20px;">
        ${message}
      </div>
      <div style="width: 200px; height: 20px; background: #333; border: 2px solid #c9a227;">
        <div id="loading-bar" style="width: 0%; height: 100%; background: #c9a227; transition: width 0.3s;"></div>
      </div>
    `;
    
    document.body.appendChild(loading);
    
    return {
      setProgress: (percent) => {
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = percent + '%';
      },
      hide: () => {
        if (loading.parentNode) {
          loading.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => loading.parentNode && loading.parentNode.removeChild(loading), 300);
        }
      }
    };
  }
  
  // 创建确认对话框
  showConfirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const box = document.createElement('div');
    box.style.cssText = `
      background: #2d2d44;
      border: 4px solid #c9a227;
      padding: 30px;
      text-align: center;
      max-width: 400px;
    `;
    
    box.innerHTML = `
      <p style="color: #e8d5b7; font-size: 12px; font-family: 'Press Start 2P', monospace; margin-bottom: 20px;">
        ${message}
      </p>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="confirm-yes" style="font-family: 'Press Start 2P', monospace; font-size: 10px; padding: 10px 20px; background: #4a3728; border: 2px solid #c9a227; color: #e8d5b7; cursor: pointer;">是</button>
        <button id="confirm-no" style="font-family: 'Press Start 2P', monospace; font-size: 10px; padding: 10px 20px; background: #4a3728; border: 2px solid #c9a227; color: #e8d5b7; cursor: pointer;">否</button>
      </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    document.getElementById('confirm-yes').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });
    
    document.getElementById('confirm-no').addEventListener('click', () => {
      overlay.remove();
      if (onCancel) onCancel();
    });
  }
  
  // 创建选择界面
  showSelection(title, options, onSelect) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const box = document.createElement('div');
    box.style.cssText = `
      background: #2d2d44;
      border: 4px solid #c9a227;
      padding: 30px;
      min-width: 300px;
    `;
    
    box.innerHTML = `
      <h3 style="color: #c9a227; font-size: 14px; font-family: 'Press Start 2P', monospace; margin-bottom: 20px; text-align: center;">
        ${title}
      </h3>
      <div id="selection-options" style="display: flex; flex-direction: column; gap: 10px;">
      </div>
    `;
    
    const optionsContainer = box.querySelector('#selection-options');
    options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        padding: 10px 15px;
        background: #4a3728;
        border: 2px solid #6b4423;
        color: #e8d5b7;
        cursor: pointer;
        text-align: left;
      `;
      btn.textContent = opt.label || opt;
      btn.addEventListener('click', () => {
        overlay.remove();
        if (onSelect) onSelect(index, opt);
      });
      btn.addEventListener('mouseover', () => {
        btn.style.borderColor = '#c9a227';
        btn.style.background = '#6b4423';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.borderColor = '#6b4423';
        btn.style.background = '#4a3728';
      });
      optionsContainer.appendChild(btn);
    });
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    // 点击外部关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);
