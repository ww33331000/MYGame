// ============ 战斗系统（围攻战） ============
const CombatSystem = {
  // 开始围攻城镇/城堡
  startSiege(settlement, player) {
    const defenders = this.generateDefenders(settlement);
    const power = settlement.defense + defenders.length * 30;
    const playerPower = player.party.power;
    Game.ui.showSiegePanel(settlement, defenders, {
      settlement: settlement,
      onConfirm: () => {
        Game.ui.openBattle({
          enemies: defenders,
          enemyName: settlement.name + '守军',
          onVictory: () => {
            // 占领
            settlement.changeOwner(player.factionId);
            const gold = Math.floor(settlement.prosperity * 10);
            player.earnGold(gold);
            toast('占领 ' + settlement.name + '！获得 ' + gold + '金币', '#78d878');
            player.gainExp(50 + defenders.length * 10);
            player.reputation += 10;
            // 检查胜利条件
            const totalTowns = Game.world.settlements.filter(s => s.type === 'town' && s.factionId === player.factionId).length;
            if (totalTowns >= 25 && !player.isKing) {
              player.isKing = true;
              toast('你已成为国王！', '#f4d35e');
            }
            if (totalTowns >= 35) {
              Game.victory();
            }
          }
        });
      }
    });
  },

  generateDefenders(settlement) {
    const defenders = [];
    const count = settlement.type === 'castle' ? Utils.randInt(8, 15) : Utils.randInt(5, 10);
    const level = 2 + Math.floor(settlement.defense / 20);
    for (let i = 0; i < count; i++) {
      let type;
      const r = Math.random();
      if (r < 0.3) type = 'swordsman';
      else if (r < 0.5) type = 'archer';
      else if (r < 0.7) type = 'spearman';
      else if (r < 0.9) type = 'militia';
      else type = 'heavy_spearman';
      const u = new Unit(type, settlement.factionId);
      u.level = level;
      defenders.push(u);
    }
    return defenders;
  }
};
