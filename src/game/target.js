/**
 * Represents a target for the player to destroy
 */
export default class Target {
  /**
   *
   * @param {string} word The word that must be typed for this target
   * @param {number} column The column of the target grid area to be placed in
   * @param {number} start The starting value of css "top"
   * @param {number} goal The value of css "top" to reach - the "goal"
   * @param {number} timeToReach The time required to reach the goal (seconds)
   */
  constructor(word, column, start, goal, timeToReach) {
    this.root = $(
      `<div id="${Target.id++}" class="target ship" data-first="${word[0]}"
        style="top: ${start}%; grid-column-start: ${column}; grid-row-start: 1;">
        <div class="ship__cockpit"></div>
        <div class="ship__body">
        <div class="ship__console">
          <span class="ship__text ship__text--highlight"></span>
          <span class="ship__text">${word}</span>
        </div>
        </div>
        <div class="ship__engine">
          <div class="ship__thruster"></div>
          <div class="ship__thruster"></div>
          <div class="ship__thruster"></div>
      </div>`
    )
    this.highlight = this.root.find('.ship__text--highlight').first()
    this.word = this.root.find('.ship__text--highlight + .ship__text').first()
    this.wordText = word
    this.start = start
    this.column = column
    this.goal = goal
    this.timeToReach = timeToReach
    this.step = 0
    this.removed = false
  }

  /**
   * @param {function(string)} callback Function to invoke when goal is reached,
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
    this.goalReachedHandler(this)
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
    let top = Number.parseInt(css.substring(0, css.length - 1))
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
