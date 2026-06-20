export class GameLoop {
    constructor(game) {
        this.game = game;
        this.running = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.running = false;
    }

    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;

        if (this.deltaTime >= this.frameInterval) {
            this.update(this.deltaTime);
            this.render();
            this.lastTime = currentTime - (this.deltaTime % this.frameInterval);
        }

        requestAnimationFrame(() => this.loop());
    }

    update(deltaTime) {
        this.game.update(deltaTime);
    }

    render() {
        this.game.render();
    }
}
