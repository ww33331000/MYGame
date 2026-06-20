// ===== 经济系统：贸易、价格、商店 =====
const Economy = (() => {

  // 商店出售：武器、护甲、材料
  function getShopInventory(settlement) {
    // 基于城镇繁荣度和势力文化调整商品列表
    const prosperityFactor = settlement.prosperity || 0.5;
    const items = [];
    // 基础武器
    const weapons = GameData.WEAPONS.filter(w => w.req <= 10);
    for (const w of weapons) {
      if (Math.random() < 0.3 + prosperityFactor * 0.3) {
        items.push({ ...w, qty: 1 + Math.floor(Math.random()*3), kind: 'weapon' });
      }
    }
    // 护甲
    for (const a of GameData.ARMORS) {
      if (a.req <= 8 && Math.random() < 0.25 + prosperityFactor * 0.25) {
        items.push({ ...a, qty: 1 + Math.floor(Math.random()*2), kind: 'armor' });
      }
    }
    for (const h of GameData.HEADGEARS) {
      if (Math.random() < 0.3) items.push({ ...h, qty: 1 + Math.floor(Math.random()*2), kind: 'armor' });
    }
    for (const s of GameData.SHIELDS_ALL) {
      if (Math.random() < 0.3) items.push({ ...s, qty: 1, kind: 'armor' });
    }
    // 材料
    for (const m of GameData.CRAFT_MATS) {
      if (Math.random() < 0.5) {
        items.push({ ...m, qty: 5 + Math.floor(Math.random()*20), kind: 'mats' });
      }
    }
    // 商品（用于贸易）
    for (const g of GameData.GOODS) {
      if (Math.random() < 0.8) {
        const price = Math.floor(g.basePrice * (0.7 + Math.random() * 0.6));
        items.push({ ...g, price, qty: 10 + Math.floor(Math.random()*100), kind: 'goods' });
      }
    }
    return items;
  }

  // 商品价格（城镇特定）
  function getGoodPrice(settlement, itemId) {
    const item = GameData.getItem(itemId);
    if (!item) return 0;
    // 城镇有特定supplier价格时使用，否则用basePrice浮动
    if (settlement.supply && settlement.supply[itemId]) return settlement.supply[itemId];
    return Math.floor(item.price || item.basePrice);
  }

  // 商店交易（购买）
  function buy(itemId, qty, price) {
    const p = Character.get();
    const total = price * qty;
    if (p.gold < total) {
      Game.toast('金币不足');
      return false;
    }
    p.gold -= total;
    Inventory.add(itemId, qty);
    Game.toast('购买成功，花费' + total + '金');
    return true;
  }

  // 商店交易（出售）
  function sell(itemId, qty, price) {
    if (!Inventory.hasItem(itemId, qty)) {
      Game.toast('物品不足');
      return false;
    }
    Inventory.remove(itemId, qty);
    const total = price * qty;
    Character.get().gold += total;
    Game.toast('出售成功，获得' + total + '金');
    return true;
  }

  return { getShopInventory, getGoodPrice, buy, sell };
})();

// ===== 地图AI：领主、商队、劫匪行为 =====
const MapAI = (() => {

  function update(dt) {
    const w = World.get();
    if (!w) return;
    const parties = w.parties;
    const pP = w.parties.find(p => p.type === 'player');

    for (const p of parties) {
      if (p.type === 'player') continue;
      p.pathTimer = (p.pathTimer || 0) + dt;
      if (p.type === 'bandit' || p.type === 'bandit_lord') {
        // 劫匪：在地图游荡，见商队或玩家就追
        let target = null, bestD = Infinity;
        for (const q of parties) {
          if (q.id === p.id) continue;
          if (q.type === 'bandit' || q.type === 'bandit_lord') continue;
          // 偏好弱的商队，或玩家队伍（若玩家队伍较小）
          const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (d < bestD && d < 300 * 300) { bestD = d; target = q; }
        }
        if (target) {
          World.movePartyToward(p, target.x, target.y, dt);
          if (Utils.dist(p, target) < 15 && target.type === 'caravan') {
            // 劫匪 vs 商队：简化，直接比较实力
            const pStr = Party.calcPartyStrength(p);
            const qStr = Party.calcPartyStrength(target);
            if (pStr > qStr) {
              Party.applyCasualties(target, 0.5);
              p.gold += Math.floor(target.gold * 0.5);
              target.gold = Math.floor(target.gold * 0.5);
            } else {
              Party.applyCasualties(p, 0.4);
            }
          }
        } else {
          // 随机游荡
          if (!p.home || p.pathTimer > 5) {
            p.home = { x: p.x + (Math.random() - 0.5) * 400, y: p.y + (Math.random() - 0.5) * 400 };
            p.home.x = Utils.clamp(p.home.x, 50, w.mapSize.w - 50);
            p.home.y = Utils.clamp(p.home.y, 50, w.mapSize.h - 50);
            p.pathTimer = 0;
          }
          World.movePartyToward(p, p.home.x, p.home.y, dt);
        }
        // 接近玩家队伍：触发战斗
        if (pP && Utils.dist(p, pP) < 20 && Party.calcPartyStrength(p) > 50) {
          if (!pP.battleTriggered) {
            pP.battleTriggered = true;
            pP.battleWith = p;
          }
        }
      } else if (p.type === 'caravan') {
        // 商队：到目标城镇贸易，然后返回
        if (!p.targetId || !p.targetPos) {
          // 随机选一个目标城镇（不同势力的）
          const towns = w.settlements.filter(s => s.type === 'town' && s.id !== p.homeId);
          const t = towns[Math.floor(Math.random() * towns.length)];
          if (t) { p.targetId = t.id; p.targetPos = { x: t.x, y: t.y }; }
        }
        if (p.targetPos) {
          World.movePartyToward(p, p.targetPos.x, p.targetPos.y, dt);
          const target = w.settlements.find(s => s.id === p.targetId);
          if (target && Utils.dist(p, target) < 15) {
            // 在目标城镇交易，然后回家
            p.targetId = p.homeId;
            if (p.homeId) {
              const home = w.settlements.find(s => s.id === p.homeId);
              if (home) p.targetPos = { x: home.x, y: home.y };
            }
            if (p.targetId === p.homeId) {
              // 到家后重置目标
              p.gold += 200 + Math.floor(Math.random() * 500);
            }
          }
        }
      } else if (p.type === 'lord_party') {
        // 领主：周期性出征攻击敌方城镇，或在己方领地巡逻
        const pInfo = w.factions[p.faction];
        p.goalTimer = (p.goalTimer || 0) + dt;
        if (!p.goal || p.goalTimer > 20) {
          // 选择目标
          if (pInfo && pInfo.atWar && pInfo.atWar.length > 0) {
            const enemyFid = pInfo.atWar[Math.floor(Math.random() * pInfo.atWar.length)];
            const enemySettles = w.settlements.filter(s => s.faction === enemyFid && s.type !== 'village');
            if (enemySettles.length > 0) {
              const target = enemySettles[Math.floor(Math.random() * enemySettles.length)];
              p.goal = 'attack';
              p.goalTarget = { x: target.x, y: target.y, id: target.id };
            }
          } else {
            // 和平时期巡逻
            const friendlyTowns = w.settlements.filter(s => s.faction === p.faction && s.type === 'town');
            if (friendlyTowns.length > 0) {
              const t = friendlyTowns[Math.floor(Math.random() * friendlyTowns.length)];
              p.goal = 'patrol';
              p.goalTarget = { x: t.x, y: t.y, id: t.id };
            }
          }
          p.goalTimer = 0;
        }
        if (p.goalTarget) {
          World.movePartyToward(p, p.goalTarget.x, p.goalTarget.y, dt);
          // 到达目标时处理
          if (Utils.dist(p, p.goalTarget) < 20) {
            if (p.goal === 'attack') {
              const target = w.settlements.find(s => s.id === p.goalTarget.id);
              if (target && target.faction !== p.faction) {
                // 攻城：比较守军和领主队伍的实力
                const gStrength = Party.calcPartyStrength({ troops: target.garrison || [] });
                const pStrength = Party.calcPartyStrength(p);
                if (pStrength > gStrength * 1.5) {
                  World.captureSettlement(target.id, p.faction);
                  target.garrison = p.troops.map(t => ({ type: t.type, count: Math.floor(t.count * 0.5) }));
                  Game.toast('战报：' + target.name + ' 被 ' + (GameData.FACTIONS.find(f=>f.id===p.faction)?.name || p.faction) + ' 占领！');
                  p.goal = 'return';
                } else {
                  Party.applyCasualties(p, 0.3);
                  p.goal = 'return';
                }
              } else {
                p.goal = 'return';
              }
              p.goalTimer = 0;
              p.goalTarget = null;
            } else {
              p.goal = null;
              p.goalTarget = null;
            }
          }
        }
      }
    }

    // 重置玩家战斗标志
    if (pP && pP.battleTriggered && pP.battleWith) {
      if (Utils.dist(pP, pP.battleWith) > 40) {
        pP.battleTriggered = false;
        pP.battleWith = null;
      }
    }
  }

  return { update };
})();
