import { Equipment } from './Equipment.js';

export class Armor extends Equipment {
    constructor(id, name, armorType, quality) {
        super(id, name, 'armor', quality);

        this.armorType = armorType;

        this.setArmorStats();
    }

    setArmorStats() {
        const baseStats = {
            leather: { defense: 8, speed: 10, price: 50 },
            mail: { defense: 15, speed: 6, price: 120 },
            plate: { defense: 25, speed: 2, price: 250 }
        };

        const base = baseStats[this.armorType] || baseStats.leather;

        this.defense = base.defense;
        this.speed = base.speed;
        this.price = base.price;

        this.requirements = {
            strength: this.armorType === 'plate' ? 12 : this.armorType === 'mail' ? 8 : 4
        };
    }

    getSpeedPenalty() {
        return -this.speed * 0.5;
    }

    getDamageReduction() {
        return Math.floor(this.defense * 0.1);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            armorType: this.armorType
        };
    }
}
