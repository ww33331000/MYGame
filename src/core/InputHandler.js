export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, clicked: false };
        this.cameraDrag = false;
        this.lastMouse = { x: 0, y: 0 };

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Escape') {
                this.handleEscape();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.clicked = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.lastMouse = { x: e.clientX, y: e.clientY };

            if (e.button === 2 || e.ctrlKey) {
                this.cameraDrag = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.cameraDrag = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            if (this.cameraDrag) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.handleCameraDrag(dx, dy);
                this.lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e.deltaY);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('click', (e) => {
            this.handleMapClick(e.clientX, e.clientY);
        });
    }

    handleEscape() {
        if (this.game && this.game.state === 'playing') {
            this.game.ui.showPauseMenu();
        }
    }

    handleCameraDrag(dx, dy) {
        if (this.game && this.game.world) {
            this.game.world.camera.x -= dx;
            this.game.world.camera.y -= dy;
        }
    }

    handleZoom(delta) {
        if (this.game && this.game.world) {
            this.game.world.camera.zoom = Math.max(0.5, Math.min(3, this.game.world.camera.zoom - delta * 0.001));
        }
    }

    handleMapClick(x, y) {
        if (this.game && this.game.world && this.game.party) {
            const worldPos = this.game.world.camera.screenToWorld(x, y);
            this.game.party.setTarget(worldPos.x, worldPos.y);
        }
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    consumeClick() {
        const clicked = this.mouse.clicked;
        this.mouse.clicked = false;
        return clicked;
    }

    update() {
        this.mouse.clicked = false;
    }
}
