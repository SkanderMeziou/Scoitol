// v1.0.1
import { Game } from './game/Game.js'

document.querySelector('#app').innerHTML = ''

const game = new Game()
game.start()
