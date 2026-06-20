export class Location {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;

        this.position = { x: data.x, y: data.y };

        this.faction = data.faction;
        this.owner = data.owner;

        this.troops = data.troops || [];
        this.buildings = data.buildings || [];

        this.prosperity = data.prosperity || 50;
        this.population = data.population || 1000;

        this.market = data.market || false;
        this.tavern = data.tavern || false;
        this.barracks = data.barracks || false;

        this.fortification = data.fortification || 0;
    }

    getHitRadius() {
        switch (this.type) {
            case 'town': return 40;
            case 'castle': return 30;
            case 'village': return 20;
            default: return 25;
        }
    }

    canTrade() {
        return this.type === 'town' && this.market;
    }

    canRecruit() {
        return (this.type === 'town' || this.type === 'castle') && this.barracks;
    }

    getDefenseStrength() {
        let defense = this.fortification * 10;
        for (const troop of this.troops) {
            defense += troop.strength * troop.count;
        }
        return defense;
    }

    addTroop(troopData) {
        this.troops.push({ ...troopData });
    }

    removeTroop(troopType) {
        const index = this.troops.findIndex(t => t.type === troopType);
        if (index > -1) {
            return this.troops.splice(index, 1)[0];
        }
        return null;
    }

    changeOwner(newOwner) {
        this.owner = newOwner;
        if (this.faction !== newOwner) {
            this.faction = newOwner;
        }
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            position: this.position,
            faction: this.faction,
            owner: this.owner,
            troops: this.troops,
            buildings: this.buildings,
            prosperity: this.prosperity,
            population: this.population,
            market: this.market,
            tavern: this.tavern,
            barracks: this.barracks,
            fortification: this.fortification
        };
    }
}
