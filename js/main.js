// ===== 游戏启动入口 =====
(function main() {
  window.addEventListener('load', () => {
    Render.init();
    Game.initInput();

    // 显示主菜单
    UI.showMainMenu(
      () => {
        UI.showCharacterCreate((charInfo) => Game.startNewGame(charInfo));
      },
      () => {
        Game.continueGame();
      },
      () => {}
    );

    // 主游戏循环
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      Game.tick(dt);
      Game.render(dt);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
})();
