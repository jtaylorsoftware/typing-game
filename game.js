/**
 * Controls Game logic and updating
 */
class Game {
  constructor() {
    this.timeCounter = new DeltaTimeCounter()

    this.clockText = $('.time')
    this.clock = new Clock(2)

    this.MAX_TARGETS = 5
    this.TARGET_TIMEREQUIRED = 1000
    this.MAX_DISTANCE = 90
    this.targetCount = 0

    this.targetArea = $('.target-area')
    this.target = null
    this.targetText = ''

    this.gameInput = $('.game-input')
    this.gameInput.on('input', this.processTyping.bind(this))
    this.currentInput = ''

    this.frame = 0

    this.gameOver = false
    this.stopped = false
    this.paused = false

    this.start = this.start.bind(this)
    this.step = this.step.bind(this)
  }

  haveTarget() {
    return this.target !== null
  }

  selectTargetFromLetter(letter) {
    const target = this.targetArea.find(`[data-first=${letter}]`)
    return target.length > 0 ? target : null
  }

  destroyTarget() {
    this.target.remove()
    this.target = null
    this.targetText = ''
    this.setGameInput('')
    this.currentInput = ''
  }

  attackTarget() {
    if (this.gameInput.val() === this.targetText) {
      console.log('destroyed target')
      this.setGameInput('')
      this.destroyTarget()
    } else {
      const nextInput = this.getGameInput()
      const overlap = this.targetText.slice(0, nextInput.length)
      if (overlap !== nextInput) {
        this.blockInput()
      } else {
        this.currentInput = nextInput
      }
    }
  }

  updateTargetPositions(deltaTime) {
    this.targetArea.children().each((ind, el) => {
      const target = $(el)
      const css = target[0].style.top || '0%'

      let top = Number.parseInt(css.substr(0, css.length - 1))
      const remaining = this.MAX_DISTANCE - top
      if (remaining <= 0) {
        return
      }
      const step = Math.ceil(deltaTime / 1000 / this.TARGET_TIMEREQUIRED)
      top += step

      target.css({ top: `${top}%` })
    })
  }

  blockInput() {
    this.setGameInput(this.currentInput)
  }

  setGameInput(str) {
    this.gameInput.val(str)
  }

  getGameInput() {
    return this.gameInput.val()
  }

  processTyping(e) {
    if (
      this.getGameInput().length < this.currentInput.length ||
      this.gameOver ||
      this.paused ||
      this.stopped ||
      !/^[a-zA-Z]/.test(e.target.value)
    ) {
      this.blockInput()
      return
    }
    console.log(this.getGameInput().length, this.currentInput.length)
    if (!this.haveTarget()) {
      console.log('picking target')
      const target = this.selectTargetFromLetter(e.target.value[0])
      if (target) {
        this.target = target
        this.targetText = target.children(':nth-child(2)').text()
      } else {
        // no target, dont display the new text
        this.setGameInput(this.currentInput)
        return
      }
    }

    this.attackTarget()
  }

  update(deltaTime) {
    // update the clock
    this.clock.addTime(0, 0, -1 * deltaTime)
    this.clockText.text(this.clock.toString())

    //------ core gameplay ------
    if (Clock.toMs(this.clock) !== 0) {
      // fill with targets
      const targets = this.targetArea.children()
      if (targets.length < this.MAX_TARGETS) {
        const id = this.targetCount++
        const letter = String.fromCharCode('a'.charCodeAt(0) + id)
        this.targetArea.append(
          `<div id="${id}" class="target" data-first="${letter}">` +
            `<span class="target__text target__target--highlight"></span>` +
            `<span class="target__text">${letter} target</span></div>`
        )
      }
      // move targets
      this.updateTargetPositions(deltaTime)
    } else {
      this.stop()
    }
  }
  start() {
    this.frame = requestAnimationFrame(this.step)
  }
  step() {
    if (this.stopped) {
      return
    }
    // step the delta counter
    this.timeCounter.tick()
    // do one game simulation step
    if (!this.paused) {
      this.update(this.timeCounter.delta)
    }
    this.frame = requestAnimationFrame(this.step)
  }
  stop() {
    console.log('stopping')
    this.stopped = true
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
