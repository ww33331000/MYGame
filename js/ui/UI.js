// ============ UI管理器 ============
class UIManager {
  constructor() {
    this.panels = [];
    this.toastLayer = null;
    this.currentSettlement = null;
    this.currentQuestView = null;
  }

  // 每帧更新
  update() {
    // 可以在这里做动态 UI 更新
  }

  // 渲染到画布
  render(ctx) {
    if (!Game.player) return;
    // 左上角 - 状态栏
    const w = Game.canvas.width;
    const h = Game.canvas.height;
    // 时间信息
    const timeOfDay = ((Game.gameTime % 86400) / 3600);
    const timeLabel = timeOfDay < 6 ? '深夜' : (timeOfDay < 12 ? '上午' : (timeOfDay < 18 ? '下午' : '夜晚'));
    // 顶部状态栏
    ctx.fillStyle = 'rgba(15,15,30,0.92)';
    ctx.fillRect(8, 8, 280, 100);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 280, 100);
    // 内描边
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(11, 11, 274, 94);
    // 文本
    ctx.font = 'bold 14px "Microsoft YaHei"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4d35e';
    ctx.fillText('📅 第 ' + (Game.dayCount || 1) + ' 天', 18, 28);
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillStyle = '#b89856';
    ctx.fillText('🕐 ' + Math.floor(timeOfDay) + ':' + String(Math.floor((timeOfDay * 60) % 60)).padStart(2, '0') + ' ' + timeLabel, 18, 46);
    ctx.fillStyle = '#f4d35e';
    ctx.fillText('💰 ' + (Game.player.party.gold || 0) + ' 金币', 18, 66);
    ctx.fillStyle = '#78d878';
    ctx.fillText('👥 部队 ' + Game.player.party.members.filter(m => !m.isDead).length + '/' + Game.player.party.members.length, 130, 66);
    // HP条
    const hpPct = Math.max(0, Game.player.hp / Game.player.maxHp);
    ctx.fillStyle = '#3a1e1e';
    ctx.fillRect(18, 76, 260, 10);
    ctx.fillStyle = '#d84848';
    ctx.fillRect(18, 76, 260 * hpPct, 10);
    ctx.strokeStyle = '#5a1e1e';
    ctx.strokeRect(18, 76, 260, 10);
    // HP文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('HP ' + Math.floor(Game.player.hp) + ' / ' + Game.player.maxHp, 148, 84);
    // 士气条
    const moralePct = Game.player.party.morale / 100;
    ctx.fillStyle = '#1e1e3a';
    ctx.fillRect(18, 90, 260, 8);
    ctx.fillStyle = moralePct > 0.5 ? '#5a8aaa' : (moralePct > 0.3 ? '#b89856' : '#aa3a3a');
    ctx.fillRect(18, 90, 260 * moralePct, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Microsoft YaHei"';
    ctx.textAlign = 'right';
    ctx.fillText('士气 ' + Game.player.party.morale + '%', 270, 97);
    // 部队战力
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4d35e';
    ctx.font = 'bold 11px "Microsoft YaHei"';
    ctx.fillText('⚔ ' + Game.player.party.power, 18, 113);
    // 声望
    ctx.fillStyle = '#b89856';
    ctx.fillText('⭐ ' + Game.player.reputation, 80, 113);
    // 等级
    ctx.fillStyle = '#78d878';
    ctx.fillText('Lv' + Game.player.level, 140, 113);
    // 城镇信息（如果在某地）
    if (this.currentSettlement) {
      ctx.fillStyle = '#4abac8';
      ctx.fillText('📍 ' + this.currentSettlement.name, 190, 113);
    }
    ctx.textAlign = 'left';
  }

  clearPanels() {
    const uilayer = document.getElementById('ui-layer');
    if (uilayer) uilayer.innerHTML = '';
    this.panels = [];
  }

  addPanel(html, options) {
    options = options || {};
    const uilayer = document.getElementById('ui-layer');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.position = 'absolute';
    panel.style.left = options.left || '50%';
    panel.style.top = options.top || '50%';
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.zIndex = 10 + this.panels.length;
    panel.style.minWidth = options.width || '500px';
    panel.style.maxWidth = '90%';
    panel.style.maxHeight = '90%';
    panel.style.overflowY = 'auto';
    panel.style.pointerEvents = 'auto';
    panel.innerHTML = html;
    uilayer.appendChild(panel);
    this.panels.push(panel);
    return panel;
  }

  // 主菜单
  showMainMenu() {
    const hasSaves = SaveSystem.hasAnySave();
    const hasAutoSave = SaveSystem.hasAutoSave();
    const html = `
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:auto;background:rgba(15,15,30,0.95);padding:50px 80px;border:3px solid #8a7a3e;border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,0.8),inset 0 0 30px rgba(244,211,94,0.05);">
        <h1 style="color:#f4d35e;font-size:48px;margin-bottom:12px;letter-spacing:8px;text-shadow:3px 3px 0 #3a2e1a,0 0 20px rgba(244,211,94,0.3);">铁骑风云</h1>
        <p style="color:#b89856;margin-bottom:40px;letter-spacing:4px;font-size:14px;">像素开放世界 · 骑马与砍杀风格</p>
        <div style="display:flex;flex-direction:column;gap:12px;align-items:center;">
          <button class="ui-btn primary" id="btn-new-game" style="padding:14px 60px;font-size:18px;min-width:260px;">开 始 新 游 戏</button>
          <button class="ui-btn" id="btn-continue" style="padding:12px 60px;font-size:16px;min-width:260px;" ${hasSaves ? '' : 'disabled'}>继 续 游 戏${hasSaves ? '' : ' (无存档)'}</button>
          <button class="ui-btn" id="btn-load" style="padding:12px 60px;font-size:16px;min-width:260px;" ${hasSaves ? '' : 'disabled'}>读 取 存 档</button>
          <button class="ui-btn" id="btn-help" style="padding:10px 60px;font-size:14px;min-width:260px;">游 戏 帮 助</button>
        </div>
        <p style="color:#6a6a7a;margin-top:30px;font-size:11px;">快捷键: F5 快速存档 · F9 快速读档 · ESC 关闭面板</p>
      </div>`;
    const panel = this.addPanel(html, { width: '100%', height: '100%', left: '0', top: '0' });
    panel.style.transform = 'none';
    panel.style.width = '100%';
    panel.style.height = '100%';
    panel.style.border = 'none';
    panel.style.background = 'transparent';
    panel.style.overflow = 'hidden';
    panel.style.background = 'linear-gradient(135deg, rgba(15,15,30,0.85), rgba(40,20,60,0.85))';

    document.getElementById('btn-new-game').onclick = () => {
      this.clearPanels();
      Game.newGame();
    };
    const contBtn = document.getElementById('btn-continue');
    if (hasSaves) contBtn.onclick = () => {
      this.clearPanels();
      // 加载最新的存档
      const saves = SaveSystem.getAllSaveMeta();
      const lastSlot = saves.findIndex(s => !s.empty);
      if (lastSlot >= 0) SaveSystem.loadFromSlot(lastSlot);
    };
    const loadBtn = document.getElementById('btn-load');
    if (hasSaves) loadBtn.onclick = () => this.showLoadPanel();
    document.getElementById('btn-help').onclick = () => {
      this.showHelpPanel();
    };
  }

  // 显示读取存档面板
  showLoadPanel() {
    const saves = SaveSystem.getAllSaveMeta();
    const hasAutoSave = SaveSystem.hasAutoSave();
    let html = '<button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.showMainMenu()">×</button>';
    html += '<h2>读取存档</h2>';
    html += '<div style="padding:15px;max-height:500px;overflow-y:auto;">';
    // 自动存档
    if (hasAutoSave) {
      const autoData = JSON.parse(localStorage.getItem(SaveSystem.AUTOSAVE_KEY));
      const date = new Date(autoData.savedAt).toLocaleString('zh-CN');
      html += '<div class="save-slot" onclick="Game.ui.clearPanels();SaveSystem.loadAutoSave()" style="background:rgba(70,60,30,0.4);border:2px solid #b89856;padding:15px;margin-bottom:12px;cursor:pointer;border-radius:4px;">';
      html += '<div style="color:#b89856;font-weight:bold;font-size:16px;">[自动存档] ' + autoData.location + '</div>';
      html += '<div style="color:#8a8a98;font-size:12px;margin-top:4px;">' + date + '</div>';
      html += '<div style="color:#d0d0d8;font-size:13px;margin-top:6px;">' + autoData.playerName + ' Lv' + autoData.playerLevel + ' · 💰' + autoData.gold + ' · 第' + autoData.dayCount + '天</div>';
      html += '</div>';
    }
    // 3个手动存档
    for (let i = 0; i < 3; i++) {
      const save = saves[i];
      if (save.empty) {
        html += '<div class="save-slot" style="background:rgba(20,20,30,0.4);border:2px dashed #4a3e2a;padding:15px;margin-bottom:12px;border-radius:4px;color:#6a6a7a;">';
        html += '<div style="font-size:14px;">槽位 ' + (i + 1) + ' - 空</div>';
        html += '</div>';
      } else {
        const date = new Date(save.savedAt).toLocaleString('zh-CN');
        html += '<div class="save-slot" style="background:rgba(40,50,70,0.4);border:2px solid #6a8aaa;padding:15px;margin-bottom:12px;cursor:pointer;border-radius:4px;" onmouseover="this.style.borderColor=\'#f4d35e\'" onmouseout="this.style.borderColor=\'#6a8aaa\'">';
        html += '<div style="color:#f4d35e;font-weight:bold;font-size:16px;">[槽位 ' + (i + 1) + '] ' + (save.label || '存档') + '</div>';
        html += '<div style="color:#8a8a98;font-size:12px;margin-top:4px;">' + date + '</div>';
        html += '<div style="color:#d0d0d8;font-size:13px;margin-top:6px;">' + (save.playerName || '?') + ' Lv' + (save.playerLevel || 1) + ' · 💰' + (save.gold || 0) + ' · 第' + (save.dayCount || 1) + '天 · ' + (save.location || '大地图') + '</div>';
        html += '<div style="display:flex;gap:8px;margin-top:10px;">';
        html += '<button class="ui-btn" onclick="event.stopPropagation();Game.ui.clearPanels();SaveSystem.loadFromSlot(' + i + ')" style="padding:6px 16px;font-size:12px;">读取</button>';
        html += '<button class="ui-btn danger" onclick="event.stopPropagation();Game.ui.confirmDeleteSlot(' + i + ')" style="padding:6px 16px;font-size:12px;">删除</button>';
        html += '</div>';
        html += '</div>';
      }
    }
    html += '</div>';
    this.addPanel(html, { width: '540px' });
  }

  // 确认删除存档
  confirmDeleteSlot(slotIndex) {
    if (confirm('确定要删除槽位 ' + (slotIndex + 1) + ' 的存档吗？')) {
      SaveSystem.deleteSlot(slotIndex);
      this.clearPanels();
      this.showLoadPanel();
    }
  }

  // 显示保存游戏面板（在游戏中）
  showSavePanel() {
    const saves = SaveSystem.getAllSaveMeta();
    let html = '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>';
    html += '<h2>保存游戏</h2>';
    html += '<div style="padding:15px;">';
    html += '<p style="color:#b89856;font-size:12px;margin-bottom:12px;">选择要保存到的槽位 (F5 快速存档到槽位 1)</p>';
    for (let i = 0; i < 3; i++) {
      const save = saves[i];
      if (save.empty) {
        html += '<div class="save-slot" onclick="SaveSystem.saveToSlot(' + i + ',\'玩家存档\');Game.ui.clearPanels();Game.ui.showSavePanel();" style="background:rgba(20,20,30,0.4);border:2px dashed #4a3e2a;padding:15px;margin-bottom:12px;cursor:pointer;border-radius:4px;">';
        html += '<div style="color:#78d878;font-size:14px;font-weight:bold;">+ 槽位 ' + (i + 1) + ' - 空（点击保存）</div>';
        html += '</div>';
      } else {
        const date = new Date(save.savedAt).toLocaleString('zh-CN');
        html += '<div class="save-slot" onclick="if(confirm(\'覆盖当前存档？\')){SaveSystem.saveToSlot(' + i + ',\'玩家存档\');Game.ui.clearPanels();Game.ui.showSavePanel();}" style="background:rgba(40,50,70,0.4);border:2px solid #6a8aaa;padding:15px;margin-bottom:12px;cursor:pointer;border-radius:4px;">';
        html += '<div style="color:#f4d35e;font-weight:bold;font-size:16px;">[槽位 ' + (i + 1) + '] ' + (save.label || '存档') + '</div>';
        html += '<div style="color:#8a8a98;font-size:12px;margin-top:4px;">' + date + '</div>';
        html += '<div style="color:#d0d0d8;font-size:13px;margin-top:6px;">第' + (save.dayCount || 1) + '天 · ' + (save.playerName || '?') + ' Lv' + (save.playerLevel || 1) + ' · ' + (save.location || '大地图') + '</div>';
        html += '</div>';
      }
    }
    html += '</div>';
    this.addPanel(html, { width: '500px' });
  }


  showHelpPanel() {
    const html = `
      <button class="ui-close" onclick="Game.ui.clearPanels(); Game.ui.showMainMenu()">×</button>
      <h2>游戏说明</h2>
      <div style="padding:20px;line-height:1.9;font-size:13px;color:#d0d0d8;">
        <p><strong>🏰 <span style="color:#f4d35e;">目标：</span>在铁骑大陆上组建部队、军团，或单枪匹马闯荡，最终一统天下！</p>
        <p><strong>🗺️ <span style="color:#f4d35e;">大地图：</span>点击任意位置移动，点击城镇/城堡/村庄可进入。</p>
        <p><strong>⚔️ <span style="color:#f4d35e;">战斗：</span>在大地图行进中会随机遭遇强盗或敌方部队。</p>
        <p><strong>🏪 <span style="color:#f4d35e;">交易：</span>在城镇可买卖装备、交易商品（低买高卖赚钱。</p>
        <p><strong>🛡️ <span style="color:#f4d35e;">招募：</span>在城镇酒馆招募士兵加入你的部队。</p>
        <p><strong>🔨 <span style="color:#f4d35e;">打造：</span>在城堡打造更好的武器/装备。</p>
        <p><strong>📜 <span style="color:#f4d35e;">任务：</span>在城镇接受并完成任务以获取奖励。</p>
        <p><strong>👑 <span style="color:#f4d35e;">争霸：</strong>占领城镇/城堡，建立你的势力，最终统一大陆！</p>
        <p style="margin-top:15px;color:#b89856;font-style:italic;">提示：装备更好的装备→提升战斗→打更大的战斗！</p>
      </div>
    `;
    this.addPanel(html, { width: '560px' });
  }

  // 打开定居点
  openSettlement(settlement) {
    this.currentSettlement = settlement;
    if (Game.world.questSystem) {
      Game.world.questSystem.onArriveSettlement(settlement, Game.player);
    }
    const faction = Game.world.getFaction(settlement.factionId);
    const typeName = settlement.type === 'town' ? '城镇' : settlement.type === 'castle' ? '城堡' : '村庄';
    const factionColor = faction ? faction.color : '#f4d35e';
    const factionName = faction ? faction.name : '-';
    let html = '';
    html += '<button class="ui-close" onclick="Game.ui.clearPanels();">×</button>';
    html += '<h2 style="color:' + factionColor + ';">' + settlement.name + ' <small style="font-size:14px;color:#b89856;">[' + typeName + ']</small></h2>';
    html += '<div style="padding:15px;color:#d0d0d8;font-size:13px;line-height:1.8;">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">';
    html += '<div>领主：' + settlement.lordName + '</div>';
    html += '<div>所属势力：<span style="color:' + factionColor + ';">' + factionName + '</span></div>';
    html += '<div>人口：' + settlement.population + '</div>';
    html += '<div>防御：' + Math.floor(settlement.defense) + '</div>';
    html += '<div>繁荣度：' + Math.floor(settlement.prosperity) + '</div>';
    html += '<div>士气：' + Math.floor(settlement.morale) + '%</div>';
    html += '</div><div style="display:flex;flex-direction:column;gap:8px;">';
    if (settlement.type === 'town') {
      html += '<button class="ui-btn" id="btn-shop">商店 - 购买物品</button>';
      html += '<button class="ui-btn" id="btn-trade">贸易 - 商品交易</button>';
      html += '<button class="ui-btn" id="btn-tavern">酒馆 - 招募部队</button>';
      html += '<button class="ui-btn" id="btn-quest">任务 - 接取任务</button>';
    }
    if (settlement.type === 'castle') {
      html += '<button class="ui-btn" id="btn-smithy">铁匠铺 - 打造装备</button>';
      html += '<button class="ui-btn" id="btn-trade-castle">军需贸易</button>';
      html += '<button class="ui-btn" id="btn-tavern-castle">招募驻军</button>';
    }
    if (settlement.type === 'village') {
      html += '<button class="ui-btn" id="btn-trade-village">与村民交易</button>';
    }
    html += '<button class="ui-btn primary" id="btn-rest">休息一晚 (消耗5金)</button>';
    if (settlement.factionId !== Game.player.factionId && Game.player.party.totalCount >= 8) {
      html += '<button class="ui-btn danger" id="btn-siege" style="background:linear-gradient(to bottom,#8a3a3a,#5a1e1e);">围攻此' + typeName + '</button>';
    }
    html += '</div></div>';
    const panel = this.addPanel(html, { width: '480px' });
    const bind = (id, cb) => {
      const el = document.getElementById(id);
      if (el) el.onclick = cb;
    };
    bind('btn-shop', () => this.openShop(settlement));
    bind('btn-trade', () => this.openTrade(settlement));
    bind('btn-trade-castle', () => this.openTrade(settlement));
    bind('btn-trade-village', () => this.openTrade(settlement));
    bind('btn-tavern', () => this.openTavern(settlement));
    bind('btn-tavern-castle', () => this.openTavern(settlement));
    bind('btn-quest', () => this.openQuestBoard(settlement));
    bind('btn-smithy', () => this.openSmithy(settlement));
    bind('btn-rest', () => this.rest(settlement));
    bind('btn-siege', () => {
      this.openSiegePanel(settlement);
    });
  }

  openShop(settlement) {
    this.clearPanels();
    let html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2>${settlement.name} - 商店</h2>
      <div style="padding:12px;max-height:450px;overflow-y:auto;">
        <div style="color:#b89856;margin-bottom:8px;">金币：💰 ${Game.player.party.gold}</div>
        <h3 style="color:#f4d35e;margin-bottom:8px;">武器</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr);gap:8px;margin-bottom:15px;">
    `;
    EquipmentTemplates.weapons.filter(w => w.level <= Math.max(2, Game.player.level + 2)).forEach(w => {
      html += `
        <div class="ui-slot" onclick="Game.ui.buyItem('${w.id}', 'weapon', ${settlement.id})" style="cursor:pointer;">
          <div style="font-size:16px;">⚔️</div>
          <div style="font-size:12px;color:#f4d35e;">${w.name}</div>
          <div style="font-size:11px;">攻:${w.damage} 速:${w.speed}</div>
          <div style="color:#f4d35e;font-size:11px;">💰 ${Math.ceil(w.price)}</div>
        </div>`;
    });
    html += `</div><h3 style="color:#f4d35e;margin-bottom:8px;">防具</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr);gap:8px;">`;
    EquipmentTemplates.armors.filter(a => a.level <= Math.max(2, Game.player.level + 2)).forEach(a => {
      html += `
        <div class="ui-slot" onclick="Game.ui.buyItem('${a.id}', 'armor', '${settlement.id}', ${a.price})" style="cursor:pointer;">
          <div style="font-size:16px;">🛡️</div>
          <div style="font-size:12px;color:#f4d35e;">${a.name}</div>
          <div style="font-size:11px;">防:${a.defense}</div>
          <div style="color:#f4d35e;font-size:11px;">💰 ${Math.ceil(a.price)}</div>
        </div>`;
    });
    html += `</div><h3 style="color:#f4d35e;margin-top:12px;margin-bottom:8px;">消耗品</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr);gap:8px;">`;
    EquipmentTemplates.consumables.forEach(c => {
      html += `
        <div class="ui-slot" onclick="Game.ui.buyConsumable('${c.id}', '${settlement.id}')" style="cursor:pointer;">
          <div style="font-size:16px;">🧪</div>
          <div style="font-size:12px;color:#f4d35e;">${c.name}</div>
          <div style="font-size:11px;">治:${c.heal}</div>
          <div style="color:#f4d35e;font-size:11px;">💰 ${Math.ceil(c.price)}</div>
        </div>`;
    });
    html += `</div></div>`;
    this.addPanel(html, { width: '700px' });
  }

  buyItem(itemId, slot, settlementId, price) {
    let item = createItem(itemId);
    if (!item) {
      const finalPrice = price || item.price;
      if (Game.player.spendGold(finalPrice)) {
        Game.player.party.addItem(item);
        toast('购买了 ' + item.name, '#78d878');
      } else {
        toast('金币不足！', '#f86868');
      }
    }
  }

  buyConsumable(itemId, settlementId) {
    const tmpl = EquipmentTemplates.consumables.find(c => c.id === itemId);
    if (!tmpl) return;
    if (Game.player.spendGold(tmpl.price)) {
      Game.player.party.addItem(createItem(itemId), 1);
      toast('购买了 ' + tmpl.name, '#78d878');
    } else {
      toast('金币不足！', '#f86868');
    }
  }

  openTrade(settlement) {
    this.clearPanels();
    let html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2>${settlement.name} - 贸易</h2>
      <div style="padding:12px;">
        <div style="color:#b89856;margin-bottom:8px;">金币：💰 ${Game.player.party.gold} ｜ 背包负重:${Game.player.party.inventory.reduce((s, i) => s + i.quantity, 0)}/${Game.player.party.wagonCapacity}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
          <div>
            <h3 style="color:#f4d35e;margin-bottom:8px;">可购买</h3>
            <div style="background:rgba(0,0,0,0.4);padding:8px;min-height:200px;">
    `;
    EquipmentTemplates.tradeGoods.forEach(g => {
      const price = Math.ceil(g.price * (settlement.priceMod[g.id] || 1.0));
      html += `
        <div class="ui-list-item" onclick="Game.ui.buyTrade('${g.id}', ${price})" style="padding:8px;border-bottom:1px solid #4a3e2a;cursor:pointer;">
          <span>📦 ${g.name} <small style="color:#b8b8c8;">${g.desc}</small>
          <span style="color:#f4d35e;float:right;">💰 ${price}</span>
        </div>`;
    });
    html += `
            </div>
          </div>
          <div>
            <h3 style="color:#f4d35e;margin-bottom:8px;">你的货物（点击出售）</h3>
            <div style="background:rgba(0,0,0,0.4);padding:8px;min-height:200px;">
    `;
    const inv = Game.player.party.inventory.filter(i =>
      EquipmentTemplates.tradeGoods.some(g => g.id === i.item.id));
    if (inv.length === 0) {
      html += `<p style="color:#6a6a7a;text-align:center;padding:20px;">暂无货物</p>`;
    } else {
      inv.forEach(entry => {
        const tmpl = EquipmentTemplates.tradeGoods.find(g => g.id === entry.item.id);
        const sellPrice = Math.floor(settlement.priceMod[entry.item.id] * tmpl.price * 0.75);
        html += `
          <div class="ui-list-item" onclick="Game.ui.sellTrade('${entry.item.id}', ${sellPrice})" style="padding:8px;border-bottom:1px solid #4a3e2a;cursor:pointer;">
            <span>📦 ${entry.item.name} <small style="color:#b8b8c8;">x${entry.quantity}</small>
            <span style="color:#f4d35e;float:right;">💰 ${sellPrice}/个</span>
          </div>`;
      });
    }
    html += `</div></div></div></div>`;
    this.addPanel(html, { width: '620px' });
  }

  buyTrade(itemId, price) {
    if (Game.player.party.currentLoad >= Game.player.party.wagonCapacity) {
      toast('马车已满！', '#f86868');
      return;
    }
    if (Game.player.spendGold(price)) {
      Game.player.party.addItem(createItem(itemId), 1);
      toast('购买成功', '#78d878');
      // 刷新界面
      this.openTrade(this.currentSettlement);
    } else {
      toast('金币不足！', '#f86868');
    }
  }

  sellTrade(itemId, price) {
    if (Game.player.party.getItemCount(itemId) > 0) {
      Game.player.party.removeItem(itemId, 1);
      Game.player.earnGold(price);
      toast('卖出成功 +' + price + '金', '#78d878');
      this.openTrade(this.currentSettlement);
    }
  }

  openTavern(settlement) {
    this.clearPanels();
    let html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2>${settlement.name} - 酒馆</h2>
      <div style="padding:12px;">
        <div style="color:#b89856;margin-bottom:10px;">金币：💰 ${Game.player.party.gold} ｜ 部队：${Game.player.party.totalCount}/${Game.player.party.maxSize}</div>
        <div style="background:rgba(0,0,0,0.4);padding:8px;max-height:380px;overflow-y:auto;">
    `;
    settlement.garrison.forEach((g, idx) => {
      const unitTmpl = UnitTypes[g.type];
      html += `
        <div class="ui-list-item" style="padding:10px;border-bottom:1px solid #4a3e2a;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#f4d35e;">⚔️ ${unitTmpl.name} <small style="color:#b8b8c8;">Lv${unitTmpl.level}</small></div>
            <div style="font-size:12px;color:#a0a0a8;">生命:${unitTmpl.hp} 攻击:${unitTmpl.damage} 防御:${unitTmpl.defense}</div>
            <div style="font-size:12px;color:#6a6a7a;">数量:${g.available}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="color:#f4d35e;">💰${g.price}</span>
            <button class="ui-btn" onclick="Game.ui.recruit('${settlement.id}', ${idx})" style="padding:6px 12px;font-size:12px;">招募</button>
          </div>
        </div>`;
    });
    html += `</div></div>`;
    this.addPanel(html, { width: '520px' });
  }

  recruit(settlementId, idx) {
    const settlement = Game.world.getSettlement(settlementId);
    const gar = settlement.garrison[idx];
    if (!gar || gar.available <= 0) return;
    if (Game.player.party.totalCount >= Game.player.party.maxSize) {
      toast('部队已满！', '#f86868');
      return;
    }
    if (!Game.player.spendGold(gar.price)) {
      toast('金币不足！', '#f86868');
      return;
    }
    const unit = new Unit(gar.type, Game.player.factionId);
    Game.player.party.addMember(unit);
    gar.available--;
    toast('招募了 ' + unit.name, '#78d878');
    this.openTavern(settlement);
  }

  openQuestBoard(settlement) {
    this.clearPanels();
    let html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2>${settlement.name} - 任务布告</h2>
      <div style="padding:12px;max-height:450px;overflow-y:auto;">
    `;
    // 可用任务
    if (settlement.questsAvailable.length === 0) {
      html += `<p style="color:#6a6a7a;text-align:center;padding:20px;">暂无新任务，请稍后再来。</p>`;
    } else {
      settlement.questsAvailable.forEach((q, i) => {
        html += `
          <div class="quest-item" style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#f4d35e;font-weight:bold;">📜 ${q.title}</span>
              <span style="color:#78d878;">奖励：💰${q.rewardGold}</span>
            </div>
            <div style="font-size:12px;color:#c0c0c8;margin:6px 0;">${q.desc}</div>
            <div style="font-size:11px;color:#8a8a98;">剩余天数：${q.timeRemaining} 天</div>
            <button class="ui-btn" onclick="Game.ui.acceptQuest('${settlement.id}', ${i})" style="margin-top:6px;padding:6px 16px;font-size:12px;">接取</button>
          </div>`;
      });
    }
    html += `<hr style="border:1px dashed #4a3e2a;margin:15px 0;"><h3 style="color:#f4d35e;margin-bottom:8px;">已接取中任务</h3>`;
    if (Game.world.questSystem && Game.world.questSystem.activeQuests.length === 0) {
      html += `<p style="color:#6a6a7a;text-align:center;padding:10px;">暂无进行中任务</p>`;
    } else {
      Game.world.questSystem.activeQuests.forEach(q => {
        html += `
          <div class="quest-item active" style="margin-bottom:10px;">
            <div style="color:#f4d35e;font-weight:bold;">📜 ${q.title}</div>
            <div style="font-size:12px;color:#c0c0c8;margin:4px 0;">${q.desc}</div>
            <div style="font-size:11px;color:#78d878;">进度：${q.progress}/${q.target ? (q.target.count || q.target.qty) : 0} ｜ 剩余:${q.timeRemaining}天</div>
          </div>`;
      });
    }
    html += `</div>`;
    this.addPanel(html, { width: '520px' });
  }

  acceptQuest(settlementId, qIdx) {
    const settlement = Game.world.getSettlement(settlementId);
    const q = settlement.questsAvailable[qIdx];
    if (!q) return;
    Game.world.questSystem.acceptQuest(q);
    settlement.questsAvailable.splice(qIdx, 1);
    this.openQuestBoard(settlement);
  }

  openSmithy(settlement) {
    this.clearPanels();
    let html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2>${settlement.name} - 铁匠铺</h2>
      <div style="padding:12px;">
        <div style="color:#b89856;margin-bottom:10px;">金币：💰 ${Game.player.party.gold}</div>
        <p style="color:#a0a0a8;font-size:13px;margin-bottom:10px;">请选择要打造的装备：</p>
        <div style="background:rgba(0,0,0,0.4);padding:10px;max-height:400px;overflow-y:auto;">
    `;
    SmithingRecipes.forEach((r, i) => {
      const resultItem = createItem(r.result);
      const canCraft = r.materials.every(m => Game.player.party.getItemCount(m.id) >= m.qty);
      html += `
        <div class="ui-list-item" style="padding:10px;border-bottom:1px solid #4a3e2a;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="color:#f4d35e;">🛠️ ${resultItem.name} <small style="color:#b89856;">Lv${r.levelReq}</small></div>
              <div style="font-size:12px;color:#a0a0a8;">
                所需：${r.materials.map(m => {
                  const tmpl = EquipmentTemplates.materials.concat(EquipmentTemplates.tradeGoods).find(x => x.id === m.id);
                  const have = Game.player.party.getItemCount(m.id);
                  return (tmpl ? tmpl.name : m.id) + ' ' + have + '/' + m.qty;
                }).join(', ')}<br/>
                打造费：💰 ${r.cost} 金币
              </div>
            </div>
            <button class="ui-btn ${canCraft ? 'primary' : ''}" ${canCraft ? '' : 'disabled'} onclick="Game.ui.craft(${i})" style="padding:6px 12px;font-size:12px;" ${canCraft ? '' : 'disabled'}>打造</button>
          </div>
        </div>`;
    });
    html += `</div></div>`;
    this.addPanel(html, { width: '520px' });
  }

  craft(recipeIdx) {
    const recipe = SmithingRecipes[recipeIdx];
    if (!recipe) return;
    if (!Game.player.spendGold(recipe.cost)) {
      toast('金币不足！', '#f86868');
      return;
    }
    recipe.materials.forEach(m => Game.player.party.removeItem(m.id, m.qty));
    const item = createItem(recipe.result);
    Game.player.party.addItem(item);
    toast('打造成功：' + item.name, '#78d878');
    // 装备到身上
    const slot = item.type === ItemType.WEAPON ? 'weapon' : item.type === ItemType.ARMOR ? 'armor' : 'helmet';
    if (Game.player.equipment[slot]) {
      Game.player.party.addItem(Game.player.equipment[slot]);
    }
    Game.player.equipment[slot] = item;
    Game.player.party.removeItem(item.id), 1;
    this.openSmithy(this.currentSettlement);
  }

  rest(settlement) {
    if (!Game.player.spendGold(5)) {
      toast('金币不足！', '#f86868');
      return;
    }
    Game.player.hp = Game.player.maxHp;
    Game.player.party.healAll(999);
    Game.player.party.morale = Math.min(100, Game.player.party.morale + 20);
    Game.dayCount++;
    toast('休息一晚，部队恢复！', '#78d878');
  }

  openSiegePanel(settlement) {
    this.clearPanels();
    const power = Game.player.party.power;
    const defenders = settlement.defense + (settlement.type === 'castle' ? 300 : 150);
    const html = `
      <button class="ui-close" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)">×</button>
      <h2 style="color:#f86868;">⚔️ 围攻 ${settlement.name}</h2>
      <div style="padding:15px;">
        <div style="background:rgba(80,20,20,0.4);padding:12px;border:1px solid #8a3a3a;border-radius:4px;margin-bottom:15px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;">
            <span style="color:#78d878;">你的战力：${power}</span>
            <span style="color:#f86868;">守军战力：${defenders}</span>
          </div>
          <p style="font-size:12px;color:#b89856;margin-top:10px;">
            预计守军约 ${settlement.type === 'castle' ? '8-15' : '5-10'} 名敌人。你的部队:${Game.player.party.totalCount} 人。
          </p>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="ui-btn danger" onclick="Game.ui.startSiege()" style="padding:10px 30px;">发起进攻</button>
          <button class="ui-btn" onclick="Game.ui.clearPanels();Game.ui.openSettlement(Game.ui.currentSettlement)" style="padding:10px 30px;">撤退</button>
        </div>
      </div>
    `;
    this.addPanel(html, { width: '440px' });
    this.siegeTarget = settlement;
  }

  startSiege() {
    if (!this.siegeTarget) return;
    CombatSystem.startSiege(this.siegeTarget, Game.player);
  }

  openBattle(opts) {
    this.clearPanels();
    Game.battleMap.setup(opts.enemies, opts);
    StateManager.change(GameState.BATTLE);
    // 战斗UI
    const html = `
      <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:10px;pointer-events:auto;z-index:20;">
        <button class="ui-btn" onclick="Game.battleMap.battleSpeed = Game.battleMap.battleSpeed === 1 ? 2 : Game.battleMap.battleSpeed === 2 ? 3 : 1;">速度 x<span id="spd">1</span></button>
        <button class="ui-btn" onclick="Game.battleMap.paused = !Game.battleMap.paused;">暂停</button>
      </div>
    `;
    const panel = this.addPanel(html, { width: '0', top: 'auto', bottom: '10px', left: '50%' });
    panel.style.border = 'none';
    panel.style.background = 'transparent';
  }

  showGameOverPanel() {
    const html = `
      <div style="text-align:center;padding:40px;">
        <h1 style="color:#f86868;font-size:32px;margin-bottom:20px;">☠️ 传奇陨落</h1>
        <p style="color:#b89856;margin-bottom:20px;">你的冒险结束于第 ${Game.dayCount} 天。</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="ui-btn primary" onclick="Game.ui.clearPanels();Game.newGame();" style="padding:12px 30px;">重新开始</button>
          <button class="ui-btn" onclick="Game.ui.showMainMenu();Game.ui.clearPanels();Game.ui.showMainMenu();" style="padding:12px 30px;">返回主菜单</button>
        </div>
      </div>
    `;
    this.addPanel(html, { width: '400px' });
  }

  showVictoryPanel() {
    const html = `
      <div style="text-align:center;padding:40px;">
        <h1 style="color:#f4d35e;font-size:32px;margin-bottom:20px;">👑 一统天下</h1>
        <p style="color:#78d878;margin-bottom:20px;">你征服了整个大陆，用时 ${Game.dayCount} 天！</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="ui-btn primary" onclick="Game.ui.clearPanels();Game.newGame();" style="padding:12px 30px;">继续冒险</button>
          <button class="ui-btn" onclick="Game.ui.clearPanels();Game.ui.showMainMenu();" style="padding:12px 30px;">返回主菜单</button>
        </div>
      </div>
    `;
    this.addPanel(html, { width: '400px' });
  }

  // 状态信息栏
  renderHUD() {
    // 渲染底部HUD
  }

  update() {
    // 更新UI的逻辑
  }
}

// ============ 主UI渲染（HUD，始终显示的信息）
function renderHUD() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  // 仅在世界地图状态下渲染HUD
  if (StateManager.current !== GameState.WORLD_MAP &&
      StateManager.current !== GameState.SETTLEMENT) return;
}

// 全局UI - 实时绘制在 canvas 上不做，用 DOM 代替
// 让主菜单在页面加载后显示
window.addEventListener('load', () => {
  // Game.init();
});

// 键盘事件
document.addEventListener('keydown', (e) => {
  // 战斗中不响应存档相关快捷键（避免BUG）
  const inBattle = StateManager.current === GameState.BATTLE;
  if (e.key === 'Escape') {
    if (inBattle) {
      return;
    }
    Game.ui && Game.ui.clearPanels();
    return;
  }
  if (e.key === '1' && Game.battleMap) {
    Game.battleMap.battleSpeed = 1;
    return;
  }
  if (e.key === '2' && Game.battleMap) {
    Game.battleMap.battleSpeed = 2;
    return;
  }
  if (e.key === '3' && Game.battleMap) {
    Game.battleMap.battleSpeed = 3;
    return;
  }
  // 存档相关快捷键
  if (e.key === 'F5' && Game.player && !inBattle) {
    e.preventDefault();
    SaveSystem.saveToSlot(0, '快速存档');
    return;
  }
  if (e.key === 'F9' && Game.player && !inBattle) {
    e.preventDefault();
    SaveSystem.loadFromSlot(0);
    return;
  }
  if (e.key === 'F6' && Game.player && !inBattle) {
    e.preventDefault();
    SaveSystem.saveToSlot(1, '存档2');
    return;
  }
  if (e.key === 'F7' && Game.player && !inBattle) {
    e.preventDefault();
    SaveSystem.saveToSlot(2, '存档3');
    return;
  }
  // 仅在游戏世界中响应
  if (!Game.player || inBattle) return;
  if (e.key.toLowerCase() === 'c') {
    showCharacterPanel();
  } else if (e.key.toLowerCase() === 'i') {
    showInventoryPanel();
  } else if (e.key.toLowerCase() === 'p') {
    showPartyPanel();
  } else if (e.key.toLowerCase() === 'q') {
    if (Game.world && Game.world.questSystem) showQuestsPanel();
  } else if (e.key.toLowerCase() === 'm') {
    // 地图：保存游戏
    Game.ui.showSavePanel();
  } else if (e.key.toLowerCase() === 'k') {
    // K 键: 在世界中显示完整键盘提示
    showControlsPanel();
  }
});

// 角色面板 - 增强版
function showCharacterPanel() {
  Game.ui.clearPanels();
  const p = Game.player;
  // 角色肖像
  const portraitHtml = '<canvas id="char-portrait" width="80" height="80" style="image-rendering:pixelated;background:#222;"></canvas>';
  // 经验进度
  const expPct = Math.floor(p.exp / p.expNeeded * 100);
  // 装备槽
  const eqSlots = [
    { key: 'helmet', label: '头盔', icon: '⛑️' },
    { key: 'armor', label: '护甲', icon: '🛡️' },
    { key: 'weapon', label: '武器', icon: '⚔️' },
    { key: 'shield', label: '盾牌', icon: '🛡️' },
    { key: 'boots', label: '鞋子', icon: '👢', empty: true },
    { key: 'ring', label: '饰品', icon: '💍', empty: true }
  ];
  let equipHtml = '';
  eqSlots.forEach(s => {
    const it = p.equipment[s.key];
    if (it) {
      equipHtml += '<div class="equip-slot" onclick="Game.player.unequip(\'' + s.key + '\');setTimeout(showCharacterPanel,100)" title="点击卸下">' +
        '<div class="icon">' + s.icon + '</div>' +
        '<div class="name" style="color:#f4d35e;">' + it.name + '</div>' +
        '<div class="label">' + s.label + '</div></div>';
    } else {
      equipHtml += '<div class="equip-slot empty">' +
        '<div class="icon" style="opacity:0.3;">' + s.icon + '</div>' +
        '<div class="label">' + s.label + '</div></div>';
    }
  });
  // 装备属性汇总
  const equipStats = [];
  if (p.equipment.weapon) equipStats.push({ name: '武器伤害', val: '+' + p.equipment.weapon.damage, color: '#f86868' });
  if (p.equipment.armor) equipStats.push({ name: '护甲防御', val: '+' + p.equipment.armor.defense, color: '#78d878' });
  if (p.equipment.helmet) equipStats.push({ name: '头盔防御', val: '+' + p.equipment.helmet.defense, color: '#78d878' });
  if (p.equipment.shield) equipStats.push({ name: '盾牌防御', val: '+' + p.equipment.shield.defense, color: '#78d878' });
  const faction = Game.world.getFaction(p.factionId);
  const html =
    '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>' +
    '<h2>角色信息</h2>' +
    '<div style="padding:15px;">' +
    '<div class="character-card">' +
    '<div class="character-portrait">' + portraitHtml + '</div>' +
    '<div class="character-info">' +
    '<div class="character-name">' + p.name + ' <span class="badge gold">Lv' + p.level + '</span></div>' +
    '<div class="character-title">' + p.title + (faction ? ' · ' + faction.name : ' · 流浪者') + '</div>' +
    '<div class="progress-bar"><div class="fill" style="width:' + expPct + '%;"></div></div>' +
    '<div style="font-size:10px;color:#b89856;text-align:right;">EXP: ' + p.exp + ' / ' + p.expNeeded + ' (' + expPct + '%)</div>' +
    '</div></div>' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="value" style="color:#f86868;">' + Math.floor(p.hp) + '</div><div class="label">❤️ 生命</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#78d878;">' + p.defense + '</div><div class="label">🛡 防御</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#f4d35e;">' + p.damage + '</div><div class="label">⚔️ 攻击</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#b89856;">' + p.reputation + '</div><div class="label">⭐ 声望</div></div>' +
    '</div>' +
    '<div class="ornament">属 性</div>' +
    '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;">' +
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;"><span style="color:#b89856;">💪 力量</span><span style="color:#f4d35e;">' + p.strength + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;"><span style="color:#b89856;">🏃 敏捷</span><span style="color:#f4d35e;">' + p.agility + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;"><span style="color:#b89856;">🛡 体力</span><span style="color:#f4d35e;">' + p.vitality + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;"><span style="color:#b89856;">🧠 智力</span><span style="color:#f4d35e;">' + p.intelligence + '</span></div>' +
    '</div>' +
    '<div class="ornament">装 备</div>' +
    '<div class="equipment-grid">' + equipHtml + '</div>' +
    (equipStats.length > 0 ? '<div class="divider"></div><div style="font-size:12px;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">' +
      equipStats.map(s => '<span style="margin-right:10px;">' + s.name + ':<span style="color:' + s.color + ';font-weight:bold;">' + s.val + '</span></span>').join('') +
      '</div>' : '') +
    '<div class="divider"></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;">' +
    '<div style="color:#b89856;">💰 金币: <span style="color:#f4d35e;">' + p.party.gold + '</span></div>' +
    '<div style="color:#b89856;">👥 部队: <span style="color:#78d878;">' + p.party.members.filter(m => !m.isDead).length + '/' + p.party.members.length + '</span></div>' +
    '<div style="color:#b89856;">📅 士气: <span style="color:' + (p.party.morale > 50 ? '#78d878' : '#f86868') + ';">' + p.party.morale + '%</span></div>' +
    '</div>' +
    '</div>';
  Game.ui.addPanel(html, { width: '520px' });
  // 绘制角色肖像
  setTimeout(() => drawCharacterPortrait(), 50);
}

function drawCharacterPortrait() {
  const canvas = document.getElementById('char-portrait');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const p = Game.player;
  // 背景
  const grad = ctx.createLinearGradient(0, 0, 80, 80);
  grad.addColorStop(0, '#3a2e1a');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 80, 80);
  // 装饰边框
  ctx.strokeStyle = '#8a7a3e';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 76, 76);
  // 绘制角色 - 大一些
  const eq = p.equipment;
  // 披风（英雄标志）
  ctx.fillStyle = '#f4d35e';
  ctx.fillRect(30, 25, 20, 35);
  ctx.fillStyle = '#b89856';
  ctx.fillRect(30, 25, 4, 35);
  ctx.fillRect(46, 25, 4, 35);
  // 身体颜色根据装备变化
  let bodyColor = '#6a4aaa';
  if (eq.armor) {
    if (eq.armor.level >= 5) bodyColor = '#aaa';  // 板甲
    else if (eq.armor.level >= 4) bodyColor = '#888';  // 链甲
    else if (eq.armor.level >= 3) bodyColor = '#6a5a3a';  // 锁甲
    else if (eq.armor.level >= 2) bodyColor = '#5a3a2a';  // 皮甲
    else bodyColor = '#4a4a5a';  // 布甲
  }
  Utils.drawPixelHuman(ctx, 40, 50, 2.4, bodyColor, '#fcb', 'sword');
  // 头盔
  if (eq.helmet) {
    ctx.fillStyle = '#888';
    ctx.fillRect(34, 25, 12, 6);
  }
  // 等级徽章
  ctx.fillStyle = '#f4d35e';
  ctx.font = 'bold 9px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('Lv' + p.level, 40, 75);
  ctx.textAlign = 'left';
}

// 背包面板 - 增强版
function showInventoryPanel() {
  Game.ui.clearPanels();
  const inv = Game.player.party.inventory;
  const load = Game.player.party.currentLoad;
  const cap = Game.player.party.wagonCapacity;
  const loadPct = Math.floor(load / cap * 100);
  // 按类型分类
  const equipItems = inv.filter(e => ['weapon', 'armor', 'helmet', 'shield'].includes(e.item.type));
  const consumables = inv.filter(e => e.item.type === 'consumable');
  const trades = inv.filter(e => e.item.type === 'trade_good' || e.item.type === 'material');
  const itemTypeIcon = {
    weapon: '⚔️', armor: '🛡️', helmet: '⛑️', shield: '🛡️',
    consumable: '🧪', trade_good: '📦', material: '🪨'
  };
  const itemTypeColor = {
    weapon: '#f86868', armor: '#78d878', helmet: '#88ddff', shield: '#88ddff',
    consumable: '#d878d8', trade_good: '#b89856', material: '#aaaaaa'
  };
  const renderItem = (e, idx) => {
    const item = e.item;
    const isEquippable = ['weapon', 'armor', 'helmet', 'shield'].includes(item.type);
    const isConsumable = item.type === 'consumable';
    return '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title" style="color:' + itemTypeColor[item.type] + ';">' + itemTypeIcon[item.type] + ' ' + item.name + ' <span class="tag">x' + e.quantity + '</span></div>' +
      (isEquippable ? '<button class="ui-btn" onclick="Game.player.equip(Game.player.party.inventory[' + inv.indexOf(e) + '].item);setTimeout(showInventoryPanel,100)" style="padding:4px 10px;font-size:11px;">装备</button>' : '') +
      (isConsumable ? '<button class="ui-btn" onclick="Game.player.party.useConsumable(\'' + item.id + '\');setTimeout(showInventoryPanel,100)" style="padding:4px 10px;font-size:11px;">使用</button>' : '') +
      '</div>' +
      '<div class="card-content" style="font-size:12px;color:#a0a0a8;">' + (item.desc || '') +
      (item.damage ? ' | 攻:' + item.damage : '') +
      (item.defense ? ' | 防:' + item.defense : '') +
      (item.heal ? ' | 治:' + item.heal : '') +
      (item.price ? ' | 💰' + item.price : '') +
      '</div></div>';
  };
  let contentHtml = '';
  if (equipItems.length > 0) {
    contentHtml += '<div class="ornament">⚔ 装备</div>' + equipItems.map(renderItem).join('');
  }
  if (consumables.length > 0) {
    contentHtml += '<div class="ornament">🧪 消耗品</div>' + consumables.map(renderItem).join('');
  }
  if (trades.length > 0) {
    contentHtml += '<div class="ornament">📦 货物 / 素材</div>' + trades.map(renderItem).join('');
  }
  if (inv.length === 0) {
    contentHtml = '<div style="padding:40px;text-align:center;color:#6a6a7a;"><div style="font-size:48px;">📦</div><div>背包空空如也</div><div style="font-size:11px;margin-top:8px;">完成交易或击杀敌人来获得物品</div></div>';
  }
  const html =
    '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>' +
    '<h2>背包</h2>' +
    '<div style="padding:15px;">' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="value" style="color:#f4d35e;">' + inv.length + '</div><div class="label">📦 物品</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#b89856;">' + load + '/' + cap + '</div><div class="label">🐴 马车</div></div>' +
    '</div>' +
    '<div class="progress-bar"><div class="fill" style="width:' + loadPct + '%;"></div></div>' +
    '<div style="max-height:380px;overflow-y:auto;">' + contentHtml + '</div>' +
    '</div>';
  Game.ui.addPanel(html, { width: '520px' });
}

// 部队面板 - 增强版
function showPartyPanel() {
  Game.ui.clearPanels();
  const members = Game.player.party.members;
  const aliveCount = members.filter(m => !m.isDead).length;
  const totalPower = Game.player.party.power;
  const size = Game.player.party.members.length;
  const maxSize = Game.player.party.maxSize;
  const totalHp = members.reduce((s, m) => s + m.hp, 0);
  const totalMaxHp = members.reduce((s, m) => s + m.maxHp, 0);
  // 分类
  const swordsmen = members.filter(m => m.typeId && m.typeId.includes('sword'));
  const archers = members.filter(m => m.typeId && m.typeId.includes('archer') || m.typeId && m.typeId.includes('bow'));
  const spearmen = members.filter(m => m.typeId && m.typeId.includes('spear'));
  const knights = members.filter(m => m.typeId && m.typeId.includes('knight'));
  const playerUnit = members.find(m => m.isPlayer);
  const otherUnits = members.filter(m => !m.isPlayer);
  const renderTroop = (m, idx) => {
    const hpPct = Math.floor(m.hp / m.maxHp * 100);
    const hpColor = hpPct > 60 ? '#78d878' : (hpPct > 30 ? '#f4d35e' : '#f86868');
    return '<div class="troop-card">' +
      '<div class="troop-portrait" style="background:' + (m.isPlayer ? 'rgba(244,211,94,0.2)' : 'rgba(0,0,0,0.5)') + ';">' +
      '<canvas id="troop-' + idx + '" width="50" height="50" style="image-rendering:pixelated;"></canvas>' +
      '</div>' +
      '<div class="troop-info">' +
      '<div class="troop-name">' + (m.isPlayer ? '👑 ' : '') + m.name + ' <span class="tag green">Lv' + m.level + '</span></div>' +
      '<div class="troop-stats">⚔ ' + m.baseDamage + ' | 🛡 ' + m.baseDefense + ' | HP: <span style="color:' + hpColor + ';">' + Math.floor(m.hp) + '/' + m.maxHp + '</span></div>' +
      '<div class="troop-hp-bar"><div class="troop-hp-fill" style="width:' + hpPct + '%;"></div></div>' +
      '</div>' +
      (m.isPlayer ? '' : '<button class="ui-btn" onclick="Game.player.party.removeMember(' + members.indexOf(m) + ');Game.player.party.recalcWage();setTimeout(showPartyPanel,100)" style="padding:4px 8px;font-size:11px;">解雇</button>') +
      '</div>';
  };
  const html =
    '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>' +
    '<h2>部队管理</h2>' +
    '<div style="padding:15px;">' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="value" style="color:#78d878;">' + aliveCount + '/' + size + '</div><div class="label">👥 人数</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#f4d35e;">' + totalPower + '</div><div class="label">⚔ 战力</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:#f86868;">' + Game.player.party.weeklyWage + '</div><div class="label">💰 周薪</div></div>' +
    '<div class="stat-cell"><div class="value" style="color:' + (Game.player.party.morale > 50 ? '#78d878' : '#f86868') + ';">' + Game.player.party.morale + '%</div><div class="label">📈 士气</div></div>' +
    '</div>' +
    '<div class="ornament">部 队 编 成</div>' +
    '<div style="max-height:380px;overflow-y:auto;">' +
    (playerUnit ? renderTroop(playerUnit, 'player') : '') +
    otherUnits.map((m, i) => renderTroop(m, 'unit' + i)).join('') +
    '</div>' +
    '<div class="divider"></div>' +
    '<div style="text-align:center;color:#a0a0a8;font-size:12px;">点击士兵卡片可解雇 (主角不可解雇)</div>' +
    '</div>';
  Game.ui.addPanel(html, { width: '540px' });
  // 绘制每个士兵的肖像
  setTimeout(() => {
    members.forEach((m, i) => {
      const canvas = document.getElementById('troop-' + (m.isPlayer ? 'player' : 'unit' + (i - (playerUnit ? 1 : 0))));
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = m.isPlayer ? '#3a2e1a' : '#1a1a2e';
      ctx.fillRect(0, 0, 50, 50);
      // 主角特殊颜色
      if (m.isPlayer) {
        ctx.fillStyle = '#f4d35e';
        ctx.fillRect(15, 15, 20, 25);
        Utils.drawPixelHuman(ctx, 25, 30, 1.4, '#6a4aaa', '#fcb', 'sword');
      } else {
        // 士兵 - 根据类型颜色
        const isArcher = m.typeId && (m.typeId.includes('bow') || m.typeId.includes('archer'));
        const isSpear = m.typeId && m.typeId.includes('spear');
        const weapon = isArcher ? 'bow' : (isSpear ? 'spear' : 'sword');
        // 友军颜色
        const bodyColor = m.level >= 6 ? '#8a6aaa' : (m.level >= 4 ? '#5a8aaa' : '#5a5a7a');
        Utils.drawPixelHuman(ctx, 25, 30, 1.4, bodyColor, '#fcb', weapon);
      }
    });
  }, 50);
}

// 任务面板 - 增强版
function showQuestsPanel() {
  Game.ui.clearPanels();
  const qs = Game.world.questSystem;
  let html = '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>';
  html += '<h2>任务日志</h2>';
  html += '<div style="padding:15px;">';
  // 标签页
  html += '<div class="tabs">' +
    '<div class="tab active" onclick="Game.ui.clearPanels();showQuestsPanel()">进行中 (' + qs.activeQuests.length + ')</div>' +
    '<div class="tab" onclick="Game.ui.clearPanels();showCompletedQuests()">已完成 (' + qs.completedQuests.length + ')</div>' +
    '</div>';
  if (qs.activeQuests.length === 0) {
    html += '<div style="padding:40px;text-align:center;color:#6a6a7a;"><div style="font-size:48px;">📜</div><div>暂无进行中的任务</div><div style="font-size:11px;margin-top:8px;">访问城镇可接取新任务</div></div>';
  } else {
    qs.activeQuests.forEach(q => {
      const target = q.target.count || q.target.qty || 1;
      const pct = Math.floor(q.progress / target * 100);
      const typeLabel = { kill: '⚔️ 击杀', deliver: '📦 运送', collect: '🪵 收集', bounty: '💰 赏金' }[q.type] || '任务';
      const timeColor = q.timeRemaining < 5 ? '#f86868' : '#b89856';
      html += '<div class="card">' +
        '<div class="card-header">' +
        '<div class="card-title">📜 ' + q.title + '</div>' +
        '<span class="tag">' + typeLabel + '</span>' +
        '</div>' +
        '<div class="card-content" style="font-size:12px;">' + q.desc + '</div>' +
        '<div class="progress-bar" style="margin-top:8px;"><div class="fill" style="width:' + pct + '%;"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-top:6px;">' +
        '<span style="color:#78d878;">进度: ' + q.progress + '/' + target + ' (' + pct + '%)</span>' +
        '<span style="color:' + timeColor + ';">⏰ 剩余: ' + q.timeRemaining + '天</span>' +
        '</div>' +
        '<div style="font-size:11px;margin-top:4px;">奖励: <span style="color:#f4d35e;">💰' + q.rewardGold + '金币</span></div>' +
        '</div>';
    });
  }
  html += '</div>';
  Game.ui.addPanel(html, { width: '540px' });
}

function showCompletedQuests() {
  Game.ui.clearPanels();
  const qs = Game.world.questSystem;
  let html = '<button class="ui-close" onclick="Game.ui.clearPanels();showQuestsPanel()">×</button>';
  html += '<h2>任务日志</h2>';
  html += '<div style="padding:15px;">';
  html += '<div class="tabs">' +
    '<div class="tab" onclick="Game.ui.clearPanels();showQuestsPanel()">进行中 (' + qs.activeQuests.length + ')</div>' +
    '<div class="tab active">已完成 (' + qs.completedQuests.length + ')</div>' +
    '</div>';
  if (qs.completedQuests.length === 0) {
    html += '<div style="padding:40px;text-align:center;color:#6a6a7a;">暂无已完成任务</div>';
  } else {
    qs.completedQuests.slice(-15).reverse().forEach(q => {
      html += '<div class="card" style="opacity:0.6;border-color:#4a4a2a;">' +
        '<div class="card-title" style="color:#8a8a98;">✓ ' + q.title + ' <span class="tag green">+💰' + q.rewardGold + '</span></div>' +
        '</div>';
    });
  }
  html += '</div>';
  Game.ui.addPanel(html, { width: '540px' });
}

// 鼠标点击处理
function handleCanvasClick(event) {
  if (StateManager.current !== GameState.WORLD_MAP) return;
  const canvas = document.getElementById('game-canvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  // 转换为世界坐标
  const worldX = x + Game.worldMap.camera.x;
  const worldY = y + Game.worldMap.camera.y;
  Game.worldMap.onWorldClick(worldX, worldY);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick);
    // 触摸支持
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
  }
});

// 控制按键提示面板
function showControlsPanel() {
  Game.ui.clearPanels();
  const html = '<button class="ui-close" onclick="Game.ui.clearPanels()">×</button>' +
    '<h2>操作指南</h2>' +
    '<div style="padding:20px;line-height:2;">' +
    '<h3 style="color:#f4d35e;margin-bottom:8px;">📜 快捷键</h3>' +
    '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;">' +
    '<div><span style="color:#b89856;">F5</span> - 快速存档 (槽位1)</div>' +
    '<div><span style="color:#b89856;">F6</span> - 存档到槽位2</div>' +
    '<div><span style="color:#b89856;">F7</span> - 存档到槽位3</div>' +
    '<div><span style="color:#b89856;">F9</span> - 快速读档 (槽位1)</div>' +
    '<div><span style="color:#b89856;">ESC</span> - 关闭当前面板</div>' +
    '</div>' +
    '<h3 style="color:#f4d35e;margin:16px 0 8px 0;">⚔️ 角色界面</h3>' +
    '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;">' +
    '<div><span style="color:#b89856;">C</span> - 角色信息</div>' +
    '<div><span style="color:#b89856;">I</span> - 背包</div>' +
    '<div><span style="color:#b89856;">P</span> - 部队管理</div>' +
    '<div><span style="color:#b89856;">Q</span> - 任务列表</div>' +
    '<div><span style="color:#b89856;">M</span> - 保存游戏</div>' +
    '</div>' +
    '<h3 style="color:#f4d35e;margin:16px 0 8px 0;">🎮 战斗中</h3>' +
    '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;">' +
    '<div><span style="color:#b89856;">1 / 2 / 3</span> - 调整战斗速度</div>' +
    '</div>' +
    '</div>';
  Game.ui.addPanel(html, { width: '420px' });
}

// 创建游戏内右侧快速操作栏（DOM 按钮）
function showQuickActions() {
  let toolbar = document.getElementById('quick-actions');
  if (toolbar) return;
  const uilayer = document.getElementById('ui-layer');
  toolbar = document.createElement('div');
  toolbar.id = 'quick-actions';
  toolbar.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;pointer-events:auto;z-index:5;';
  const actions = [
    { key: 'C', label: '角色', fn: 'showCharacterPanel' },
    { key: 'I', label: '背包', fn: 'showInventoryPanel' },
    { key: 'P', label: '部队', fn: 'showPartyPanel' },
    { key: 'Q', label: '任务', fn: 'showQuestsPanel' },
    { key: 'M', label: '存档', fn: 'Game.ui.showSavePanel()' },
    { key: 'K', label: '帮助', fn: 'showControlsPanel' }
  ];
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.style.cssText = 'background:linear-gradient(to bottom,rgba(60,40,20,0.95),rgba(30,20,10,0.95));border:2px solid #8a7a3e;color:#f4d35e;padding:8px 6px;width:60px;cursor:pointer;font-size:11px;font-family:inherit;border-radius:3px;text-align:center;transition:all 0.15s;';
    btn.innerHTML = '<div style="font-size:14px;">' + a.label + '</div><div style="font-size:9px;color:#8a7a3e;margin-top:2px;">' + a.key + '</div>';
    btn.onmouseover = () => { btn.style.borderColor = '#f4d35e'; btn.style.color = '#fff'; };
    btn.onmouseout = () => { btn.style.borderColor = '#8a7a3e'; btn.style.color = '#f4d35e'; };
    btn.onclick = () => { eval(a.fn); };
    toolbar.appendChild(btn);
  });
  uilayer.appendChild(toolbar);
}

function hideQuickActions() {
  const toolbar = document.getElementById('quick-actions');
  if (toolbar) toolbar.remove();
}
