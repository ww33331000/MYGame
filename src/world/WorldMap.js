import { Camera } from '../core/Camera.js';

export class WorldMap {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.locations = [];
        this.factions = [];
        this.terrain = [];
        this.paths = [];

        this.camera = null;
        this.mapCanvas = null;
        this.mapCtx = null;

        this.startPosition = { x: 2000, y: 2000 };
        this.mapWidth = 4000;
        this.mapHeight = 4000;
    }

    generate() {
        this.locations = [
            ...this.dataManager.locations.towns,
            ...this.dataManager.locations.castles,
            ...this.dataManager.locations.villages
        ];

        this.factions = [...this.dataManager.factions];
        this.terrain = [...this.dataManager.terrain];

        this.generatePaths();
    }

    loadFromData(data) {
        this.locations = data.locations || [];
        this.factions = data.factions || [];
    }

    generatePaths() {
        const towns = this.locations.filter(l => l.type === 'town');
        for (let i = 0; i < towns.length; i++) {
            for (let j = i + 1; j < towns.length; j++) {
                const dist = this.getDistance(towns[i], towns[j]);
                if (dist < 800) {
                    this.paths.push({
                        from: towns[i].id,
                        to: towns[j].id,
                        distance: dist
                    });
                }
            }
        }
    }

    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    initRenderer() {
        this.mapCanvas = document.getElementById('map-canvas');
        if (this.mapCanvas) {
            this.mapCtx = this.mapCanvas.getContext('2d');
            this.mapCanvas.width = window.innerWidth;
            this.mapCanvas.height = window.innerHeight;

            this.camera = new Camera(this.mapCanvas.width, this.mapCanvas.height);
            this.camera.x = this.startPosition.x - this.mapCanvas.width / 2;
            this.camera.y = this.startPosition.y - this.mapCanvas.height / 2;
        }
    }

    update(deltaTime) {
        if (this.camera && this.camera.target) {
            this.camera.update();
        }
    }

    render(ctx, canvas) {
        if (!ctx || !canvas) return;

        if (!this.mapCanvas) {
            this.initRenderer();
        }

        ctx = this.mapCtx || ctx;
        canvas = this.mapCanvas || canvas;

        if (!ctx) return;

        ctx.fillStyle = '#2d4a2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.renderTerrain(ctx, canvas);
        this.renderPaths(ctx, canvas);
        this.renderLocations(ctx, canvas);
    }

    renderTerrain(ctx, canvas) {
        if (!this.terrain || this.terrain.length === 0) return;

        const colors = {
            grass: '#3d5a3d',
            water: '#2a4a6a',
            swamp: '#4a5a3a',
            forest: '#2a4a2a',
            mountain: '#6a5a5a',
            desert: '#c9a227'
        };

        for (const tile of this.terrain) {
            if (!this.camera.isVisible(tile.x, tile.y, tile.width, tile.height)) continue;

            const screenPos = this.camera.worldToScreen(tile.x, tile.y);
            const size = tile.width * this.camera.zoom;

            ctx.fillStyle = colors[tile.type] || colors.grass;
            ctx.fillRect(screenPos.x, screenPos.y, size, size);
        }
    }

    renderPaths(ctx, canvas) {
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;

        for (const path of this.paths) {
            const fromLoc = this.locations.find(l => l.id === path.from);
            const toLoc = this.locations.find(l => l.id === path.to);

            if (!fromLoc || !toLoc) continue;

            const from = this.camera.worldToScreen(fromLoc.x, fromLoc.y);
            const to = this.camera.worldToScreen(toLoc.x, toLoc.y);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
    }

    renderLocations(ctx, canvas) {
        for (const location of this.locations) {
            if (!this.camera.isVisible(location.x, location.y, 20, 20)) continue;

            const screenPos = this.camera.worldToScreen(location.x, location.y);
            const size = 12 * this.camera.zoom;

            const faction = this.factions.find(f => f.id === location.owner);
            ctx.fillStyle = faction?.color || '#888888';

            ctx.beginPath();
            if (location.type === 'town') {
                ctx.arc(screenPos.x, screenPos.y, size * 1.5, 0, Math.PI * 2);
            } else if (location.type === 'castle') {
                ctx.moveTo(screenPos.x, screenPos.y - size);
                ctx.lineTo(screenPos.x + size, screenPos.y + size);
                ctx.lineTo(screenPos.x - size, screenPos.y + size);
                ctx.closePath();
            } else {
                ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
            }
            ctx.fill();

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `${10 * this.camera.zoom}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(location.name, screenPos.x, screenPos.y + size + 15);
        }
    }

    getLocationsNear(x, y, radius) {
        return this.locations.filter(loc => {
            const dist = this.getDistance({ x, y }, loc);
            return dist <= radius;
        });
    }

    getLocationAt(x, y) {
        for (const location of this.locations) {
            const dist = this.getDistance({ x, y }, location);
            const hitRadius = location.type === 'town' ? 30 : location.type === 'castle' ? 25 : 15;
            if (dist <= hitRadius) {
                return location;
            }
        }
        return null;
    }

    getTownById(id) {
        return this.locations.find(l => l.id === id);
    }

    toJSON() {
        return {
            locations: this.locations,
            factions: this.factions
        };
    }
}
