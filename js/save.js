// ===== 存档系统 =====
const Save = (() => {

  const KEY = 'pixel_overlord_save';

  function save() {
    try {
      const data = {
        version: 1,
        day: World.get().day,
        character: Character.get(),
        inventory: Inventory.getAll(),
        world: {
          settlements: World.get().settlements.map(s => ({
            id: s.id, type: s.type, name: s.name, x: s.x, y: s.y,
            faction: s.faction, prosperity: s.prosperity,
            garrison: s.garrison, supply: s.supply, parentId: s.parentId, children: s.children
          })),
          parties: World.get().parties,
          mapSize: World.get().mapSize,
          factions: World.get().factions,
        },
        playerParty: World.getPlayerParty(),
        quests: Quest.getAll(),
        playerFaction: Faction.getPlayerFaction(),
        time: Date.now(),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      UI.toast('已保存');
      return true;
    } catch (e) {
      console.error('save error', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      // 重建世界
      const w = World.generate(Date.now());
      // 覆盖
      Object.assign(World.get(), {
        day: data.day,
        settlements: data.world.settlements,
        parties: data.world.parties,
        mapSize: data.world.mapSize,
        factions: data.world.factions,
      });
      // 恢复玩家party
      const pp = World.getPlayerParty();
      if (pp && data.playerParty) Object.assign(pp, data.playerParty);
      // 恢复角色
      Character.set(data.character);
      Inventory.setAll(data.inventory || []);
      Quest.setAll(data.quests || []);
      Faction.setPlayerFaction(data.playerFaction);
      UI.toast('读档成功');
      return true;
    } catch (e) {
      console.error('load error', e);
      return false;
    }
  }

  function hasSave() { return !!localStorage.getItem(KEY); }

  return { save, load, hasSave };
})();
