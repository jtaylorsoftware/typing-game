import { LoginRequired, UserSession } from '../auth/session'
import { getTopScores, showScores } from '../scores/scoreboard'
import { uploadScore } from '../scores/uploadscore'
import Clock from './clock'
import DeltaTimeCounter from './deltatimecounter'
import Target from './target'
import TargetMap from './targetmap'

/*
 * Creates the game instance, which also performs
 * necessary DOM manipulation such as adding event handlers
 */
export default function createGame() {
  try {
    return new Game()
  } catch (error) {
    console.error(error)
  }
}

/**
 * Controls Game logic and updating
 */
export class Game {
  /**
   * @type {UserSession}
   */
  #session = null

  constructor() {
    this.clockText = $('.time')
    this.targetArea = $('.target-area')
    this.gameInput = $('.game-input')
    this.modeInfo = $('.mode__info')

    this.MAX_TARGETS = 4
    this.MIN_TIMEREQUIRED = 5 // min time for target to reach bottom in seconds
    this.TARGET_GOAL = 90

    this.GAMEPLAY_TIME = 1 // minutes

    this.targetMap = new TargetMap()

    this.clock = new Clock()

    const gameArea = $('.game')

    gameArea.on('keydown', (e) => {
      if (e.code === 'Escape') {
        $('#pauseMenu').toggleClass('menu--hidden')
        this.paused = !this.paused
      }
    })

    gameArea.on('click', () => {
      gameArea.trigger('focus')
    })

    gameArea.on('focus', () => {
      // console.log('game focused')
      $('.game-input').trigger('focus')
    })

    $('#playButton').on('click', () => {
      $('#playMenu').toggleClass('menu--hidden')
      this.start()
    })

    $('#playAgainButton').on('click', () => {
      $('#gameOverMenu').toggleClass('menu--hidden')
      this.start()
    })

    $('#restartButton').on('click', () => {
      $('#pauseMenu').toggleClass('menu--hidden')
      this.start()
    })

    this.gameOver = true
    this.stopped = true
    this.paused = true

    this.gameInput.on('input', this.processTyping.bind(this))
    this.step = this.step.bind(this)

    $('#gameLoadingProgress').addClass('gone')
  }

  /**
   * Sets the session that belongs to the user and may be used to
   * submit scores.
   * @param {UserSession} session
   */
  setSession(session) {
    this.#session = session
  }

  setLife(life) {
    this.life = Math.max(0, life)
    this.lifeCounter.html(this.life)
    if (this.life === 0) {
      this.onGameOver()
    }
  }

  setScore(score) {
    this.score = score
    this.scoreCounter.html(this.score)
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
   * Prevent user input from updating by setting the gameInput value to the previous input
   */
  blockInput() {
    this.setGameInput(this.currentInput)
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
    // console.log(isValidCharacter)
    if (
      this.getGameInput().length < this.currentInput.length ||
      this.gameOver ||
      this.paused ||
      this.stopped ||
      !isValidCharacter
    ) {
      // only allow the user to type if the game is being played and
      // they input a valid character
      // console.log('blocking input in processTyping')
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

  haveTarget() {
    return this.target !== null
  }

  targetReachedGoal(target) {
    const word = target.getText()
    // console.log(target, word)
    this.numTargets -= 1
    this.freeColumns.push(target.column)
    this.setLife(this.life - (word.length + 5))
    if (word.startsWith(this.currentInput)) {
      this.target = null
      this.clearInput()
    }
  }

  /**
   * Gets the first jquery object that has data-first attribute set to letter
   * @param {string} letter the letter to use when finding the target
   */
  selectTargetFromLetter(letter) {
    // console.log(letter)
    const targetWithLetter = this.targetMap.get(letter)
    return targetWithLetter
  }

  selectTarget() {
    // select a new target if there isn't one
    const target = this.selectTargetFromLetter(
      this.getGameInput().slice(0, 1).toLowerCase()
    )
    // console.log(target)
    if (target) {
      this.target = target
    } else {
      // no target, dont display the new text
      this.setGameInput(this.currentInput)
    }
  }

  /**
   * Directs user's input toward the current target
   */
  attackTarget() {
    if (!this.target) {
      return
    }
    const targetText = this.target.getText()
    const gameInputText = this.getGameInput().toLowerCase()
    if (gameInputText === targetText) {
      // destroy the target if the user finished typing the target word
      this.clearInput()
      this.setScore(this.score + targetText.length)
      this.charsTyped += targetText.length
      this.destroyTarget()
    } else {
      // check the progress against the target word
      const nextInput = this.getGameInput().toLowerCase()
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

  destroyTarget() {
    this.targetMap.delete(this.target)
    this.freeColumns.push(this.target.column)
    this.target.remove()
    this.target = null
    this.numTargets -= 1
  }

  /**
   * Appends a target to the target area
   */
  createTarget() {
    // console.log('create target')
    let word = getRandomWord()
    while (this.targetMap.has(word[0])) {
      word = getRandomWord()
    }
    const column = this.freeColumns.shift()
    const target = new Target(
      word,
      column,
      0,
      this.TARGET_GOAL,
      Math.max(
        this.MIN_TIMEREQUIRED,
        randomInt(this.MIN_TIMEREQUIRED * word.length)
      )
    )
    this.targetArea.append(target.root)
    target.onGoalReached = this.targetReachedGoal.bind(this)
    this.targetMap.set(word[0], target)
  }

  /**
   * Updates target positions in sync with framerate
   * @param {number} deltaTime the time in milliseconds since last frame
   */
  updateTargets(deltaTime) {
    // console.log(this.targetMap[Symbol.iterator]())
    for (const target of this.targetMap.values()) {
      if (target.removed) {
        this.targetMap.delete(target)
      } else {
        target.update(deltaTime)
      }
    }
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
      if (this.numTargets < this.MAX_TARGETS) {
        this.numTargets += 1
        this.createTarget()
      }
      // move targets
      this.updateTargets(deltaTime)
    } else {
      this.onGameOver()
      // this.stop()
    }
  }

  async onGameOver() {
    this.gameOver = true
    this.paused = true
    this.modeInfo.addClass('mode__info--hidden')
    this.gameInput.addClass('game-input--hidden')
    $('#menuScore').html(this.score)
    $('#menuWpm').html(
      calculateWpm(
        this.charsTyped,
        (this.GAMEPLAY_TIME * 60 - this.clock.sec + 0.001) / 60
      )
    )
    $('#gameOverMenu').toggleClass('menu--hidden')
    const submitButton = $('#submitScoreButton')
    const submitProgress = $('#submitProgress')
    submitProgress.text('')

    const loggedIn = this.#session != null && (await this.#session.isLoggedIn())

    submitButton.toggleClass('gone', !loggedIn)
    submitProgress.toggleClass('gone', !loggedIn)

    if (loggedIn) {
      submitButton.prop('disabled', false)
      submitButton.on('click', () => {
        submitButton.off('click')
        submitButton.prop('disabled', true)
        submitProgress.text('Uploading score...')
        uploadScore(this.score, this.#session)
          .then(() => {
            submitProgress.text('Uploaded!')
          })
          .catch((error) => {
            submitProgress.text('Failed to upload score')
            if (error instanceof LoginRequired) {
              // TODO: Make sure this is correct way of handling it

              // Make user login with redirect
              this.#session
                .onLogin()
                .catch(() => console.log('User requires login again'))
            }
          })
          .then(() => getTopScores())
          .then((scores) => showScores(scores))
          .catch(() => console.error('Error loading scores'))
      })
    }
  }

  start() {
    this.reset()
    this.modeInfo.removeClass('mode__info--hidden')
    this.gameInput.removeClass('game-input--hidden')
    $('.game-input').trigger('focus')
    this.paused = this.gameOver = this.stopped = false
    this.frame = requestAnimationFrame(this.step)
  }

  reset() {
    this.timeCounter = new DeltaTimeCounter()
    this.clock.setTime(this.GAMEPLAY_TIME)

    this.numTargets = 0
    this.targetMap.clear()

    this.target = null
    this.freeColumns = Array.from({ length: 4 }, (v, i) => i + 1)
    // console.log(this.freeColumns)
    this.clearInput()

    this.score = 0
    this.scoreCounter = $('.score')
    this.scoreCounter.html(this.score)

    this.charsTyped = 0

    this.life = 100
    this.lifeCounter = $('.life__points')
    this.lifeCounter.html(this.life)

    this.frame = 0

    this.gameOver = false
    this.stopped = false
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
    // console.log('stopping')
    this.stopped = true
    cancelAnimationFrame(this.frame)
  }
}

function calculateWpm(charCount, minutes) {
  return Math.ceil(charCount / 5 / minutes)
}

function getRandomWord() {
  return wordList[randomInt(wordList.length)].toLowerCase()
}

function randomInt(max) {
  return Math.floor(Math.random() * max)
}
