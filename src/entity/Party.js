import { Troop } from './Troop.js';

export class Party {
    constructor(name, leader) {
        this.name = name;
        this.leader = leader;
        this.troops = [];

        this.position = { x: 0, y: 0 };
        this.targetPosition = null;
        this.speed = 30;
        this.isMoving = false;
        this.reachedDestination = false;

        this.maxSize = 20;
        this.morale = 80;

        this.carriedGold = 0;
        this.inventory = [];
    }

    addTroop(type, count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.troops.length >= this.maxSize) return false;

            const existing = this.troops.find(t => t.type === type);
            if (existing) {
                existing.count++;
            } else {
                this.troops.push(new Troop(type, 1));
            }
        }
        return true;
    }

    removeTroop(type, count = 1) {
        const troop = this.troops.find(t => t.type === type);
        if (!troop) return false;

        troop.count -= count;
        if (troop.count <= 0) {
            const index = this.troops.indexOf(troop);
            if (index > -1) this.troops.splice(index, 1);
        }
        return true;
    }

    setTarget(x, y) {
        this.targetPosition = { x, y };
        this.isMoving = true;
        this.reachedDestination = false;
    }

    update(deltaTime) {
        if (!this.isMoving || !this.targetPosition) return;

        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            this.position.x = this.targetPosition.x;
            this.position.y = this.targetPosition.y;
            this.isMoving = false;
            this.reachedDestination = true;
            return;
        }

        const moveSpeed = this.speed * (deltaTime / 1000);
        const ratio = moveSpeed / distance;

        this.position.x += dx * ratio;
        this.position.y += dy * ratio;
        this.reachedDestination = false;
    }

    getTotalStrength() {
        let strength = this.leader.getTotalStrength();
        for (const troop of this.troops) {
            strength += troop.getStrength() * troop.count;
        }
        return strength;
    }

    getTotalCount() {
        return 1 + this.troops.reduce((sum, t) => sum + t.count, 0);
    }

    canRecruit(troopType, cost, dataManager) {
        if (this.getTotalCount() >= this.maxSize) return false;
        if (this.leader.gold < cost) return false;
        return true;
    }

    recruit(troopType, dataManager) {
        const troopData = dataManager.getTroop(troopType);
        if (!troopData) return false;

        if (!this.canRecruit(troopType, troopData.cost, dataManager)) return false;

        this.leader.gold -= troopData.cost;
        this.addTroop(troopType, 1);
        return true;
    }

    getSpeed() {
        let baseSpeed = this.leader.getSpeed();

        if (this.leader.equipment.mount) {
            baseSpeed *= 1.5;
        }

        const heavyRatio = this.troops.reduce((sum, t) => {
            const troopData = t.getData();
            return sum + (troopData.armor > 10 ? 0.1 : 0) * t.count;
        }, 0);

        return baseSpeed * (1 - Math.min(0.5, heavyRatio));
    }

    loadFromData(data) {
        this.name = data.name || this.name;
        this.position = data.position || { x: 0, y: 0 };
        this.troops = (data.troops || []).map(t => Troop.fromData(t));
        this.maxSize = data.maxSize || 20;
        this.morale = data.morale || 80;
        this.carriedGold = data.carriedGold || 0;
    }

    toJSON() {
        return {
            name: this.name,
            position: this.position,
            troops: this.troops.map(t => t.toJSON()),
            maxSize: this.maxSize,
            morale: this.morale,
            carriedGold: this.carriedGold
        };
    }
}
