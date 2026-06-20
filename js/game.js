// ===== 游戏主循环与状态管理 =====
const Game = (() => {

  let state = 'menu'; // 'menu' | 'map' | 'battle'
  let targetMove = null;  // 玩家地图移动目标
  let lastTime = 0;
  let timeAccum = 0;
  let dayCounter = 0;

  function getState() { return state; }
  function getTargetMove() { return targetMove; }

  function startNewGame(charInfo) {
    UI.clear();
    // 生成世界
    World.generate(Date.now());
    // 初始化角色
    Character.createPlayer(charInfo.name);
    // 根据背景给予加成
    const p = Character.get();
    if (charInfo.bg === 'merchant') {
      p.gold += 1500;
      p.stats.cha += 3;
      p.skills.trade = 3;
    } else if (charInfo.bg === 'noble') {
      p.gold += 800;
      p.stats.str += 3;
    } else if (charInfo.bg === 'warrior') {
      p.gold += 300;
      p.stats.str += 4;
      p.stats.agl += 3;
      p.skills.tactics = 2;
    }
    // 初始化背包
    Inventory.init();
    Inventory.add('g_grain', 10);
    // 玩家party位置
    const pp = World.getPlayerParty();
    const startTown = World.get().settlements.find(s => s.type === 'town' && s.faction === 'rhomney');
    if (startTown) { pp.x = startTown.x + 30; pp.y = startTown.y + 30; }
    // 重置任务
    Quest.setAll([]);
    // 生成地形缓存
    Render.generateTerrain(World.get().mapSize.w, World.get().mapSize.h);
    // 镜头对准玩家
    Render.setCameraTarget(pp.x, pp.y);

    state = 'map';
    UI.toast('欢迎来到像素霸主！点击地图移动');
  }

  function continueGame() {
    if (Save.load()) {
      UI.clear();
      Render.generateTerrain(World.get().mapSize.w, World.get().mapSize.h);
      state = 'map';
      const pp = World.getPlayerParty();
      Render.setCameraTarget(pp.x, pp.y);
      UI.toast('继续游戏');
    } else {
      UI.toast('没有存档');
    }
  }

  // ==== 战斗 ====
  function startBattle(enemyParty) {
    const playerParty = World.getPlayerParty();
    if (!playerParty || playerParty.troops.length === 0) {
      UI.toast('没有可作战的士兵');
      return;
    }
    Battle.start(playerParty, enemyParty, { enemyParty });
    state = 'battle';
    UI.clear();
  }

  function onBattleEnd(playerWon, ctx) {
    state = 'map';
    // 清理战斗后状态
    const pp = World.getPlayerParty();
    if (pp.battleWith) {
      // 将被击败的敌队从世界中清除（或让其逃离）
      if (playerWon) {
        const idx = World.get().parties.indexOf(ctx.enemyParty);
        if (idx >= 0 && (ctx.enemyParty.type === 'bandit' || ctx.enemyParty.type === 'bandit_lord')) {
          World.get().parties.splice(idx, 1);
          UI.toast('敌人被击败');
        } else {
          // 领主/商队继续存在
          ctx.enemyParty.x += 100;
          ctx.enemyParty.y += 100;
        }
        Character.gainExp(30);
      }
      pp.battleWith = null;
      pp.battleTriggered = false;
    }
    Render.setCameraTarget(pp.x, pp.y);
    UI.showBattleUI(null);
    UI.clear();
  }

  function tick(dt) {
    timeAccum += dt;
    // 地图时间流动：1小时 = 0.5秒
    if (state === 'map') {
      World.advanceTime(dt * 2); // dt秒 = 2游戏小时
      dayCounter += dt;
      // 每 ~20 秒结算一次每日事件
      if (dayCounter > 15) {
        dayCounter = 0;
        Party.dailyUpkeep();
        Quest.dailyUpdate();
        // 自动保存
        Save.save();
      }
      // AI更新
      MapAI.update(dt * 2);
      // 玩家移动
      const pp = World.getPlayerParty();
      if (targetMove) {
        const oldX = pp.x, oldY = pp.y;
        const reached = World.movePartyToward(pp, targetMove.x, targetMove.y, dt, Party.calcPartySpeed(pp));
        Render.panCamera(pp.x, pp.y, dt);
        // 检查是否到达或经过地点
        const w = World.get();
        let nearestS = null, nearestD = 20;
        for (const s of w.settlements) {
          const d = Math.hypot(s.x - pp.x, s.y - pp.y);
          if (d < nearestD) { nearestD = d; nearestS = s; }
        }
        if (nearestS && !pp._lastVisited || (pp._lastVisited && pp._lastVisited !== nearestS.id)) {
          if (nearestS) {
            pp._lastVisited = nearestS.id;
            targetMove = null;
            UI.clear();
            openSettlement(nearestS);
            return;
          }
        }
        if (reached) {
          targetMove = null;
          pp._lastVisited = null;
        }
      }
      // 检查AI触发的战斗（劫匪袭击）
      if (pp.battleWith && !pp.battleFightStarted) {
        pp.battleFightStarted = true;
        UI.showDialog('遭遇战', `<div>劫匪袭击你的商队！</div><div style="color:#8b7355">敌方战力: ${Party.calcPartyStrength(pp.battleWith)}<br>你的战力: ${Party.calcPartyStrength(pp)}</div>`,
          `<button class="pix-btn primary" id="btn-fight">迎战</button><button class="pix-btn" id="btn-retreat">尝试逃跑</button>`);
        const fight = () => startBattle(pp.battleWith);
        const retreat = () => {
          if (Math.random() < 0.5) {
            UI.toast('成功逃脱');
            pp.battleWith = null;
            pp.battleTriggered = false;
            pp.battleFightStarted = false;
            UI.clear();
          } else {
            UI.toast('无法逃脱！');
            fight();
          }
        };
        document.getElementById('btn-fight').onclick = fight;
        document.getElementById('btn-retreat').onclick = retreat;
        return;
      }
      // 重置遭遇战触发
      if (!pp.battleWith) {
        pp.battleFightStarted = false;
      }
    } else if (state === 'battle') {
      Battle.update(dt);
    }
  }

  function render(dt) {
    // 地图和HUD
    if (state === 'map') {
      Render.renderWorld(World.get(), dt);
      Render.renderHUD(World.get());
      renderBottomMenu();
    } else if (state === 'battle') {
      Render.renderBattle(Battle.get(), dt);
      UI.showBattleUI(Battle.get(),
        () => {
          // 撤退：检查成功率
          if (Math.random() < 0.5) {
            UI.toast('成功撤退');
            Battle.endBattle(false);
          } else {
            UI.toast('撤退失败！');
          }
        },
        () => {
          const s = Battle.get();
          if (s) {
            s.speed = s.speed >= 3 ? 1 : s.speed + 1;
            UI.showBattleUI(s, null, null);
            // 重新绑定按钮
            const speedBtn = document.getElementById('btn-speed');
            const fleeBtn = document.getElementById('btn-flee');
            if (speedBtn) speedBtn.onclick = () => {
              s.speed = s.speed >= 3 ? 1 : s.speed + 1;
              speedBtn.textContent = '速度 x' + s.speed;
            };
            if (fleeBtn) fleeBtn.onclick = () => {
              if (Math.random() < 0.5) { Battle.endBattle(false); }
              else UI.toast('撤退失败！');
            };
          }
        }
      );
    }
  }

  function renderBottomMenu() {
    const cnv = document.getElementById('game-canvas');
    const cw = cnv ? cnv.width / (window.devicePixelRatio || 1) : 800;
    const ch = cnv ? cnv.height / (window.devicePixelRatio || 1) : 600;
    // 底部按钮由DOM渲染
    if (!document.getElementById('bottom-menu')) {
      const menu = document.createElement('div');
      menu.id = 'bottom-menu';
      menu.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto;z-index:20';
      document.getElementById('ui-layer').appendChild(menu);
    }
    const menu = document.getElementById('bottom-menu');
    if (!menu || menu.children.length === 0) {
      menu.innerHTML = `
        <button class="pix-btn" id="b-char">角色</button>
        <button class="pix-btn" id="b-party">队伍</button>
        <button class="pix-btn" id="b-inv">物品</button>
        <button class="pix-btn" id="b-fac">势力</button>
        <button class="pix-btn" id="b-quest">任务</button>
        <button class="pix-btn" id="b-save">保存</button>
        <button class="pix-btn danger" id="b-menu">主菜单</button>
      `;
      document.getElementById('b-char').onclick = () => UI.showInventory();
      document.getElementById('b-party').onclick = () => UI.showParty();
      document.getElementById('b-inv').onclick = () => UI.showInventory();
      document.getElementById('b-fac').onclick = () => UI.showFactions();
      document.getElementById('b-quest').onclick = () => {
        // 找最近的城镇
        const pp = World.getPlayerParty();
        const towns = World.get().settlements.filter(s => s.type === 'town');
        let best = towns[0], bestD = Infinity;
        for (const t of towns) {
          const d = Math.hypot(t.x - pp.x, t.y - pp.y);
          if (d < bestD) { bestD = d; best = t; }
        }
        UI.showQuests(best);
      };
      document.getElementById('b-save').onclick = () => Save.save();
      document.getElementById('b-menu').onclick = () => {
        UI.showDialog('菜单', '返回主菜单（未保存的进度会丢失）',
          `<button class="pix-btn" id="btn-back">继续游戏</button><button class="pix-btn danger" id="btn-menu2">返回主菜单</button>`);
        document.getElementById('btn-back').onclick = () => UI.clear();
        document.getElementById('btn-menu2').onclick = () => { Save.save(); location.reload(); };
      };
    }
  }

  // ==== 地点交互 ====
  function openSettlement(s) {
    UI.showSettlementMenu(s, World.getPlayerParty(), {
      onAction: (key, settlement) => handleSettlementAction(key, settlement)
    });
  }

  function handleSettlementAction(key, s) {
    const pp = World.getPlayerParty();
    // 检查敌对
    const playerFaction = Faction.getPlayerFaction();
    if (playerFaction && Faction.isAtWar(playerFaction, s.faction) && key !== 'leave' && key !== 'siege') {
      UI.toast('你与该势力处于交战状态，无法进入');
      return;
    }
    if (key === 'leave') {
      UI.clear();
      pp._lastVisited = null;
      return;
    }
    if (key === 'shop') {
      const items = Economy.getShopInventory(s);
      UI.showShop(s, items);
      return;
    }
    if (key === 'inn') {
      if (Character.get().gold < 20) { UI.toast('金币不足'); return; }
      Character.get().gold -= 20;
      Character.get().hp = Character.totalMaxHp();
      UI.toast('休息完毕，HP已恢复');
      return;
    }
    if (key === 'recruit') {
      UI.showRecruit(s);
      return;
    }
    if (key === 'quest') {
      UI.showQuests(s);
      return;
    }
    if (key === 'smithy') {
      UI.showSmithy();
      return;
    }
    if (key === 'trade') {
      UI.showSellMenu();
      return;
    }
    if (key === 'lord') {
      const items = Economy.getShopInventory(s);
      UI.showDialog('拜见领主', `<div>领主：欢迎来到 ${s.name}，旅行者。</div>
        <div style="color:#8b7355;margin-top:8px">此处由 ${GameData.FACTIONS.find(f=>f.id===s.faction)?.name || s.faction} 控制。</div>
        <div style="margin-top:8px">你的声望: ${Character.get().reputation[s.faction] || 0}</div>
        <div style="margin-top:10px">${(Character.get().reputation[s.faction] || 0) >= 5 ? '领主对你表示欢迎，给予了一些金币。' : '领主仅礼貌地接待了你。'}</div>`,
        `<button class="pix-btn" id="btn-close">离开</button>
         ${(Character.get().reputation[s.faction] || 0) >= 5 ? '<button class="pix-btn primary" id="btn-gift">接受礼物</button>' : ''}`);
      if (document.getElementById('btn-gift')) {
        document.getElementById('btn-gift').onclick = () => {
          Character.get().gold += 200;
          UI.toast('+200金');
          UI.clear();
        };
      }
      document.getElementById('btn-close').onclick = () => UI.clear();
      return;
    }
    if (key === 'siege') {
      // 简单攻城战
      const defenders = Party.calcPartyStrength({ troops: s.garrison });
      const attackers = Party.calcPartyStrength(pp);
      UI.showDialog('围攻 ' + s.name,
        `<div>守军战力: ${defenders}</div><div>你的战力: ${attackers}</div>
         <div style="color:#8b7355;margin-top:8px">围攻将消耗大量士兵和金币。确定继续？</div>`,
        `<button class="pix-btn" id="btn-no">取消</button><button class="pix-btn danger" id="btn-yes">发起进攻</button>`);
      document.getElementById('btn-no').onclick = () => UI.clear();
      document.getElementById('btn-yes').onclick = () => {
        if (attackers > defenders * 1.2) {
          // 胜利
          const playerId = Faction.getPlayerFaction() || 'player_kingdom';
          if (!Faction.getPlayerFaction()) Faction.establishPlayerKingdom('玩家王国', '#d4b862');
          World.captureSettlement(s.id, Faction.getPlayerFaction());
          Party.applyCasualties(pp, 0.4);
          Character.gainExp(80);
          Character.addReputation(s.faction, -20);
          UI.toast('攻占成功！');
          UI.clear();
        } else {
          Party.applyCasualties(pp, 0.6);
          UI.toast('围攻失败，损失惨重');
          UI.clear();
        }
      };
    }
  }

  // ==== 输入 ====
  function initInput() {
    const cnv = document.getElementById('game-canvas');
    if (!cnv) return;

    function handleClick(e) {
      const rect = cnv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (state === 'map') {
        // 检查是否点击到地点或敌方队伍
        const s = Render.setHoverFromScreen(x, y);
        const enemy = Render.findPartyNear(x, y);
        if (s) {
          openSettlement(s);
          return;
        }
        if (enemy && (enemy.type === 'bandit' || enemy.type === 'bandit_lord')) {
          // 攻击敌方
          UI.showDialog('发现敌人', `<div>名称: ${GameData.TROOPS[enemy.troops[0]?.type]?.name || '敌人'}</div>
            <div>敌方战力: ${Party.calcPartyStrength(enemy)}</div>
            <div>你的战力: ${Party.calcPartyStrength(World.getPlayerParty())}</div>`,
            `<button class="pix-btn primary" id="btn-fight">发起攻击</button><button class="pix-btn" id="btn-ignore">忽略</button>`);
          document.getElementById('btn-fight').onclick = () => startBattle(enemy);
          document.getElementById('btn-ignore').onclick = () => UI.clear();
          return;
        }
        // 设置地图移动目标
        const worldPos = Render.screenToWorld(x, y);
        targetMove = { x: worldPos.x, y: worldPos.y };
        UI.clear();
      }
    }

    function handleMouseMove(e) {
      if (state !== 'map') return;
      const rect = cnv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      Render.setHoverFromScreen(x, y);
    }

    cnv.addEventListener('click', handleClick);
    cnv.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
      }
    }, { passive: false });
    cnv.addEventListener('mousemove', handleMouseMove);

    // 键盘
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state === 'battle') return;
        UI.clear();
      }
      if (e.key === 'c' || e.key === 'C') UI.showInventory();
      if (e.key === 'p' || e.key === 'P') UI.showParty();
      if (e.key === 'f' || e.key === 'F') UI.showFactions();
      if (e.key === 'q' || e.key === 'Q') UI.showQuests(null);
    });
  }

  function toast(msg) { UI.toast(msg); }

  return {
    getState, getTargetMove,
    startNewGame, continueGame, startBattle, onBattleEnd,
    tick, render, toast, initInput, openSettlement
  };
})();
