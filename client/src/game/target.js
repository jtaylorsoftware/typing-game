/**
 * Represents a target for the player to destroy
 */
export class Target {
  /**
   *
   * @param {jquery} root The root jquery element for the target
   * @param {number} start The starting value of css "top"
   * @param {number} goal The value of css "top" to reach - the "goal"
   * @param {number} timeToReach The time required to reach the goal (seconds)
   */
  constructor(word, start, goal, timeToReach) {
    this.root = $(
      `<div id="${Target.id++}" class="target" data-first="${word[0]}">` +
        `<span class="target__text target__text--highlight"></span>` +
        `<span class="target__text">${word}</span></div>`
    )
    this.highlight = this.root.children(':nth-child(1)').first()
    this.word = this.root.children(':nth-child(2)').first()
    this.wordText = word
    this.start = start
    this.goal = goal
    this.timeToReach = timeToReach
    this.step = 0
    this.removed = false
  }

  /**
   * @param {function(number)} callback Function to invoke when goal is reached,
   * taking word destroyed
   */
  set onGoalReached(callback) {
    this.goalReachedHandler = callback
  }

  setProgress(text) {
    this.highlight.html(this.wordText.slice(0, text.length))
    this.word.html(this.wordText.slice(text.length))
  }

  getText() {
    return this.wordText
  }

  goalReached() {
    this.goalReachedHandler(this.wordText)
    this.remove()
  }

  /**
   * Does one update of the Target
   * @param {number} deltaTime Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (this.removed) {
      return
    }

    const css = this.root[0].style.top || '0%'
    let top = Number.parseInt(css.substr(0, css.length - 1))
    const remaining = this.goal - top
    if (remaining <= 0) {
      if (this.goalReachedHandler) {
        this.goalReached()
      }
    }
    const step = this.step + deltaTime / 1000 / this.timeToReach
    this.step = step
    top = this.goal * step
    this.root.css({ top: `${Math.ceil(top)}%` })
  }

  remove() {
    this.root.remove()
    this.removed = true
  }
}

Target.id = 0
