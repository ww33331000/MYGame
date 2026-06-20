export class DataManager {
    constructor() {
        this.locations = { towns: [], castles: [], villages: [] };
        this.troops = {};
        this.items = { weapons: [], armors: [], consumables: [] };
        this.factions = [];
        this.quests = [];
        this.terrain = [];
    }

    async loadAll() {
        this.generateLocations();
        this.generateTroops();
        this.generateItems();
        this.generateFactions();
        this.generateQuests();
        this.generateTerrain();
    }

    generateLocations() {
        const townNames = [
            '瓦兰迪亚', '库吉特', '维迪克', '诺德', '斯瓦迪亚', '萨兰德',
            '罗多克', '库劳', '艾车莫尔', '窝车则', '德赫瑞姆', '格鲁恩沃德',
            '日瓦车则', '杰尔喀拉', '提哈', '阿美拉', '拉那', '亚伦',
            '苏诺', '匹茨奈', '哈尔玛', '达斯塔', '巴克利', '萨哥斯',
            '奥莱', '帕尔迪亚', '乌克豪森', '卡培', '尼美加', '库丹',
            '凯尔本', '哈伦哥', '弗林', '卡尔文', '班达', '查资料',
            '马勒', '波 checkpoint', '哥撒', '兰摹', '切麻'
        ];

        const castleNames = [
            '狮牙堡', '鹰巢堡', '狼峰堡', '熊骨堡', '龙鳞堡', '虎威堡',
            '凤鸣堡', '龟甲堡', '鹿角堡', '豹影堡', '狐隐堡', '蜂刺堡'
        ];

        const villageNames = [
            '东谷村', '西岗村', '南河村', '北山村', '中湖村', '前哨村',
            '后山村', '左岸村', '右岭村', '上坡村', '下田村', '新开村'
        ];

        const mapWidth = 4000;
        const mapHeight = 4000;

        for (let i = 0; i < 40; i++) {
            this.locations.towns.push({
                id: `town_${i.toString().padStart(3, '0')}`,
                name: townNames[i] || `城镇${i + 1}`,
                type: 'town',
                x: Math.random() * mapWidth * 0.8 + mapWidth * 0.1,
                y: Math.random() * mapHeight * 0.8 + mapHeight * 0.1,
                faction: `faction_${(i % 6) + 1}`,
                owner: `faction_${(i % 6) + 1}`,
                troops: Math.floor(Math.random() * 50) + 50,
                market: true,
                tavern: true,
                barracks: true
            });
        }

        for (let i = 0; i < 120; i++) {
            const nearestTown = this.locations.towns[i % 40];
            const offsetX = (Math.random() - 0.5) * 300;
            const offsetY = (Math.random() - 0.5) * 300;

            this.locations.castles.push({
                id: `castle_${i.toString().padStart(3, '0')}`,
                name: `${castleNames[i % 12]}${Math.floor(i / 12) + 1}堡`,
                type: 'castle',
                x: nearestTown.x + offsetX,
                y: nearestTown.y + offsetY,
                faction: nearestTown.faction,
                owner: nearestTown.owner,
                troops: Math.floor(Math.random() * 30) + 20,
                fortification: Math.floor(Math.random() * 5) + 3
            });
        }

        for (let i = 0; i < 300; i++) {
            const nearestTown = this.locations.towns[i % 40];
            const nearestCastle = this.locations.castles[Math.floor(i / 40) * 3 % 120];
            const parentType = Math.random() > 0.3 ? 'town' : 'castle';
            const parent = parentType === 'town' ? nearestTown : nearestCastle;

            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 200;

            this.locations.villages.push({
                id: `village_${i.toString().padStart(3, '0')}`,
                name: `${villageNames[i % 12]}${Math.floor(i / 12) + 1}村`,
                type: 'village',
                x: parent.x + offsetX,
                y: parent.y + offsetY,
                faction: parent.faction,
                owner: parent.owner,
                parentId: parent.id,
                parentType: parentType,
                prosperity: Math.floor(Math.random() * 50) + 20,
                production: ['grain', 'cattle', 'iron', 'timber', 'wool'][i % 5]
            });
        }
    }

    generateTroops() {
        this.troops = {
            militia: { name: '民兵', cost: 10, strength: 5, speed: 25, armor: 2, weapon: 'pitchfork' },
            footman: { name: '步兵', cost: 30, strength: 12, speed: 22, armor: 8, weapon: 'sword' },
            archer: { name: '弓箭手', cost: 40, strength: 10, speed: 20, armor: 4, weapon: 'bow', ranged: true },
            crossbowman: { name: '弩手', cost: 50, strength: 14, speed: 18, armor: 6, weapon: 'crossbow', ranged: true },
            cavalry: { name: '骑士', cost: 80, strength: 20, speed: 40, armor: 15, weapon: 'lance', mounted: true },
            heavyCavalry: { name: '重骑士', cost: 150, strength: 35, speed: 30, armor: 25, weapon: 'greatsword', mounted: true },
            huscarl: { name: '侍卫', cost: 100, strength: 28, speed: 25, armor: 22, weapon: 'danishAxe' },
            sharpshooter: { name: '神射手', cost: 120, strength: 22, speed: 22, armor: 5, weapon: 'longbow', ranged: true },
            sergeant: { name: '军士', cost: 70, strength: 18, speed: 28, armor: 12, weapon: 'swordAndBoard' },
            caravanGuard: { name: '商队护卫', cost: 45, strength: 15, speed: 30, armor: 10, weapon: 'sword' }
        };
    }

    generateItems() {
        const weaponTypes = ['sword', 'axe', 'mace', 'spear', 'polearm', 'bow', 'crossbow'];
        const armorTypes = ['leather', 'mail', 'plate'];
        const qualities = ['common', 'fine', 'masterwork', 'exquisite', 'legendary'];

        for (const type of weaponTypes) {
            for (let i = 0; i < 5; i++) {
                this.items.weapons.push({
                    id: `${type}_${qualities[i]}`,
                    name: this.getWeaponName(type, qualities[i]),
                    type: 'weapon',
                    weaponType: type,
                    quality: qualities[i],
                    damage: (i + 1) * 5 + Math.floor(Math.random() * 5),
                    speed: 10 - i * 0.5 + Math.floor(Math.random() * 3),
                    price: (i + 1) * 50 + Math.floor(Math.random() * 30)
                });
            }
        }

        for (const type of armorTypes) {
            for (let i = 0; i < 5; i++) {
                this.items.armors.push({
                    id: `${type}_${qualities[i]}`,
                    name: this.getArmorName(type, qualities[i]),
                    type: 'armor',
                    armorType: type,
                    quality: qualities[i],
                    defense: (i + 1) * 4 + Math.floor(Math.random() * 4),
                    price: (i + 1) * 40 + Math.floor(Math.random() * 20)
                });
            }
        }

        this.items.consumables = [
            { id: 'health_potion', name: '治疗药水', type: 'consumable', effect: 'heal', value: 50, price: 25 },
            { id: 'stamina_potion', name: '体力药水', type: 'consumable', effect: 'stamina', value: 30, price: 20 },
            { id: 'bandage', name: '绷带', type: 'consumable', effect: 'heal', value: 20, price: 10 }
        ];
    }

    getWeaponName(type, quality) {
        const names = {
            sword: ['短剑', '长剑', '阔剑', '精钢剑', '传说中的圣剑'],
            axe: ['斧头', '战斧', '双手斧', '狂暴战斧', '碎裂者'],
            mace: ['钉锤', '连枷', '晨星', '重型钉锤', '审判之锤'],
            spear: ['短矛', '长矛', '枪', '精锐长枪', '龙枪'],
            polearm: ['戟', '长柄刀', '偃月刀', '泰坦战戟', '死神镰刀'],
            bow: ['短弓', '长弓', '强化弓', '精灵长弓', '神话之弓'],
            crossbow: ['轻弩', '十字弩', '重型弩', '连弩', '雷霆弩']
        };
        const qualityNames = {
            common: '普通的',
            fine: '精良的',
            masterwork: '大师级',
            exquisite: '精美的',
            legendary: '传说'
        };
        return qualityNames[quality] + (names[type] || ['武器'])[0];
    }

    getArmorName(type, quality) {
        const names = {
            leather: ['皮甲', '皮衣', '皮甲', '鳞甲', '龙皮甲'],
            mail: ['锁甲', '锁子甲', '强化锁甲', '钢锁甲', '神圣锁甲'],
            plate: ['胸甲', '板甲', '全身甲', '精钢甲', '神圣板甲']
        };
        const qualityNames = {
            common: '普通的',
            fine: '精良的',
            masterwork: '大师级',
            exquisite: '精美的',
            legendary: '传说'
        };
        return qualityNames[quality] + (names[type] || ['护甲'])[0];
    }

    generateFactions() {
        this.factions = [
            { id: 'faction_1', name: '瓦兰迪亚王国', color: '#4a7c59', enemyOf: 'faction_3' },
            { id: 'faction_2', name: '库吉特汗国', color: '#8b4513', enemyOf: 'faction_4' },
            { id: 'faction_3', name: '诺德王国', color: '#4a4a8a', enemyOf: 'faction_1' },
            { id: 'faction_4', name: '斯瓦迪亚王国', color: '#8b0000', enemyOf: 'faction_2' },
            { id: 'faction_5', name: '萨兰德苏丹国', color: '#c9a227', enemyOf: 'faction_6' },
            { id: 'faction_6', name: '罗多克王国', color: '#2d5a27', enemyOf: 'faction_5' }
        ];
    }

    generateQuests() {
        this.quests = [
            {
                id: 'quest_intro',
                name: '新来的旅人',
                description: '前往最近的城镇，了解这个世界的基本情况。',
                type: 'main',
                objectives: [{ type: 'go_to', targetType: 'town', targetId: null }],
                rewards: { gold: 100, exp: 50 }
            },
            {
                id: 'quest_bandit_1',
                name: '讨伐强盗',
                description: '在附近的道路上，有一群强盗正在骚扰过往的商队。',
                type: 'side',
                difficulty: 1,
                objectives: [{ type: 'kill', targetType: 'bandit', count: 5 }],
                rewards: { gold: 150, exp: 100, reputation: 5 }
            },
            {
                id: 'quest_escort_1',
                name: '商队护送',
                description: '一位商人希望有人护送他的商队安全抵达目的地。',
                type: 'side',
                difficulty: 2,
                objectives: [{ type: 'escort', targetType: 'caravan', destination: null }],
                rewards: { gold: 300, exp: 150, reputation: 10 }
            }
        ];
    }

    generateTerrain() {
        const mapWidth = 4000;
        const mapHeight = 4000;
        const tileSize = 50;

        const cols = Math.ceil(mapWidth / tileSize);
        const rows = Math.ceil(mapHeight / tileSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const noise = this.perlinNoise(x * 0.1, y * 0.1);
                let terrain = 'grass';

                if (noise < -0.3) terrain = 'water';
                else if (noise < -0.1) terrain = 'swamp';
                else if (noise > 0.5) terrain = 'forest';
                else if (noise > 0.7) terrain = 'mountain';

                this.terrain.push({
                    x: x * tileSize,
                    y: y * tileSize,
                    width: tileSize,
                    height: tileSize,
                    type: terrain
                });
            }
        }
    }

    perlinNoise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = (X + this.p(X)) & 255;
        const B = (X + 1 + this.p(X + 1)) & 255;
        return this.lerp(v,
            this.lerp(u, this.g(this.p(A), x, Y), this.g(this.p(B), x + 1, Y)),
            this.lerp(u, this.g(this.p(A + 1), x, Y + 1), this.g(this.p(B + 1), x + 1, Y + 1))
        );
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    g(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? y : x;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    p(x) {
        const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
            8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,
            177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,
            158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,
            63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,
            109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,
            59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,
            101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,
            246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
            107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,
            205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        return permutation[x % 256];
    }

    getLocation(id) {
        const all = [...this.locations.towns, ...this.locations.castles, ...this.locations.villages];
        return all.find(loc => loc.id === id);
    }

    getTroop(type) {
        return this.troops[type];
    }

    getItem(id) {
        const all = [...this.items.weapons, ...this.items.armors, ...this.items.consumables];
        return all.find(item => item.id === id);
    }

    getFaction(id) {
        return this.factions.find(f => f.id === id);
    }
}
