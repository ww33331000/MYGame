// ===== UI对话与面板系统 =====
const UI = (() => {

  let currentDialog = null;
  const uiLayer = () => document.getElementById('ui-layer');

  function clear() {
    uiLayer().innerHTML = '';
    currentDialog = null;
  }

  function toast(msg) {
    const layer = document.getElementById('toast-layer');
    if (!layer) { alert(msg); return; }
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  }

  // 显示简单对话框
  function showDialog(title, bodyHtml, footerHtml) {
    clear();
    const dlg = document.createElement('div');
    dlg.className = 'dialog-overlay';
    dlg.innerHTML = `<div class="dialog-panel">
      <div class="dialog-title">${title}</div>
      <div class="dialog-body">${bodyHtml}</div>
      <div class="dialog-footer">${footerHtml || ''}</div>
    </div>`;
    uiLayer().appendChild(dlg);
    currentDialog = dlg;
    return dlg;
  }

  // 主菜单
  function showMainMenu(onStart, onContinue, onLoad) {
    clear();
    const menu = document.createElement('div');
    menu.className = 'main-menu';
    const hasSave = !!localStorage.getItem('pixel_overlord_save');
    menu.innerHTML = `
      <div class="title">像素霸主</div>
      <div class="subtitle">PIXEL  OVERLORD</div>
      <div class="menu-btns" style="display:flex;flex-direction:column;gap:10px;min-width:220px">
        <button class="pix-btn big" id="btn-start">开始新游戏</button>
        <button class="pix-btn big" id="btn-continue" ${hasSave ? '' : 'disabled'}>继续游戏</button>
        <button class="pix-btn" id="btn-about">关于</button>
      </div>
      <div style="margin-top:40px;color:#8b7355;font-size:12px">
        一个像素风开放世界 RPG - 征服大陆，建立王国
      </div>
    `;
    uiLayer().appendChild(menu);
    currentDialog = menu;
    document.getElementById('btn-start').onclick = onStart;
    document.getElementById('btn-continue').onclick = onContinue;
    document.getElementById('btn-about').onclick = () => {
      showDialog('关于', `
        <div style="line-height:1.8">
          <p><b>像素霸主</b> - 一款类骑马与砍杀风格的开放世界RPG</p>
          <p>在 40 座城镇、120 座城堡与 300 座村庄构成的世界中，建立商队、组建军团、争霸全大陆！</p>
          <p style="margin-top:10px">操控：</p>
          <p>· 点击地图 → 移动到目标</p>
          <p>· 点击城镇 → 进入互动</p>
          <p>· 使用界面按钮访问各个菜单</p>
        </div>
      `, '<button class="pix-btn" onclick="UI.clear()">返回</button>');
    };
  }

  // 角色创建
  function showCharacterCreate(onDone) {
    clear();
    const dlg = document.createElement('div');
    dlg.className = 'dialog-overlay';
    dlg.innerHTML = `<div class="dialog-panel">
      <div class="dialog-title">创建你的角色</div>
      <div class="dialog-body" style="min-width:320px">
        <div style="margin-bottom:10px">角色名：</div>
        <input id="char-name" type="text" value="无名勇士" style="width:100%;padding:8px;background:#252535;border:2px solid #5a5a6a;color:#f0e6d2;font-size:14px">
        <div style="margin-top:20px">背景：</div>
        <div id="bg-list" style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <div class="list-item" data-bg="merchant"><div><b>商人之子</b><div style="color:#8b7355">+魅力 +智力 +起始金币</div></div></div>
          <div class="list-item" data-bg="noble"><div><b>贵族后裔</b><div style="color:#8b7355">+力量 +初始装备</div></div></div>
          <div class="list-item" data-bg="warrior"><div><b>流浪战士</b><div style="color:#8b7355">+力量 +敏捷 +战术</div></div></div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="pix-btn primary" id="btn-confirm">确认</button>
      </div>
    </div>`;
    uiLayer().appendChild(dlg);
    let bg = 'warrior';
    dlg.querySelectorAll('.list-item').forEach(el => {
      el.onclick = () => {
        dlg.querySelectorAll('.list-item').forEach(x => x.style.borderColor = '#3a3a4a');
        el.style.borderColor = '#d4b862';
        bg = el.dataset.bg;
      };
    });
    dlg.querySelectorAll('.list-item')[2].click();
    document.getElementById('btn-confirm').onclick = () => {
      const name = document.getElementById('char-name').value || '无名勇士';
      onDone({ name, bg });
    };
  }

  // 显示地点交互
  function showSettlementMenu(settlement, playerParty, callbacks) {
    const p = Character.get();
    const isEnemy = Faction.getPlayerFaction() && Faction.isAtWar(Faction.getPlayerFaction(), settlement.faction);
    const facName = GameData.FACTIONS.find(f => f.id === settlement.faction)?.name || settlement.faction;
    const isPlayerFaction = Faction.getPlayerFaction() === settlement.faction;

    let body = '';
    body += `<div style="padding:8px;background:#252535;margin-bottom:10px;border-left:4px solid #d4b862">
      <div style="color:#d4b862;font-size:16px;font-weight:bold">${settlement.name}</div>
      <div style="color:#8b7355">${settlement.type === 'town' ? '城镇' : settlement.type === 'castle' ? '城堡' : '村庄'} · ${facName}势力</div>
      <div style="color:#e8e4d4;margin-top:6px">繁荣度：${Math.floor((settlement.prosperity || 0.5) * 100)}% · 守军：${(settlement.garrison || []).reduce((s,t)=>s+t.count,0)} 人</div>
    </div>`;

    let actions = [];
    if (settlement.type === 'town') {
      actions.push({ key: 'shop', label: '进入商店' });
      actions.push({ key: 'inn', label: '旅馆休息' });
      actions.push({ key: 'recruit', label: '招募士兵' });
      actions.push({ key: 'quest', label: '任务公告板' });
      actions.push({ key: 'smithy', label: '铁匠铺' });
      actions.push({ key: 'trade', label: '市场贸易' });
      actions.push({ key: 'lord', label: '拜见领主' });
    } else if (settlement.type === 'castle') {
      actions.push({ key: 'lord', label: '会见驻军领主' });
      actions.push({ key: 'quest', label: '任务公告板' });
      actions.push({ key: 'smithy', label: '铁匠铺' });
      if (isEnemy) actions.push({ key: 'siege', label: '围攻此城堡' });
    } else {
      actions.push({ key: 'recruit', label: '招募义勇' });
      actions.push({ key: 'trade', label: '购买补给' });
    }
    actions.push({ key: 'leave', label: '离开' });

    body += '<div style="display:flex;flex-direction:column;gap:6px">';
    for (const a of actions) {
      body += `<div class="list-item" data-key="${a.key}"><span>${a.label}</span></div>`;
    }
    body += '</div>';

    const dlg = showDialog(settlement.name, body, '');
    dlg.querySelectorAll('.list-item').forEach(el => {
      el.onclick = () => {
        callbacks.onAction(el.dataset.key, settlement);
      };
    });
  }

  // 通用商店
  function showShop(settlement, items) {
    let body = `<div style="color:#8b7355;margin-bottom:10px">金币: <b style="color:#d4b862">${Character.get().gold}</b></div>`;
    body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    for (const it of items) {
      const price = it.price || it.basePrice || 100;
      body += `<div class="item-card" data-id="${it.id}" data-price="${price}" data-qty="${it.qty}" data-name="${it.name}">
        <div class="ic-name">${it.name}${it.kind === 'weapon' ? ' ⚔' : it.kind === 'armor' ? ' 🛡' : ''}</div>
        <div style="color:#8b7355;font-size:11px">${it.rarity || '普通'} · 库存 ${it.qty}</div>
        <div style="color:#9fb8a0;font-size:11px">攻${it.atk||0} 防${it.def||0}</div>
        <div style="color:#d4b862;font-size:12px;margin-top:4px">${price}金</div>
        <button class="pix-btn" style="margin-top:6px;padding:4px 8px;font-size:11px" data-buy="${it.id}">购买</button>
      </div>`;
    }
    body += '</div>';
    const dlg = showDialog('商店 - ' + settlement.name, body, `<button class="pix-btn" id="shop-close">离开</button>`);
    dlg.querySelectorAll('[data-buy]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest('.item-card');
        const id = card.dataset.id;
        const price = parseInt(card.dataset.price);
        const name = card.dataset.name;
        const qty = 1;
        if (Economy.buy(id, qty, price)) {
          // 库存减少
          card.dataset.qty = (parseInt(card.dataset.qty) - 1);
          if (parseInt(card.dataset.qty) <= 0) card.style.display = 'none';
        }
      };
    });
    document.getElementById('shop-close').onclick = () => UI.clear();
  }

  // 出售物品
  function showSellMenu() {
    const items = Inventory.getAll();
    if (items.length === 0) {
      showDialog('出售', '你没有可以出售的物品', '<button class="pix-btn" id="btn-close">关闭</button>');
      document.getElementById('btn-close').onclick = () => UI.clear();
      return;
    }
    let body = `<div style="color:#8b7355;margin-bottom:10px">金币: <b style="color:#d4b862">${Character.get().gold}</b></div>`;
    body += '<div>';
    for (const it of items) {
      const itemData = GameData.getItem(it.itemId);
      const price = Math.floor((itemData?.price || itemData?.basePrice || 10) * 0.5);
      body += `<div class="list-item" data-sell="${it.itemId}" data-price="${price}">
        <span>${itemData?.name || it.itemId} × ${it.qty}</span>
        <span class="meta">${price}金/个</span>
      </div>`;
    }
    body += '</div>';
    const dlg = showDialog('出售物品', body, `<button class="pix-btn" id="btn-close">关闭</button>`);
    dlg.querySelectorAll('[data-sell]').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.sell;
        const price = parseInt(el.dataset.price);
        if (Economy.sell(id, 1, price)) {
          el.querySelector('.meta').textContent = (parseInt(el.querySelector('.meta').textContent) - price + price) + '金/个';
          showSellMenu();
        }
      };
    });
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 招募
  function showRecruit(settlement) {
    const culture = settlement.faction;
    let pool = [];
    const troopsByFaction = {
      imperial: [{ type: 'imperial_legionary', cost: 200 }, { type: 'imperial_cavalry', cost: 400 }, { type: 'imperial_archer', cost: 250 }],
      nordia: [{ type: 'nordia_warrior', cost: 180 }, { type: 'nordia_beserker', cost: 350 }],
      vaegir: [{ type: 'vaegir_raider', cost: 150 }, { type: 'vaegir_horse_archer', cost: 400 }],
      sultanate: [{ type: 'sultan_guard', cost: 500 }, { type: 'sultan_archer', cost: 250 }, { type: 'sultan_infantry', cost: 200 }],
      rhomney: [{ type: 'rhomney_crossbow', cost: 250 }, { type: 'rhomney_mercenary', cost: 200 }, { type: 'rhomney_heavy', cost: 400 }],
      wasteland: [{ type: 'wasteland_raider', cost: 100 }, { type: 'wasteland_brute', cost: 250 }],
      neutral: [{ type: 'recruit', cost: 60 }, { type: 'caravan_guard', cost: 120 }],
    };
    pool = troopsByFaction[culture] || troopsByFaction.neutral;

    let body = `<div style="color:#8b7355;margin-bottom:10px">金币: <b style="color:#d4b862">${Character.get().gold}</b> · 队伍上限: ${Character.partySizeLimit()} · 当前: ${Party.getTroopCount(World.getPlayerParty())}</div>`;
    for (const p of pool) {
      const tmpl = GameData.TROOPS[p.type];
      body += `<div class="list-item" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;justify-content:space-between">
          <div>
            <div style="color:#d4b862">${tmpl.name}</div>
            <div style="color:#8b7355;font-size:11px">攻:${tmpl.atk} 防:${tmpl.def} HP:${tmpl.hp} 类型:${tmpl.type === 'rng' ? '弓兵' : tmpl.type === 'cav' ? '骑兵' : '步兵'}</div>
          </div>
          <div style="text-align:right">
            <div style="color:#d4b862">${p.cost}金 /人</div>
            <input type="number" min="1" max="50" value="5" id="rec-${p.type}" style="width:60px;padding:4px;background:#252535;border:2px solid #5a5a6a;color:#f0e6d2">
            <button class="pix-btn" style="margin-left:4px;padding:4px 8px;font-size:11px" data-recruit="${p.type}" data-cost="${p.cost}">招募</button>
          </div>
        </div>
      </div>`;
    }
    const dlg = showDialog('招募士兵 - ' + settlement.name, body, `<button class="pix-btn" id="btn-close">离开</button>`);
    dlg.querySelectorAll('[data-recruit]').forEach(btn => {
      btn.onclick = (e) => {
        const type = btn.dataset.recruit;
        const cost = parseInt(btn.dataset.cost);
        const qty = parseInt(document.getElementById('rec-' + type).value) || 1;
        const totalCost = cost * qty;
        if (Character.get().gold < totalCost) {
          toast('金币不足');
          return;
        }
        // 暂时借用recruit函数
        Party.recruitInTown(settlement, type, qty);
      };
    });
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 装备界面
  function showInventory() {
    const items = Inventory.getAll();
    const p = Character.get();
    const slotNames = { weapon: '武器', armor: '护甲', head: '头盔', shield: '盾牌' };
    let body = `<div style="padding:8px;background:#252535;margin-bottom:10px;border-left:4px solid #d4b862">
      <div style="color:#d4b862;font-weight:bold">${p.name}</div>
      <div style="color:#8b7355;font-size:12px">等级: ${p.level} | 金币: ${p.gold} | 攻击: ${Character.totalAtk()} | 防御: ${Character.totalDef()} | HP: ${Math.floor(p.hp)}/${p.maxHp}</div>
      <div style="color:#8b7355;font-size:12px;margin-top:4px">声望: ${p.renown} | 属性: 力${p.stats.str} 敏${p.stats.agl} 智${p.stats.int} 魅${p.stats.cha}</div>
    </div>`;
    body += '<div style="color:#d4b862;margin-bottom:6px">当前装备：</div>';
    for (const [slot, slotName] of Object.entries(slotNames)) {
      const eqId = p.equipment[slot];
      const eq = eqId ? GameData.getItem(eqId) : null;
      body += `<div class="list-item"><span>${slotName}: ${eq ? eq.name : '(空)'}</span>
        ${eq ? `<button class="pix-btn" style="padding:2px 8px;font-size:11px" data-unequip="${slot}">卸下</button>` : ''}
      </div>`;
    }
    body += '<div style="color:#d4b862;margin:10px 0 6px">物品：</div>';
    if (items.length === 0) body += '<div style="color:#8b7355">空空如也</div>';
    for (const it of items) {
      const data = GameData.getItem(it.itemId);
      if (!data) continue;
      body += `<div class="list-item">
        <div><b style="color:#f0e6d2">${data.name}</b> × ${it.qty}
          <div style="color:#8b7355;font-size:11px">${data.kind === 'weapon' ? '武器' : data.kind === 'armor' ? '护甲' : data.kind === 'goods' ? '商品' : '材料'} · 攻${data.atk||0} 防${data.def||0}</div>
        </div>
        ${(data.kind === 'weapon' || data.kind === 'armor') && data.slot ? `<button class="pix-btn" style="padding:2px 8px;font-size:11px" data-equip="${it.itemId}">装备</button>` : ''}
      </div>`;
    }
    const dlg = showDialog('角色与物品', body, `
      <button class="pix-btn" id="btn-upgrade">属性点(${p.attrPoints})</button>
      <button class="pix-btn" id="btn-skill">技能点(${p.skillPoints})</button>
      <button class="pix-btn" id="btn-close">关闭</button>
    `);
    dlg.querySelectorAll('[data-equip]').forEach(btn => {
      btn.onclick = () => { Inventory.equip(btn.dataset.equip); showInventory(); };
    });
    dlg.querySelectorAll('[data-unequip]').forEach(btn => {
      btn.onclick = () => { Inventory.unequip(btn.dataset.unequip); showInventory(); };
    });
    document.getElementById('btn-upgrade').onclick = () => {
      if (p.attrPoints > 0) {
        p.attrPoints--;
        p.stats.str += 2;
        p.stats.agl += 1;
        p.maxHp = Character.totalMaxHp();
        showInventory();
        toast('属性提升！');
      }
    };
    document.getElementById('btn-skill').onclick = () => {
      if (p.skillPoints > 0) {
        p.skillPoints--;
        p.skills.leadership = (p.skills.leadership || 0) + 1;
        p.skills.tactics = (p.skills.tactics || 0) + 1;
        showInventory();
        toast('技能提升！');
      }
    };
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 队伍管理
  function showParty() {
    const pp = World.getPlayerParty();
    const p = Character.get();
    let body = `<div style="padding:8px;background:#252535;margin-bottom:10px;border-left:4px solid #d4b862">
      <div>总人数: ${Party.getTroopCount(pp)} / ${Character.partySizeLimit()}</div>
      <div>队伍战力: ${Party.calcPartyStrength(pp)}</div>
      <div>移动速度: ${Party.calcPartySpeed(pp).toFixed(2)}</div>
    </div>`;
    if (pp.troops.length === 0) body += '<div style="color:#8b7355">队伍为空</div>';
    for (const t of pp.troops) {
      const tmpl = GameData.TROOPS[t.type];
      body += `<div class="list-item"><span>${tmpl.name} × ${t.count}</span>
        <button class="pix-btn" style="padding:2px 8px;font-size:11px" data-dismiss="${t.type}">解散1人</button>
      </div>`;
    }
    const dlg = showDialog('队伍管理', body, `<button class="pix-btn" id="btn-close">关闭</button>`);
    dlg.querySelectorAll('[data-dismiss]').forEach(btn => {
      btn.onclick = () => { Party.dismissTroop(btn.dataset.dismiss, 1); showParty(); };
    });
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 势力
  function showFactions() {
    const factions = Faction.getAllFactionsWithStats();
    const pFaction = Faction.getPlayerFaction();
    let body = `<div style="color:#8b7355;margin-bottom:10px">你的声望值（点击可查看详情）</div>`;
    for (const f of factions) {
      const p = Character.get();
      const rep = p.reputation[f.id] || 0;
      body += `<div class="list-item">
        <div>
          <div style="color:${f.color};font-weight:bold">${f.name}</div>
          <div style="color:#8b7355;font-size:11px">城镇: ${f.towns} | 城堡: ${f.castles} | 村庄: ${f.villages} | 战力: ${f.totalTroops}</div>
          <div style="color:#d4b862;font-size:11px">对你的声望: ${rep} ${f.atWar.includes(pFaction) ? ' (交战中)' : ''}</div>
        </div>
        ${pFaction !== f.id && rep >= 10 && !pFaction ? `<button class="pix-btn" style="padding:4px 8px;font-size:11px" data-swear="${f.id}">效忠</button>` : ''}
        ${f.id === pFaction ? `<button class="pix-btn" style="padding:4px 8px;font-size:11px" data-renounce="1">解除效忠</button>` : ''}
      </div>`;
    }
    // 建立王国
    body += '<div style="margin-top:10px"></div>';
    if (!pFaction && Character.get().renown >= 100) {
      body += '<button class="pix-btn primary" id="btn-kingdom">建立自己的王国</button>';
    }
    const dlg = showDialog('势力一览', body, `<button class="pix-btn" id="btn-close">关闭</button>`);
    dlg.querySelectorAll('[data-swear]').forEach(btn => {
      btn.onclick = () => { Faction.swearAllegiance(btn.dataset.swear); showFactions(); };
    });
    dlg.querySelectorAll('[data-renounce]').forEach(btn => {
      btn.onclick = () => { Faction.renounceAllegiance(); showFactions(); };
    });
    if (document.getElementById('btn-kingdom')) {
      document.getElementById('btn-kingdom').onclick = () => {
        Faction.establishPlayerKingdom('玩家王国', '#d4b862');
        showFactions();
      };
    }
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 任务
  function showQuests(settlement) {
    const active = Quest.getAll();
    let available = [];
    if (settlement) {
      Quest.generateForSettlement(settlement);
      available = Quest.getAvailable().filter(q => q.issuedAt === settlement.id && !q.accepted);
    }
    let body = '<div style="color:#d4b862;margin-bottom:6px">进行中：</div>';
    if (active.length === 0) body += '<div style="color:#8b7355">无进行中任务</div>';
    for (const q of active) {
      const s = World.getSettlement(q.issuedAt);
      body += `<div class="list-item"><div>
        <b style="color:#f0e6d2">${q.name}</b>
        <div style="color:#8b7355;font-size:11px">发放地: ${s ? s.name : '?'} · 奖励: ${q.rewardGold}金 · 剩余 ${Math.floor(q.dayDeadline - World.get().day)}天</div>
      </div><button class="pix-btn" style="padding:2px 8px;font-size:11px" data-abandon="${q.id}">放弃</button></div>`;
    }
    if (available.length > 0) {
      body += '<div style="color:#d4b862;margin:10px 0 6px">可接取：</div>';
      for (const q of available) {
        body += `<div class="list-item"><div>
          <b style="color:#f0e6d2">${q.name}</b>
          <div style="color:#8b7355;font-size:11px">奖励: ${q.rewardGold}金 · 时长: ${q.duration}天</div>
        </div><button class="pix-btn" style="padding:2px 8px;font-size:11px" data-accept="${q.id}">接取</button></div>`;
      }
    }
    const dlg = showDialog('任务', body, `<button class="pix-btn" id="btn-close">关闭</button>`);
    dlg.querySelectorAll('[data-accept]').forEach(btn => {
      btn.onclick = () => { Quest.accept(btn.dataset.accept); showQuests(settlement); };
    });
    dlg.querySelectorAll('[data-abandon]').forEach(btn => {
      btn.onclick = () => { Quest.abandon(btn.dataset.accept); showQuests(settlement); };
    });
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 打造
  function showSmithy() {
    const recipes = Inventory.getRecipes();
    let body = `<div style="color:#8b7355;margin-bottom:10px">锻造等级: ${Character.get().skills.smithing}</div>`;
    for (const r of recipes) {
      const item = GameData.getItem(r.result);
      const can = Inventory.canCraft(r);
      body += `<div class="list-item"><div>
        <b style="color:${can ? '#d4b862' : '#6a6a7a'}">${item.name}</b>
        <div style="color:#8b7355;font-size:11px">需要: ${Object.entries(r.cost).map(([id,q])=>{
          const m=GameData.getItem(id); return (m?.name||id) + '×' + q;
        }).join('、')} · 金币 ${r.gold} · 铁匠Lv${r.req}</div>
      </div>
      <button class="pix-btn" style="padding:4px 8px;font-size:11px" ${can ? '' : 'disabled'} data-craft="${r.id}">打造</button></div>`;
    }
    const dlg = showDialog('铁匠铺 - 打造装备', body, `<button class="pix-btn" id="btn-close">关闭</button>`);
    dlg.querySelectorAll('[data-craft]').forEach(btn => {
      btn.onclick = () => { if (Inventory.craft(btn.dataset.craft)) showSmithy(); };
    });
    document.getElementById('btn-close').onclick = () => UI.clear();
  }

  // 战斗UI
  function showBattleUI(state, onFlee, onSpeed) {
    if (document.getElementById('battle-ui')) {
      document.getElementById('battle-ui').remove();
    }
    const ui = document.createElement('div');
    ui.id = 'battle-ui';
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:15';
    ui.innerHTML = `
      <div style="position:absolute;top:10px;left:10px;background:rgba(20,20,30,0.9);border:2px solid #8b7355;padding:8px 12px;color:#fff;font-size:13px;pointer-events:auto">
        <div style="color:#6ac46a">我方: ${state.player.filter(u=>u.hp>0).length}</div>
        <div style="color:#c46a6a">敌方: ${state.enemy.filter(u=>u.hp>0).length}</div>
      </div>
      <div style="position:absolute;bottom:10px;right:10px;display:flex;gap:6px;pointer-events:auto">
        <button class="pix-btn" id="btn-speed">速度 x${state.speed}</button>
        <button class="pix-btn danger" id="btn-flee">撤退</button>
      </div>
    `;
    uiLayer().appendChild(ui);
    document.getElementById('btn-speed').onclick = () => onSpeed();
    document.getElementById('btn-flee').onclick = () => onFlee();
  }

  return {
    clear, toast, showMainMenu, showCharacterCreate, showDialog,
    showSettlementMenu, showShop, showSellMenu, showRecruit,
    showInventory, showParty, showFactions, showQuests, showSmithy,
    showBattleUI
  };
})();
