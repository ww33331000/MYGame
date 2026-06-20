import { Equipment } from './Equipment.js';

export class Weapon extends Equipment {
    constructor(id, name, weaponType, quality) {
        super(id, name, 'weapon', quality);

        this.weaponType = weaponType;

        this.setWeaponStats();
    }

    setWeaponStats() {
        const baseStats = {
            sword: { damage: 12, speed: 10 },
            axe: { damage: 15, speed: 8 },
            mace: { damage: 14, speed: 7 },
            spear: { damage: 10, speed: 12 },
            polearm: { damage: 18, speed: 5 },
            bow: { damage: 8, speed: 15, ranged: true },
            crossbow: { damage: 14, speed: 6, ranged: true }
        };

        const base = baseStats[this.weaponType] || baseStats.sword;

        this.damage = base.damage;
        this.speed = base.speed;
        this.ranged = base.ranged || false;

        this.price = this.damage * 5 + this.speed * 3;
    }

    getDamageRange() {
        return {
            min: Math.floor(this.damage * 0.8),
            max: Math.floor(this.damage * 1.2)
        };
    }

    calculateHitChance(attackerSkill, defenderAgility) {
        const baseChance = 60;
        const skillBonus = attackerSkill * 3;
        const defensePenalty = defenderAgility * 0.5;

        return Math.min(95, Math.max(5, baseChance + skillBonus - defensePenalty));
    }

    toJSON() {
        return {
            ...super.toJSON(),
            weaponType: this.weaponType,
            ranged: this.ranged
        };
    }
}
