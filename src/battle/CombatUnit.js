export class CombatUnit {
    constructor(side, data, position) {
        this.side = side;
        this.data = data;
        this.position = { ...position };
        this.velocity = { x: 0, y: 0 };

        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;

        this.attackCooldown = 0;
        this.attackSpeed = 1;
        this.damage = 10;
        this.armor = 5;

        this.isDefending = false;
        this.specialCooldown = 0;

        this.target = null;
        this.aiState = 'idle';

        if (data) {
            this.damage = data.strength || 10;
            this.armor = data.armor || 5;
            this.attackSpeed = (data.speed || 20) / 20;
        }
    }

    update(deltaTime, allies, enemies) {
        if (!this.isAlive) return;

        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime / 1000);
        this.specialCooldown = Math.max(0, this.specialCooldown - deltaTime / 1000);

        if (this.isDefending) {
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;
            return;
        }

        this.findTarget(enemies);

        if (this.target) {
            const dx = this.target.position.x - this.position.x;
            const dy = this.target.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const attackRange = 40;

            if (distance > attackRange) {
                const speed = 50 * (deltaTime / 1000);
                this.velocity.x = (dx / distance) * speed;
                this.velocity.y = (dy / distance) * speed;
            } else {
                this.velocity.x *= 0.8;
                this.velocity.y *= 0.8;

                if (this.attackCooldown <= 0) {
                    this.attackTarget();
                }
            }
        } else {
            this.aiState = 'idle';
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    findTarget(enemies) {
        let closest = null;
        let closestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;

            const dx = enemy.position.x - this.position.x;
            const dy = enemy.position.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }

        this.target = closest;
        if (closest) {
            this.aiState = 'fighting';
        }
    }

    attackTarget() {
        if (!this.target || !this.target.isAlive) return;

        let damage = this.damage;
        if (this.isDefending) {
            damage *= 0.5;
        }

        const actualDamage = this.target.takeDamage(damage);
        this.attackCooldown = 1 / this.attackSpeed;

        if (!this.target.isAlive) {
            this.target = null;
        }
    }

    takeDamage(amount) {
        let damage = Math.max(1, amount - this.armor);
        if (this.isDefending) {
            damage *= 0.3;
        }

        this.health -= damage;

        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }

        return Math.floor(damage);
    }

    attack() {
        if (this.attackCooldown <= 0 && this.target) {
            this.attackTarget();
        }
    }

    setDefending(defending) {
        this.isDefending = defending;
    }

    useSpecial() {
        if (this.specialCooldown <= 0) {
            this.specialCooldown = 10;
            this.health = Math.min(this.maxHealth, this.health + 30);
        }
    }

    render(ctx, color) {
        if (!this.isAlive) return;

        const x = this.position.x;
        const y = this.position.y;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.isDefending) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.stroke();
        }

        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(x - healthBarWidth / 2, y - 25, healthBarWidth, healthBarHeight);

        ctx.fillStyle = healthPercent > 0.5 ? '#2d5a27' : healthPercent > 0.25 ? '#c9a227' : '#8b0000';
        ctx.fillRect(x - healthBarWidth / 2, y - 25, healthBarWidth * healthPercent, healthBarHeight);
    }
}
