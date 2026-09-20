import { Game } from './game/Game.js'

document.querySelector('#app').innerHTML = `
  <main class="game-shell" aria-label="Village Defense">
    <section class="field-column" aria-label="Playing field">
      <div id="arena">
        <div id="game-overlay" class="game-overlay">
          <div class="intro-card"><h2 hidden></h2><p hidden></p><button id="start-button" class="primary-button">Play</button></div>
        </div>
      </div>
    </section>
    <aside id="shop" aria-label="Build shop"></aside>
    <section class="game-info" aria-label="Game information">
      <div id="hud" aria-label="Village status"></div>
      <div class="game-actions"><button id="guide-button" class="quiet-button" aria-label="Open field guide">Help</button><button id="pause-button" class="quiet-button" aria-label="Pause game">Ⅱ Pause</button></div>
      <div id="notification" role="status"></div>
    </section>
  </main>
  <dialog id="field-guide" aria-labelledby="guide-title"></dialog>
`

const game = new Game()
game.start()
