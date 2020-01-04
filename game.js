function* range(start = 0, stop = 10, step = 1) {
  for (let i = start; i < stop; i += step) {
    yield i
  }
}

const entities = []
let gameArea

async function startGame() {
  console.log('game playing')
  gameArea = $('.target-area')
  for (const i of range(0, 3)) {
    gameArea.append(`<div class="target">i am target ${i}</div>`)
  }
}
