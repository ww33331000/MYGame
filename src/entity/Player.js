export class Player {
    constructor(name, gender, background) {
        this.name = name;
        this.gender = gender;
        this.background = background;

        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;

        this.attributes = {
            strength: 5,
            agility: 5,
            intelligence: 5,
            charisma: 5
        };

        this.skills = {
            twoHanded: 1,
            oneHanded: 1,
            polearm: 1,
            archery: 1,
            crossbow: 1,
            throwing: 1,
            riding: 1,
            scouting: 1,
            tracking: 1,
            tactics: 1,
            leadership: 1,
            trade: 1,
            persuasion: 1,
            engineer: 1
        };

        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            arms: null,
            weapon: null,
            shield: null,
            mount: null
        };

        this.gold = 500;
        this.inventory = [];

        this.applyBackgroundBonuses();
    }

    applyBackgroundBonuses() {
        const bonuses = {
            soldier: { strength: 2, agility: 1, intelligence: 0, charisma: 1 },
            merchant: { strength: 0, agility: 1, intelligence: 2, charisma: 1 },
            noble: { strength: 1, agility: 0, intelligence: 1, charisma: 2 },
            peasant: { strength: 1, agility: 2, intelligence: 1, charisma: 0 }
        };

        const bonus = bonuses[this.background] || bonuses.soldier;

        this.attributes.strength += bonus.strength;
        this.attributes.agility += bonus.agi;
        this.attributes.intelligence += bonus.int;
        this.attributes.charisma += bonus.cha;
    }

    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level++;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);

        this.attributes.strength += 1;
        this.attributes.agility += 1;
        this.attributes.intelligence += 1;
        this.attributes.charisma += 1;
    }

    addSkillExp(skill, amount) {
        if (this.skills[skill] !== undefined) {
            this.skills[skill] += amount;
            if (this.skills[skill] > 10) this.skills[skill] = 10;
        }
    }

    equip(item, slot) {
        const oldItem = this.equipment[slot];
        if (oldItem) {
            this.inventory.push(oldItem);
        }
        this.equipment[slot] = item;
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }

    unequip(slot) {
        const item = this.equipment[slot];
        if (item) {
            this.inventory.push(item);
            this.equipment[slot] = null;
        }
    }

    getTotalStrength() {
        let strength = this.attributes.strength * 2;
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.damage) {
                strength += item.damage;
            }
        }
        return strength;
    }

    getTotalDefense() {
        let defense = this.attributes.agility;
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.defense) {
                defense += item.defense;
            }
        }
        return defense;
    }

    getSpeed() {
        return 30 + this.attributes.agility * 0.5;
    }

    toJSON() {
        return {
            name: this.name,
            gender: this.gender,
            background: this.background,
            level: this.level,
            exp: this.exp,
            expToNextLevel: this.expToNextLevel,
            attributes: this.attributes,
            skills: this.skills,
            equipment: this.equipment,
            gold: this.gold,
            inventory: this.inventory
        };
    }
}
