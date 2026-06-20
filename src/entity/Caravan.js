export class Caravan {
    constructor(name, owner, startPosition) {
        this.name = name;
        this.owner = owner;
        this.position = { ...startPosition };
        this.targetPosition = null;

        this.goods = [];
        this.gold = 200;
        this.troops = [];

        this.speed = 25;
        this.isMoving = false;

        this.tradeSkill = 0;
    }

    addGoods(type, quantity, price) {
        this.goods.push({ type, quantity, price });
    }

    removeGoods(type, quantity) {
        const index = this.goods.findIndex(g => g.type === type);
        if (index > -1) {
            this.goods[index].quantity -= quantity;
            if (this.goods[index].quantity <= 0) {
                this.goods.splice(index, 1);
            }
        }
    }

    calculateProfit(buyPrice, sellPrice, quantity) {
        const skillBonus = 1 + (this.tradeSkill * 0.05);
        return Math.floor((sellPrice - buyPrice) * quantity * skillBonus);
    }

    setTarget(x, y) {
        this.targetPosition = { x, y };
        this.isMoving = true;
    }

    update(deltaTime) {
        if (!this.isMoving || !this.targetPosition) return;

        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            this.position = { ...this.targetPosition };
            this.isMoving = false;
            return;
        }

        const moveSpeed = this.speed * (deltaTime / 1000);
        const ratio = moveSpeed / distance;

        this.position.x += dx * ratio;
        this.position.y += dy * ratio;
    }

    getTotalValue() {
        return this.gold + this.goods.reduce((sum, g) => sum + g.price * g.quantity, 0);
    }

    addTroop(type, count = 1) {
        for (let i = 0; i < count; i++) {
            this.troops.push({ type, level: 1 });
        }
    }

    getDefenseStrength() {
        return this.troops.reduce((sum, t) => {
            const baseStrength = t.type === 'caravanGuard' ? 15 : 10;
            return sum + baseStrength * (1 + t.level * 0.2);
        }, 0);
    }

    toJSON() {
        return {
            name: this.name,
            owner: this.owner,
            position: this.position,
            goods: this.goods,
            gold: this.gold,
            troops: this.troops,
            tradeSkill: this.tradeSkill
        };
    }
}
