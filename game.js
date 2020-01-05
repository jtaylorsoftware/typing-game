/**
 * Controls Game logic and updating
 */
class Game {
  constructor() {
    this.timeCounter = new DeltaTimeCounter()

    this.clockText = $('.time')
    this.clock = new Clock(2)

    this.MAX_TARGETS = 4
    this.TARGET_TIMEREQUIRED = 1000
    this.MAX_DISTANCE = 90
    this.targetCount = 0

    this.targetArea = $('.target-area')
    this.target = null
    this.targetText = null
    this.targetWord = ''

    this.gameInput = $('.game-input')
    this.gameInput.on('input', this.processTyping.bind(this))
    this.currentInput = ''
    this.targetHighlight = null
    this.usedWords = new Set()

    this.score = 0
    this.scoreCounter = $('.score')

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

  /**
   * Gets the first jquery object that has data-first attribute set to letter
   * @param {string} letter the letter to use when finding the target
   */
  selectTargetFromLetter(letter) {
    const target = this.targetArea.find(`[data-first=${letter}]`).first()
    return target.length > 0 ? target : null
  }

  selectTarget() {
    // select a new target if there isn't one
    const target = this.selectTargetFromLetter(this.getGameInput().slice(0, 1))
    if (target) {
      this.target = target
      this.targetHighlight = target.children(':nth-child(1)').first()
      this.targetText = target.children(':nth-child(2)').first()
      this.targetWord = this.targetText.text()
    } else {
      // no target, dont display the new text
      this.setGameInput(this.currentInput)
    }
  }

  getRandomWord() {
    let word = wordsList[_randomInt()]
    while (this.usedWords.has(word)) {
      word = wordsList[_randomInt()]
    }
    this.usedWords.add(word)
    return word
  }

  /**
   * Appends a target to the target area
   */
  createTarget() {
    const id = this.targetCount++
    const word = this.getRandomWord()
    const letter = word[0]
    this.targetArea.append(
      `<div id="${id}" class="target" data-first="${letter}">` +
        `<span class="target__text target__text--highlight"></span>` +
        `<span class="target__text">${word}</span></div>`
    )
  }

  destroyTarget() {
    this.target.remove()
    this.target = null
    this.targetText = null
    this.targetWord = ''
    this.targetHighlight = null
    this.setGameInput('')
    this.currentInput = ''
  }

  /**
   * Directs user's input toward the current target
   */
  attackTarget() {
    if (!this.target) {
      return
    }
    if (this.gameInput.val() === this.targetWord) {
      // destroy the target if the user typed the full word
      this.setGameInput('')
      this.setScore(this.score + getCharacterLength(this.targetWord))
      this.destroyTarget()
    } else {
      // check the progress against the target word
      const nextInput = this.getGameInput()
      const overlap = this.targetWord.slice(0, nextInput.length)
      if (overlap !== nextInput) {
        // block user's input if it's not part of the word
        this.blockInput()
      } else {
        // accept matching input
        this.currentInput = nextInput
        const currentLength = this.currentInput.length
        this.targetHighlight.html(this.targetWord.slice(0, currentLength))
        this.targetText.html(this.targetWord.slice(currentLength))
      }
    }
  }

  /**
   * Updates target positions in sync with framerate
   * @param {number} deltaTime the time in milliseconds since last frame
   */
  updateTargetPositions(deltaTime) {
    this.targetArea.children().each((ind, el) => {
      const target = $(el)
      const css = target[0].style.top || '0%'

      let top = Number.parseInt(css.substr(0, css.length - 1))
      const remaining = this.MAX_DISTANCE - top
      if (remaining <= 0) {
        // target reached bottom
        return
      }
      const step = Math.ceil(deltaTime / 1000 / this.TARGET_TIMEREQUIRED)
      top += step

      target.css({ top: `${top}%` })
    })
  }

  setScore(score) {
    this.score = score
    this.scoreCounter.html(this.score)
  }

  /**
   * Prevent user input from updating by setting the gameInput value to the previous input
   */
  blockInput() {
    this.setGameInput(this.currentInput)
  }

  setGameInput(str) {
    this.gameInput.val(str)
  }

  getGameInput() {
    return this.gameInput.val()
  }

  /**
   * Processes the user's input
   * @param {Event} e DOM input event
   */
  processTyping(e) {
    const inputString = e.target.value
    const lastCharacter = inputString.slice(-1)
    const isValidCharacter =
      /[a-zA-Z]/.test(lastCharacter) || // if first character, letters are valid
      (/['\s]/.test(lastCharacter) && inputString.length > 0) // else apostrophe and space are valid
    if (
      this.getGameInput().length < this.currentInput.length ||
      this.gameOver ||
      this.paused ||
      this.stopped ||
      !isValidCharacter
    ) {
      // only allow the user to type if the game is being played and
      // they input a valid character
      this.blockInput()
      return
    }

    // pick a target if there isn't one
    if (!this.haveTarget()) {
      this.selectTarget()
    }
    // direct user input to target
    this.attackTarget()
  }

  /**
   * Do framerate dependent update of any game logic and movement
   * @param {number} deltaTime the time since last frame in milliseconds
   */
  update(deltaTime) {
    // update the clock
    this.clock.addTime(0, 0, -1 * deltaTime)
    this.clockText.html(this.clock.toString())

    //------ core gameplay ------
    if (Clock.toMs(this.clock) !== 0) {
      // fill with targets
      const targets = this.targetArea.children()
      if (targets.length < this.MAX_TARGETS) {
        this.createTarget()
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
  /**
   * Do one full simulation step of the game including input, updates, and requesting redraw
   */
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

function _randomInt() {
  return Math.floor(Math.random() * wordsList.length)
}

function getCharacterLength(string) {
  return [...string].length
}

/**
 * Creates a Game instance and starts the game
 */
function startGame() {
  console.log('game playing')
  game = new Game()
  game.start()
}
