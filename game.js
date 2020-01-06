/**
 * Controls Game logic and updating
 */
class Game {
  constructor() {
    this.clockText = $('.time')
    this.targetArea = $('.target-area')
    this.gameInput = $('.game-input')
    this.gameInput.on('input', this.processTyping.bind(this))

    this.MAX_TARGETS = 4
    this.TARGET_TIMEREQUIRED = 8 // time for target to reach bottom
    this.TARGET_GOAL = 90

    this.targetMap = new TargetMap()
    this.usedWords = new Set()

    const gameArea = $('.game')
    gameArea.click(() => {
      gameArea.focus()
    })
    gameArea.focus(() => {
      console.log('game focused')
      $('.game-input').focus()
    })
    this.paused = true
    $('#playButton').click(() => {
      $('#playMenu').toggleClass('menu--hidden')
      this.start()
    })
    $('#playAgainButton').click(() => {
      this.start()
      $('#gameOverMenu').toggleClass('menu--hidden')
    })

    this.step = this.step.bind(this)
  }

  reset() {
    this.timeCounter = new DeltaTimeCounter()

    this.clock = new Clock(2)

    for (const target of this.targetMap) {
      target.remove()
    }
    this.targetMap.clear()
    this.usedWords.clear()

    this.target = null

    this.clearInput()

    this.score = 0
    this.scoreCounter = $('.score')

    this.life = 100
    this.lifeCounter = $('.life__points')
    this.lifeCounter.html(this.life)

    this.frame = 0

    this.gameOver = false
    this.stopped = false
    this.paused = false
  }

  haveTarget() {
    return this.target !== null
  }

  /**
   * Gets the first jquery object that has data-first attribute set to letter
   * @param {string} letter the letter to use when finding the target
   */
  selectTargetFromLetter(letter) {
    const targetsWithLetter = this.targetMap.get(letter)
    return targetsWithLetter ? targetsWithLetter[0] : null
  }

  selectTarget() {
    // select a new target if there isn't one
    const target = this.selectTargetFromLetter(this.getGameInput().slice(0, 1))
    if (target) {
      this.target = target
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
    const word = this.getRandomWord()

    const target = new Target(
      word,
      0,
      this.TARGET_GOAL,
      this.TARGET_TIMEREQUIRED
    )
    this.targetArea.append(target.root)
    target.onGoalReached = this.targetReachedGoal.bind(this)
    this.targetMap.set(word[0], target)
  }

  destroyTarget() {
    this.targetMap.delete(this.target)
    this.target.remove()
    this.target = null
  }

  /**
   * Directs user's input toward the current target
   */
  attackTarget() {
    if (!this.target) {
      return
    }
    const targetText = this.target.getText()
    if (this.gameInput.val() === targetText) {
      // destroy the target if the user typed the full word
      this.clearInput()
      this.setScore(this.score + targetText.length)
      this.destroyTarget()
    } else {
      // check the progress against the target word
      const nextInput = this.getGameInput()
      if (!targetText.startsWith(nextInput)) {
        // block user's input if it's not part of the word
        this.blockInput()
      } else {
        // accept matching input
        this.currentInput = nextInput
        this.target.setProgress(this.currentInput)
      }
    }
  }

  /**
   * Updates target positions in sync with framerate
   * @param {number} deltaTime the time in milliseconds since last frame
   */
  updateTargets(deltaTime) {
    // console.log(this.targetMap[Symbol.iterator]())
    for (const target of this.targetMap) {
      if (target.removed) {
        this.targetMap.delete(target)
      } else {
        target.update(deltaTime)
      }
    }
  }

  setLife(life) {
    this.life = Math.max(0, life)
    this.lifeCounter.html(this.life)
    if (this.life === 0) {
      this.gameOver = true
      this.paused = true
      $('#gameOverMenu').toggleClass('menu--hidden')
    }
  }

  targetReachedGoal(word) {
    this.setLife(this.life - word.length)
    if (word.startsWith(this.currentInput)) {
      this.target = null
      this.clearInput()
    }
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

  clearInput() {
    this.setGameInput('')
    this.currentInput = ''
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
      this.updateTargets(deltaTime)
    } else {
      this.stop()
    }
  }
  start() {
    this.reset()
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
