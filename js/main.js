// ================================
// 大陆风云 - 游戏入口
// ================================

import { Game } from './core/Game.js';
import { Input } from './core/Input.js';
import { Renderer } from './core/Renderer.js';
import { SaveLoadManager } from './core/SaveLoad.js';
import { AudioManager } from './core/Audio.js';
import { UIManager } from './ui/UIManager.js';

// 全局游戏实例
let game = null;

// 初始化游戏
function init() {
  const canvas = document.getElementById('game-canvas');
  
  // 设置Canvas尺寸
  canvas.width = 1280;
  canvas.height = 720;
  
  // 禁用图像平滑 (像素风格)
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // 创建核心系统
  const input = new Input(canvas);
  const renderer = new Renderer(ctx, canvas.width, canvas.height);
  const saveLoad = new SaveLoadManager();
  const audio = new AudioManager();
  const uiManager = new UIManager();
  
  // 创建游戏实例
  game = new Game(canvas, input, renderer, saveLoad, audio, uiManager);
  
  // 设置UI回调
  setupUICallbacks();
  
  // 显示主菜单
  showMainMenu();
  
  // 启动游戏循环
  game.start();
}

// 设置UI回调
function setupUICallbacks() {
  const ui = game.uiManager;
  
  // 主菜单按钮
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('character-create');
    hideScreen('main-menu');
  });
  
  document.getElementById('btn-load-game').addEventListener('click', () => {
    loadSaveSlots();
    showScreen('load-game');
    hideScreen('main-menu');
  });
  
  document.getElementById('btn-settings').addEventListener('click', () => {
    showScreen('settings-menu');
    hideScreen('main-menu');
  });
  
  // 设置菜单
  document.getElementById('btn-back-from-settings').addEventListener('click', () => {
    showScreen('main-menu');
    hideScreen('settings-menu');
  });
  
  // 角色创建
  document.getElementById('btn-start-game').addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim() || '无名旅人';
    const difficultyBtns = document.querySelectorAll('.diff-btn');
    let difficulty = 'normal';
    difficultyBtns.forEach(btn => {
      if (btn.classList.contains('active')) {
        difficulty = btn.dataset.diff;
      }
    });
    
    game.startNewGame(name, difficulty);
    showScreen('game-ui');
    hideScreen('character-create');
    game.setState('world');
  });
  
  document.getElementById('btn-back-from-create').addEventListener('click', () => {
    showScreen('main-menu');
    hideScreen('character-create');
  });
  
  // 加载游戏
  document.getElementById('btn-back-from-load').addEventListener('click', () => {
    showScreen('main-menu');
    hideScreen('load-game');
  });
  
  // 难度选择
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 游戏内UI按钮
  document.getElementById('btn-menu').addEventListener('click', () => {
    game.setState('paused');
    showScreen('pause-menu');
    hideScreen('game-ui');
  });
  
  document.getElementById('btn-map').addEventListener('click', () => {
    game.toggleMapView();
  });
  
  document.getElementById('btn-inventory').addEventListener('click', () => {
    ui.showPanel('inventory');
    updateInventoryUI();
  });
  
  document.getElementById('btn-character').addEventListener('click', () => {
    ui.showPanel('character');
    updateCharacterUI();
  });
  
  document.getElementById('btn-party').addEventListener('click', () => {
    ui.showPanel('party');
    updatePartyUI();
  });
  
  // 暂停菜单
  document.getElementById('btn-resume').addEventListener('click', () => {
    game.setState('world');
    showScreen('game-ui');
    hideScreen('pause-menu');
  });
  
  document.getElementById('btn-save').addEventListener('click', () => {
    game.saveCurrentGame(0);
    alert('游戏已保存');
  });
  
  document.getElementById('btn-main-menu').addEventListener('click', () => {
    showScreen('main-menu');
    hideScreen('pause-menu');
    hideScreen('game-ui');
    game.setState('menu');
  });
  
  // 面板关闭按钮
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.panel;
      ui.hidePanel(panelId);
    });
  });
  
  // 部队标签页
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (tab === 'army') {
        document.getElementById('army-content').classList.remove('hidden');
        document.getElementById('caravan-content').classList.add('hidden');
      } else {
        document.getElementById('army-content').classList.add('hidden');
        document.getElementById('caravan-content').classList.remove('hidden');
      }
    });
  });
}

// 显示屏幕
function showScreen(screenId) {
  document.getElementById(screenId).classList.remove('hidden');
}

// 隐藏屏幕
function hideScreen(screenId) {
  document.getElementById(screenId).classList.add('hidden');
}

// 加载存档位
function loadSaveSlots() {
  const slots = game.saveLoad.listSaves();
  const saveSlotElements = document.querySelectorAll('.save-slot');
  
  saveSlotElements.forEach((slotEl, index) => {
    if (slots[index]) {
      slotEl.classList.remove('empty');
      const info = slotEl.querySelector('.slot-info');
      const data = slots[index];
      const date = new Date(data.timestamp);
      info.textContent = `${data.player.name} - ${date.toLocaleDateString()}`;
      slotEl.onclick = () => loadGame(index);
    } else {
      slotEl.classList.add('empty');
      slotEl.querySelector('.slot-info').textContent = '空';
      slotEl.onclick = null;
    }
  });
}

// 加载游戏
function loadGame(slotIndex) {
  const data = game.saveLoad.load(slotIndex);
  if (data) {
    game.loadGame(data);
    showScreen('game-ui');
    hideScreen('load-game');
    game.setState('world');
  }
}

// 更新背包UI
function updateInventoryUI() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  
  const inventory = game.player.inventory;
  const slots = inventory.slots;
  
  for (let i = 0; i < inventory.maxSlots; i++) {
    const slotEl = document.createElement('div');
    slotEl.className = 'inventory-slot' + (slots[i] ? '' : ' empty');
    
    if (slots[i]) {
      slotEl.textContent = slots[i].icon || '?';
      slotEl.title = slots[i].name;
    }
    
    slotEl.addEventListener('click', () => {
      if (slots[i]) {
        showItemDetails(slots[i]);
      }
    });
    
    grid.appendChild(slotEl);
  }
}

// 显示物品详情
function showItemDetails(item) {
  const details = document.getElementById('inventory-details');
  details.innerHTML = `
    <h4>${item.name}</h4>
    <p>类型: ${item.type}</p>
    <p>品质: ${item.quality || '普通'}</p>
    ${item.damage ? `<p>伤害: ${item.damage}</p>` : ''}
    ${item.defense ? `<p>防御: ${item.defense}</p>` : ''}
    <p>价格: ${item.price}</p>
    <p>${item.description || ''}</p>
  `;
}

// 更新角色UI
function updateCharacterUI() {
  const p = game.player;
  document.getElementById('char-level').textContent = p.level;
  document.getElementById('char-exp').textContent = `${p.exp}/${p.expToNext}`;
  document.getElementById('char-str').textContent = p.attributes.strength;
  document.getElementById('char-agi').textContent = p.attributes.agility;
  document.getElementById('char-vit').textContent = p.attributes.vitality;
  document.getElementById('char-int').textContent = p.attributes.intelligence;
  document.getElementById('char-cha').textContent = p.attributes.charisma;
  
  // 技能列表
  const skillList = document.getElementById('skill-list');
  skillList.innerHTML = '';
  Object.keys(p.skills).forEach(skillName => {
    const skill = p.skills[skillName];
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.textContent = `${skillName} Lv.${skill.level}`;
    skillList.appendChild(tag);
  });
}

// 更新部队UI
function updatePartyUI() {
  // 更新军团列表
  const armyList = document.getElementById('army-list');
  armyList.innerHTML = '';
  
  if (game.player.army && game.player.army.units.length > 0) {
    game.player.army.units.forEach(unit => {
      const item = document.createElement('div');
      item.className = 'unit-item';
      item.innerHTML = `
        <span>${unit.name}</span>
        <span>HP: ${unit.hp}/${unit.maxHp}</span>
      `;
      armyList.appendChild(item);
    });
  } else {
    armyList.innerHTML = '<p style="font-size:10px;text-align:center;">暂无军团成员</p>';
  }
  
  // 更新商队列表
  const caravanList = document.getElementById('caravan-list');
  caravanList.innerHTML = '';
  
  if (game.player.caravan) {
    const item = document.createElement('div');
    item.className = 'unit-item';
    item.innerHTML = `
      <span>商队</span>
      <span>货物价值: ${game.player.caravan.goodsValue}</span>
    `;
    caravanList.appendChild(item);
  } else {
    caravanList.innerHTML = '<p style="font-size:10px;text-align:center;">暂无商队</p>';
  }
}

// 更新游戏UI状态
function updateGameUI() {
  if (!game || !game.player) return;
  
  const p = game.player;
  
  // 金币
  document.getElementById('gold-display').textContent = `💰 ${p.gold}`;
  
  // 日期
  const day = game.world.day;
  document.getElementById('date-display').textContent = `第${day}天`;
  
  // 位置
  const loc = game.currentLocation || '大地图';
  document.getElementById('location-display').textContent = loc;
  
  // HP条
  const hpPercent = (p.currentHp / p.maxHp) * 100;
  document.getElementById('hp-fill').style.width = `${hpPercent}%`;
  document.getElementById('hp-text').textContent = `${Math.floor(p.currentHp)}/${p.maxHp}`;
  
  // 体力条
  const staminaPercent = (p.currentStamina / p.maxStamina) * 100;
  document.getElementById('stamina-fill').style.width = `${staminaPercent}%`;
  document.getElementById('stamina-text').textContent = `${Math.floor(p.currentStamina)}/${p.maxStamina}`;
}

// 暴露给game调用的更新函数
window.updateGameUI = updateGameUI;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
