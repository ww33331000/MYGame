export class Equipment {
    constructor(id, name, type, quality) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.quality = quality;

        this.damage = 0;
        this.defense = 0;
        this.speed = 0;
        this.price = 0;

        this.effects = [];
        this.requirements = {};

        this.setQualityBonuses();
    }

    setQualityBonuses() {
        const bonuses = {
            common: 1,
            fine: 1.2,
            masterwork: 1.5,
            exquisite: 1.8,
            legendary: 2.5
        };

        const multiplier = bonuses[this.quality] || 1;

        this.damage = Math.floor(this.damage * multiplier);
        this.defense = Math.floor(this.defense * multiplier);
        this.speed = Math.floor(this.speed * multiplier);
        this.price = Math.floor(this.price * multiplier);
    }

    meetsRequirements(player) {
        for (const attr in this.requirements) {
            if (player.attributes[attr] < this.requirements[attr]) {
                return false;
            }
        }
        return true;
    }

    getQualityColor() {
        const colors = {
            common: '#888888',
            fine: '#4a8c4a',
            masterwork: '#4a4a8c',
            exquisite: '#8a4a8c',
            legendary: '#c9a227'
        };
        return colors[this.quality] || colors.common;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            quality: this.quality,
            damage: this.damage,
            defense: this.defense,
            speed: this.speed,
            price: this.price,
            effects: this.effects,
            requirements: this.requirements
        };
    }
}
