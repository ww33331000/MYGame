export class Crafting {
    constructor() {
        this.craftingLevel = 1;
        this.craftingExp = 0;
        this.expToNextLevel = 100;

        this.recipes = this.loadRecipes();
        this.materials = {
            ironOre: 0,
            coal: 0,
            leather: 0,
            wood: 0,
            cloth: 0,
            steel: 0
        };
    }

    loadRecipes() {
        return {
            sword: {
                name: '铁剑',
                materials: { ironOre: 5, coal: 3, leather: 2 },
                result: { type: 'weapon', weaponType: 'sword', quality: 'common' },
                exp: 20
            },
            axe: {
                name: '战斧',
                materials: { ironOre: 6, coal: 4, leather: 1 },
                result: { type: 'weapon', weaponType: 'axe', quality: 'common' },
                exp: 25
            },
            leatherArmor: {
                name: '皮甲',
                materials: { leather: 8, cloth: 3 },
                result: { type: 'armor', armorType: 'leather', quality: 'common' },
                exp: 15
            },
            mailArmor: {
                name: '锁甲',
                materials: { ironOre: 10, coal: 5, leather: 4 },
                result: { type: 'armor', armorType: 'mail', quality: 'common' },
                exp: 35
            },
            plateArmor: {
                name: '板甲',
                materials: { steel: 15, leather: 5, cloth: 3 },
                result: { type: 'armor', armorType: 'plate', quality: 'common' },
                exp: 50
            },
            spear: {
                name: '长矛',
                materials: { ironOre: 3, wood: 6 },
                result: { type: 'weapon', weaponType: 'spear', quality: 'common' },
                exp: 15
            },
            bow: {
                name: '长弓',
                materials: { wood: 8, leather: 2 },
                result: { type: 'weapon', weaponType: 'bow', quality: 'common' },
                exp: 20
            }
        };
    }

    addMaterial(type, amount) {
        if (this.materials[type] !== undefined) {
            this.materials[type] += amount;
            return true;
        }
        return false;
    }

    removeMaterial(type, amount) {
        if (this.materials[type] !== undefined && this.materials[type] >= amount) {
            this.materials[type] -= amount;
            return true;
        }
        return false;
    }

    canCraft(recipeId) {
        const recipe = this.recipes[recipeId];
        if (!recipe) return false;

        for (const material in recipe.materials) {
            if (this.materials[material] < recipe.materials[material]) {
                return false;
            }
        }

        return true;
    }

    craft(recipeId) {
        if (!this.canCraft(recipeId)) {
            return null;
        }

        const recipe = this.recipes[recipeId];

        for (const material in recipe.materials) {
            this.removeMaterial(material, recipe.materials[material]);
        }

        this.craftingExp += recipe.exp;
        this.checkLevelUp();

        return {
            ...recipe.result,
            quality: this.getCraftedQuality()
        };
    }

    getCraftedQuality() {
        const roll = Math.random() * 100;
        const levelBonus = this.craftingLevel * 2;

        if (roll < 5 - levelBonus) return 'masterwork';
        if (roll < 15 - levelBonus) return 'fine';
        return 'common';
    }

    checkLevelUp() {
        while (this.craftingExp >= this.expToNextLevel) {
            this.craftingExp -= this.expToNextLevel;
            this.craftingLevel++;
            this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        }
    }

    getAvailableRecipes() {
        const available = [];
        for (const id in this.recipes) {
            if (this.canCraft(id)) {
                available.push({
                    id,
                    ...this.recipes[id]
                });
            }
        }
        return available;
    }

    getRecipeRequirements(recipeId) {
        const recipe = this.recipes[recipeId];
        if (!recipe) return {};

        const requirements = {};
        for (const material in recipe.materials) {
            const have = this.materials[material] || 0;
            const need = recipe.materials[material];
            requirements[material] = {
                have,
                need,
                enough: have >= need
            };
        }
        return requirements;
    }

    smelt(oreType, amount = 1) {
        if (oreType === 'ironOre' && this.materials.ironOre >= amount) {
            this.materials.ironOre -= amount;
            this.materials.steel += Math.floor(amount * 0.8);
            return true;
        }
        return false;
    }

    refineCoal(amount = 1) {
        if (this.materials.coal >= amount) {
            this.materials.coal -= amount;
            return true;
        }
        return false;
    }

    tanLeather(amount = 1) {
        if (this.materials.leather >= amount) {
            this.materials.leather -= amount;
            this.materials.leather += Math.floor(amount * 0.9);
            return true;
        }
        return false;
    }

    toJSON() {
        return {
            craftingLevel: this.craftingLevel,
            craftingExp: this.craftingExp,
            expToNextLevel: this.expToNextLevel,
            materials: this.materials
        };
    }

    loadFromData(data) {
        this.craftingLevel = data.craftingLevel || 1;
        this.craftingExp = data.craftingExp || 0;
        this.expToNextLevel = data.expToNextLevel || 100;
        this.materials = data.materials || this.materials;
    }
}
