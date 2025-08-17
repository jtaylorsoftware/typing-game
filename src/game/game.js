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

    // min time for target to reach bottom in seconds
    this.BASE_TIME_REQUIRED = 10
    
    this.MAX_TARGETS = 4
    
    this.TARGET_GOAL = 90

    this.GAMEPLAY_TIME = 1 // minutes

    this.targetMap = new TargetMap()

    this.clock = new Clock()

    $(document).on('keydown', (e) => {
      if (e.code === 'Escape') {
        if (!this.stopped)
        {
          $('#pauseMenu').toggleClass('menu--hidden')
          this.paused = !this.paused
          if (this.paused)
          {
            this.gameInput.addClass('game-input--hidden')
          }
          else
          {
            this.gameInput.removeClass('game-input--hidden')
            this.gameInput.trigger('focus')
          }
        }
      }
    })

    $('#difficulty').get(0).reset()

    $('.game').on('click', () => {
      if (!this.stopped && !this.paused)
      {
        this.gameInput.trigger('focus')
      }
    })

    $('input[type="radio"][name="difficulty"]').on('change', (e) => {
      this.difficulty = $(e.currentTarget).val()
    })

    $('#playButton').on('click', () => {
      $('#playMenu').addClass('menu--hidden')
      this.reset()
      this.start()
    })

    $('#playAgainButton').on('click', () => {
      $('#gameOverMenu').addClass('menu--hidden')
      this.reset()
      this.start()
    })

    $('#quitButton').on('click', () => {
      $('#pauseMenu').addClass('menu--hidden')
      this.reset()
      this.quitToMainMenu()
    })

    $('#restartButton').on('click', () => {
      $('#pauseMenu').addClass('menu--hidden')
      this.reset()
      this.start()
    })

    this.difficulty = 2
    this.gameOver = false
    this.stopped = true
    this.paused = false

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
      this.gameOver ||
      this.paused ||
      this.stopped ||
      this.getGameInput().length < this.currentInput.length ||
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
    // Get the target word
    let word = getRandomWord()
    while (this.targetMap.has(word[0])) {
      word = getRandomWord()
    }

    // Get first column available, fill left to right
    const column = this.freeColumns.shift()

    // The min time to reach the goal - lower difficulty = slower speed.
    // The target will never reach goal faster than this value.
    const minTimeToGoal = this.BASE_TIME_REQUIRED - this.difficulty

    // Determine actual time to goal, based on word length.
    // Longer words will be slower on average.
    const timeToGoal = Math.max(
      minTimeToGoal,
      randomInt(minTimeToGoal * word.length)
    )
    const target = new Target(
      word,
      column,
      0,
      this.TARGET_GOAL,
      timeToGoal
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
    }
  }

  async onGameOver() {
    this.stop()
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
    $('#gameOverMenu').removeClass('menu--hidden')
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
    this.stopped = false
    this.modeInfo.removeClass('mode__info--hidden')
    this.gameInput.removeClass('game-input--hidden')
    this.frame = requestAnimationFrame(this.step)
    this.gameInput.trigger('focus')
  }

  quitToMainMenu() {
    this.stop()
    this.modeInfo.addClass('mode__info--hidden')
    this.gameInput.addClass('game-input--hidden')
    $('#playMenu').removeClass('menu--hidden')
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
    this.paused = false
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
