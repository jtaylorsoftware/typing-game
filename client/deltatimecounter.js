/**
 * Tracks elapsed time from creation.
 */
class DeltaTimeCounter {
  constructor() {
    this.current = new Date().getTime()
    this.previous = this.current
    this.delta = 0
  }
  tick() {
    this.previous = this.current
    this.current = new Date().getTime()
    this.delta = this.current - this.previous
  }
}
