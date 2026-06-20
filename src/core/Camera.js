export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.target = null;
    }

    follow(target) {
        this.target = target;
        if (target) {
            this.x = target.x - this.viewportWidth / 2;
            this.y = target.y - this.viewportHeight / 2;
        }
    }

    pan(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    zoomTo(level) {
        this.zoom = Math.max(0.5, Math.min(3, level));
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.zoom,
            y: (wy - this.y) * this.zoom
        };
    }

    screenToWorld(sx, sy) {
        return {
            x: sx / this.zoom + this.x,
            y: sy / this.zoom + this.y
        };
    }

    isVisible(x, y, width = 0, height = 0) {
        const screenX = (x - this.x) * this.zoom;
        const screenY = (y - this.y) * this.zoom;
        const screenW = width * this.zoom;
        const screenH = height * this.zoom;

        return (
            screenX + screenW > 0 &&
            screenX < this.viewportWidth &&
            screenY + screenH > 0 &&
            screenY < this.viewportHeight
        );
    }

    update() {
        if (this.target) {
            const targetX = this.target.x - this.viewportWidth / (2 * this.zoom);
            const targetY = this.target.y - this.viewportHeight / (2 * this.zoom);

            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;
        }
    }

    setViewportSize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
}
