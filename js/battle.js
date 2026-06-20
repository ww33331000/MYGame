// ===== 实时战斗系统（像素风格）
const Battle = (() => {
  let state = null;

  function isActive() { return state && state.active; }
  function get() { return state; }

  function partyToUnits(party, side) {
    const units = [];
    let idx = 0;
    for (const t of party.troops) {
      const tmpl = GameData.TROOPS[t.type];
      if (!tmpl || t.count <= 0) continue;
      for (let i = 0; i < t.count; i++) {
        units.push({
          id: side + '_' + (idx++) + '_' + t.type + '_' + i,
          type: t.type,
          template: tmpl,
          side,
          x: 0, y: 0,
          hp: tmpl.hp,
          maxHp: tmpl.hp,
          atk: tmpl.atk,
          def: tmpl.def,
          spd: tmpl.spd,
          range: tmpl.range || 0,
          target: null,
          cooldown: 0,
          state: 'idle',
          animFrame: Math.floor(Math.random()*4),
          animTimer: 0,
        });
      }
    }
    return units;
  }

  function start(playerParty, enemyParty, context) {
    context = context || {};
    const playerUnits = partyToUnits(playerParty, 'player');
    const p = Character.get();
    const wpn = p.equipment?.weapon ? GameData.getItem(p.equipment.weapon) : null;
    playerUnits.push({
      id: 'player_hero',
      type: 'hero',
      template: { name: p.name, color: '#d4b862', spd: 2.2 },
      side: 'player',
      x: 0, y: 0,
      hp: p.hp,
      maxHp: p.maxHp,
      atk: Character.totalAtk(),
      def: Character.totalDef(),
      spd: 2.2,
      range: wpn && wpn.range ? wpn.range : 0,
      target: null,
      cooldown: 0,
      state: 'idle',
      isHero: true,
    });

    const enemyUnits = partyToUnits(enemyParty, 'enemy');

    const W = 900, H = 500;
    function placeUnits(units, side) {
      const baseX = side === 'player' ? 100 : W - 100;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.x = baseX + (Math.random() - 0.5) * 150;
        u.y = 80 + (i % 8) * 50 + Math.random() * 20;
      }
    }
    placeUnits(playerUnits, 'player');
    placeUnits(enemyUnits, 'enemy');

    state = {
      active: true,
      w: W, h: H,
      player: playerUnits,
      enemy: enemyUnits,
      projectiles: [],
      effects: [],
      context,
      speed: 1,
      timer: 0,
    };
    return state;
  }

  function update(dt) {
    if (!state || !state.active) return;
    dt = dt * state.speed;
    state.timer += dt;
    const allUnits = [...state.player, ...state.enemy];
    for (const u of allUnits) {
      if (u.hp <= 0) continue;
      const enemyList = u.side === 'player' ? state.enemy : state.player;
      if (!u.target || u.target.hp <= 0) {
        let best = null, bestD = Infinity;
        for (const e of enemyList) {
          if (e.hp <= 0) continue;
          const d = (e.x - u.x) ** 2 + (e.y - u.y) ** 2;
          if (d < bestD) { bestD = d; best = e; }
        }
        u.target = best;
      }
      if (!u.target) continue;
      const dx = u.target.x - u.x;
      const dy = u.target.y - u.y;
      const dist = Math.hypot(dx, dy);
      const attackRange = u.range > 0 ? u.range : 30;
      if (dist > attackRange) {
        const spd = u.spd * 30 * dt;
        u.x += (dx / dist) * spd;
        u.y += (dy / dist) * spd;
        u.state = 'moving';
      } else {
        u.cooldown -= dt;
        if (u.cooldown <= 0) {
          u.cooldown = u.spd > 1.5 ? 0.7 : 1.1;
          u.state = 'attack';
          performAttack(u, u.target);
        }
      }
      u.animTimer += dt;
    }
    for (const p of state.projectiles) {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const mv = 400 * dt;
      if (d <= mv) {
        if (p.target && p.target.hp > 0) {
          const dmg = Math.max(1, p.atk - Math.floor(p.target.def * 0.5));
          p.target.hp -= dmg;
          state.effects.push({ type: 'hit', x: p.target.x, y: p.target.y, life: 0.3, dmg });
        }
        p.dead = true;
      } else {
        p.x += dx / d * mv;
        p.y += dy / d * mv;
      }
    }
    state.projectiles = state.projectiles.filter(p => !p.dead);
    for (const e of state.effects) e.life -= dt;
    state.effects = state.effects.filter(e => e.life > 0);

    const pl = state.player.filter(u => u.hp > 0).length;
    const en = state.enemy.filter(u => u.hp > 0).length;
    if (pl === 0 || en === 0) {
      state.active = false;
      endBattle(pl > 0);
    }
  }

  function performAttack(attacker, target) {
    if (!target || target.hp <= 0) return;
    if (attacker.range > 20) {
      state.projectiles.push({
        x: attacker.x, y: attacker.y,
        tx: target.x, ty: target.y,
        target,
        atk: attacker.atk,
        side: attacker.side,
      });
    } else {
      const dmg = Math.max(1, attacker.atk - Math.floor(target.def * 0.6));
      target.hp -= dmg;
      state.effects.push({ type: 'hit', x: target.x, y: target.y, life: 0.3, dmg });
    }
  }

  function endBattle(playerWon) {
    if (!state) return;
    const playerParty = World.getPlayerParty();
    const playerUnits = state.player.filter(u => !u.isHero);
    if (playerWon) {
      const survivors = {};
      for (const u of playerUnits) {
        if (u.hp > 0) survivors[u.type] = (survivors[u.type] || 0) + 1;
      }
      playerParty.troops = Object.entries(survivors).map(([type, count]) => ({ type, count }));
      playerParty.troops = playerParty.troops.filter(t => t.count > 0);
      const hero = state.player.find(u => u.isHero);
      if (hero) Character.get().hp = Utils.clamp(hero.hp, 1, Character.totalMaxHp());
      const enemyParty = state.context.enemyParty;
      if (enemyParty) {
        const loot = Math.floor(enemyParty.gold * (0.6 + Math.random()*0.4));
        Character.get().gold += loot;
        Game.toast('战斗胜利！+' + loot + '金');
        Character.gainExp(30 + Math.floor(Party.calcPartyStrength(enemyParty) / 10));
        Quest.onEnemyDefeated(enemyParty.type || 'bandit', state.enemy.length);
      }
    } else {
      const survivors = {};
      for (const u of state.player) {
        if (!u.isHero && u.hp > 0) survivors[u.type] = (survivors[u.type] || 0) + 1;
      }
      playerParty.troops = Object.entries(survivors).map(([type, count]) => ({ type, count: Math.max(0, Math.floor(count * 0.5)) }));
      playerParty.troops = playerParty.troops.filter(t => t.count > 0);
      Character.get().hp = Math.max(1, Math.floor(Character.totalMaxHp() * 0.3));
      const lostGold = Math.floor(Character.get().gold * 0.3);
      Character.get().gold -= lostGold;
      Game.toast('战败！损失 ' + lostGold + ' 金');
    }
    const ctx = state.context;
    state = null;
    Game.onBattleEnd(playerWon, ctx);
  }

  return { isActive, get, start, update, endBattle };
})();
