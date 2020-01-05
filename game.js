/**
 * Controls Game logic and updating
 */
class Game {
  constructor() {
    this.timeCounter = new DeltaTimeCounter()

    this.clockText = $('.time')
    this.clock = new Clock(0, 10)

    this.entities = []

    this.targetArea = $('.target-area')

    this.frame = 0

    this.start = this.start.bind(this)
    this.step = this.step.bind(this)
  }
  update() {
    // step the delta counter
    this.timeCounter.tick()
    // update the clock
    this.clock.addTime(0, 0, -1 * this.timeCounter.delta)
    this.clockText.text(this.clock.toString())
  }
  start() {
    this.frame = requestAnimationFrame(this.step)
  }
  step() {
    // do one game simulation step
    this.update()
    this.frame = requestAnimationFrame(this.step)
  }
  stop() {
    cancelAnimationFrame(this.frame)
  }
}

/**
 * Creates a Game instance and starts the game
 */
function startGame() {
  console.log('game playing')
  game = new Game()
  game.start()
}
