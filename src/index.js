import Game from './game/game'

$(document).ready(() => {
  main()
})

function main() {
  try {
    const game = new Game()
  } catch (error) {
    console.error(error)
  }
}
