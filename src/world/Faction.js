export class Faction {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;

        this.king = data.king || '未知';
        this.capital = data.capital || null;

        this.relations = {};
        this.wars = [];
        this.alliances = [];

        this.territories = {
            towns: [],
            castles: [],
            villages: []
        };

        this.treasury = data.treasury || 10000;
        this.reputation = 50;
    }

    setRelation(factionId, value) {
        this.relations[factionId] = Math.max(-100, Math.min(100, value));
    }

    getRelation(factionId) {
        return this.relations[factionId] || 0;
    }

    isAtWarWith(factionId) {
        return this.getRelation(factionId) <= -50;
    }

    isAlliedWith(factionId) {
        return this.getRelation(factionId) >= 50;
    }

    declareWar(factionId) {
        this.setRelation(factionId, -100);
        if (!this.wars.includes(factionId)) {
            this.wars.push(factionId);
        }
        const allianceIndex = this.alliances.indexOf(factionId);
        if (allianceIndex > -1) {
            this.alliances.splice(allianceIndex, 1);
        }
    }

    makePeace(factionId) {
        this.setRelation(factionId, 0);
        const warIndex = this.wars.indexOf(factionId);
        if (warIndex > -1) {
            this.wars.splice(warIndex, 1);
        }
    }

    formAlliance(factionId) {
        this.setRelation(factionId, 60);
        if (!this.alliances.includes(factionId)) {
            this.alliances.push(factionId);
        }
    }

    addTerritory(location) {
        switch (location.type) {
            case 'town':
                this.territories.towns.push(location.id);
                break;
            case 'castle':
                this.territories.castles.push(location.id);
                break;
            case 'village':
                this.territories.villages.push(location.id);
                break;
        }
    }

    removeTerritory(locationId) {
        const townIndex = this.territories.towns.indexOf(locationId);
        if (townIndex > -1) this.territories.towns.splice(townIndex, 1);

        const castleIndex = this.territories.castles.indexOf(locationId);
        if (castleIndex > -1) this.territories.castles.splice(castleIndex, 1);

        const villageIndex = this.territories.villages.indexOf(locationId);
        if (villageIndex > -1) this.territories.villages.splice(villageIndex, 1);
    }

    getTotalTerritories() {
        return this.territories.towns.length +
            this.territories.castles.length +
            this.territories.villages.length;
    }

    collectTaxes() {
        const income = this.territories.towns.length * 500 +
            this.territories.castles.length * 200 +
            this.territories.villages.length * 50;

        this.treasury += income;
        return income;
    }

    getMilitaryStrength() {
        return this.territories.castles.length * 100 +
            this.territories.villages.length * 20;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            king: this.king,
            capital: this.capital,
            relations: this.relations,
            wars: this.wars,
            alliances: this.alliances,
            territories: this.territories,
            treasury: this.treasury,
            reputation: this.reputation
        };
    }
}
