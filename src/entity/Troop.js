export class Troop {
    constructor(type, count = 1) {
        this.type = type;
        this.count = count;
        this.data = null;
    }

    setData(data) {
        this.data = data;
    }

    getData() {
        return this.data || { name: this.type, strength: 5, armor: 5 };
    }

    getStrength() {
        return this.getData().strength || 5;
    }

    takeDamage(amount) {
        const damage = Math.max(1, amount - (this.getData().armor || 0));
        const casualties = Math.ceil(damage / 10);
        this.count = Math.max(0, this.count - casualties);
        return casualties;
    }

    static fromData(data) {
        const troop = new Troop(data.type, data.count);
        return troop;
    }

    toJSON() {
        return {
            type: this.type,
            count: this.count
        };
    }
}
