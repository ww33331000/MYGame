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
    // 右上角显示当前状态
    const w = Game.canvas.width;
    ctx.font = '12px "Microsoft YaHei"';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f4d35e';
    ctx.fillText('第 ' + (Game.dayCount || 1) + ' 天', w - 10, 10);
    ctx.fillStyle = '#f4d35e';
    ctx.fillText('💰 ' + (Game.player.party.gold || 0), w - 10, 28);
    ctx.fillStyle = '#78d878';
    ctx.fillText('👥 ' + Game.player.party.members.filter(m => !m.isDead).length + '/' + Game.player.party.members.length, w - 10, 46);
    // HP条
    const hpPct = Game.player.hp / Game.player.maxHp;
    ctx.fillStyle = '#5a1e1e';
    ctx.fillRect(w - 110, 62, 100, 8);
    ctx.fillStyle = '#d84848';
    ctx.fillRect(w - 110, 62, 100 * Math.max(0, hpPct), 8);
    ctx.strokeStyle = '#8a7a3e';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 110, 62, 100, 8);
    ctx.fillStyle = '#f4d35e';
    ctx.font = '10px "Microsoft YaHei"';
    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(Game.player.hp) + '/' + Game.player.maxHp, w - 10, 74);
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
    const html = `
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:auto;background:rgba(15,15,30,0.9);padding:50px 80px;border:3px solid #8a7a3e;border-radius:6px;">
        <h1 style="color:#f4d35e;font-size:48px;margin-bottom:12px;letter-spacing:8px;text-shadow:3px 3px 0 #3a2e1a;">铁骑风云</h1>
        <p style="color:#b89856;margin-bottom:40px;letter-spacing:4px;">像素开放世界 · 骑马与砍杀</p>
        <div style="display:flex;flex-direction:column;gap:12px;align-items:center;">
          <button class="ui-btn" id="btn-new-game" style="padding:14px 50px;font-size:18px;">开 始 新 游 戏</button>
          <button class="ui-btn" id="btn-continue" style="padding:14px 50px;font-size:18px;" disabled>继 续 游 戏</button>
          <button class="ui-btn" id="btn-help" style="padding:10px 50px;font-size:14px;">游 戏 帮 助</button>
        </div>
        <p style="color:#6a6a7a;margin-top:30px;font-size:11px;">鼠标点击地图移动 · 点击定居点进入 · 1/2键暂停</p>
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
    document.getElementById('btn-help').onclick = () => {
      this.showHelpPanel();
    };
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
  if (e.key === 'Escape') {
    if (StateManager.current === GameState.BATTLE) {
      // 战斗中无法退出
      return;
    }
    Game.ui && Game.ui.clearPanels();
  }
  if (e.key === '1' && Game.battleMap) {
    Game.battleMap.battleSpeed = 1;
  }
  if (e.key === '2' && Game.battleMap) {
    Game.battleMap.battleSpeed = 2;
  }
  if (e.key === '3' && Game.battleMap) {
    Game.battleMap.battleSpeed = 3;
  }
  if (e.key.toLowerCase() === 'c' && Game.player) {
    // 打开角色面板
    showCharacterPanel();
  }
  if (e.key.toLowerCase() === 'i' && Game.player) {
    // 打开背包
    showInventoryPanel();
  }
  if (e.key.toLowerCase() === 'p' && Game.player) {
    // 打开部队面板
    showPartyPanel();
  }
  if (e.key.toLowerCase() === 'q' && Game.world && Game.world.questSystem) {
    // 打开任务面板
    showQuestsPanel();
  }
});

// 角色面板
function showCharacterPanel() {
  Game.ui.clearPanels();
  const p = Game.player;
  const html = `
    <button class="ui-close" onclick="Game.ui.clearPanels()">×</button>
    <h2>角色信息</h2>
    <div style="padding:15px;">
      <div style="background:rgba(0,0,0,0.4);padding:12px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">姓名</span><span>${p.name}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">等级</span><span>Lv${p.level} (${p.exp}/${p.expNeeded})</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">生命</span><span>${p.hp}/${p.maxHp}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">力量</span><span>${p.strength}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">敏捷</span><span>${p.agility}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">体力</span><span>${p.vitality}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">智力</span><span>${p.intelligence}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">声望</span><span>${p.reputation}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">金币</span><span>💰 ${p.party.gold}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">总伤害</span><span style="color:#f86868;">${p.damage}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#b89856;">总防御</span><span style="color:#78d878;">${p.defense}</span></div>
      </div>
      <h3 style="color:#f4d35e;margin-bottom:8px;">当前装备</h3>
      <div style="background:rgba(0,0,0,0.4);padding:12px;">
        <div style="padding:4px 0;">⚔️ 武器：${p.equipment.weapon ? p.equipment.weapon.name : '无'}</div>
        <div style="padding:4px 0;">🛡️ 护甲：${p.equipment.armor ? p.equipment.armor.name : '无'}</div>
        <div style="padding:4px 0;">⛑️ 头盔：${p.equipment.helmet ? p.equipment.helmet.name : '无'}</div>
        <div style="padding:4px 0;">🛡️ 盾：${p.equipment.shield ? p.equipment.shield.name : '无'}</div>
      </div>
    </div>
  `;
  Game.ui.addPanel(html, { width: '420px' });
}

// 背包面板
function showInventoryPanel() {
  Game.ui.clearPanels();
  const inv = Game.player.party.inventory;
  let html = `
    <button class="ui-close" onclick="Game.ui.clearPanels()">×</button>
    <h2>背包</h2>
    <div style="padding:15px;">
      <div style="color:#b89856;margin-bottom:10px;">负重：${Game.player.party.currentLoad}/${Game.player.party.wagonCapacity}</div>
      <div style="background:rgba(0,0,0,0.4);padding:12px;max-height:400px;overflow-y:auto;">
  `;
  if (inv.length === 0) {
    html += `<p style="color:#6a6a7a;text-align:center;padding:20px;">背包空空如也</p>`;
  } else {
    inv.forEach(entry => {
      const item = entry.item;
      const isEquippable = ['weapon', 'armor', 'helmet', 'shield'].includes(item.type);
      const isConsumable = item.type === ItemType.CONSUMABLE;
      html += `
        <div class="ui-list-item" style="padding:8px;border-bottom:1px solid #4a3e2a;display:flex;justify-content:space-between;align-items:center;">
          <div>
          <div style="color:#f4d35e;">${item.name} <small style="color:#b89856;">x${entry.quantity}</small></div>
          <div style="font-size:11px;color:#a0a0a8;">${item.desc || ''}</div>
          </div>
          <div style="display:flex;gap:6px;">
  ${isEquippable ? `<button class="ui-btn" onclick="Game.player.equip(Game.player.party.inventory[${inv.indexOf(entry)}].item);setTimeout(showInventoryPanel,100" style="padding:4px 8px;font-size:11px;">装备</button>` : ''}
  ${isConsumable ? `<button class="ui-btn" onclick="Game.player.party.useConsumable('${item.id}');setTimeout(showInventoryPanel,100)" style="padding:4px 8px;font-size:11px;">使用</button>` : ''}
          </div>
        </div>`;
    });
  }
  html += `</div></div>`;
  Game.ui.addPanel(html, { width: '480px' });
}

// 部队面板
function showPartyPanel() {
  Game.ui.clearPanels();
  const members = Game.player.party.members;
  let html = `
    <button class="ui-close" onclick="Game.ui.clearPanels()">×</button>
    <h2>部队</h2>
    <div style="padding:15px;">
      <div style="color:#b89856;margin-bottom:10px;">总数：${members.length}/${Game.player.party.maxSize} ｜ 战力：${Game.player.party.power}</div>
      <div style="background:rgba(0,0,0,0.4);padding:12px;max-height:400px;overflow-y:auto;">
  `;
  members.forEach((m, idx) => {
    html += `
      <div class="ui-list-item" style="padding:8px;border-bottom:1px solid #4a3e2a;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:#f4d35e;">⚔️ ${m.name} <small style="color:#b89856;">Lv${m.level}</small></div>
          <div style="font-size:11px;color:#a0a0a8;">HP:${m.hp}/${m.maxHp} 攻:${m.baseDamage} 防:${m.baseDefense}</div>
        </div>
        ${m.isPlayer ? '' : `<button class="ui-btn" onclick="Game.player.party.removeMember(${idx});Game.player.party.recalcWage();setTimeout(showPartyPanel,100)" style="padding:4px 8px;font-size:11px;">解雇</button>`}
      </div>`;
  });
  html += `</div></div>`;
  Game.ui.addPanel(html, { width: '480px' });
}

// 任务面板
function showQuestsPanel() {
  Game.ui.clearPanels();
  const qs = Game.world.questSystem;
  let html = `
    <button class="ui-close" onclick="Game.ui.clearPanels()">×</button>
    <h2>任务列表</h2>
    <div style="padding:15px;max-height:450px;overflow-y:auto;">
      <h3 style="color:#f4d35e;margin-bottom:8px;">进行中</h3>
  `;
  if (qs.activeQuests.length === 0) {
    html += `<p style="color:#6a6a7a;padding:10px;">暂无任务</p>`;
  } else {
    qs.activeQuests.forEach(q => {
      html += `
        <div class="quest-item active" style="margin-bottom:10px;">
          <div style="color:#f4d35e;font-weight:bold;">📜 ${q.title}</div>
          <div style="font-size:12px;color:#c0c0c8;margin:4px 0;">${q.desc}</div>
          <div style="font-size:11px;color:#78d878;">进度：${q.progress}/${q.target.count || q.target.qty || '-'} ｜ 奖励:💰${q.rewardGold} 剩余:${q.timeRemaining}天</div>
        </div>`;
    });
  }
  html += `<hr style="border:1px dashed #4a3e2a;margin:15px 0;"><h3 style="color:#f4d35e;margin-bottom:8px;">已完成 (${qs.completedQuests.length})</h3>`;
  qs.completedQuests.slice(-10).reverse().forEach(q => {
    html += `<div class="quest-item completed" style="margin-bottom:8px;opacity:0.7;"><div style="color:#8a8a98;">✓ ${q.title}</div></div>`;
  });
  html += `</div>`;
  Game.ui.addPanel(html, { width: '480px' });
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
