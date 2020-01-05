/**
 * Encapsulates typical clock operations such as displaying the time (m,s,ms) and
 * manipulating the current time.
 */
class Clock {
  constructor(min, sec = 0, ms = 0) {
    this.min = min
    this.sec = sec
    this.ms = ms
  }
  setTime(min, sec = 0, ms = 0) {
    this.min = min
    this.sec = sec
    this.ms = ms
  }
  addTime(min, sec = 0, ms = 0) {
    const currentMs = Clock.toMs(this)
    const newMs = Math.max(currentMs + Clock.toMs({ min, sec, ms }), 0)
    this.min = Clock.msToMin(newMs)
    const minAsMs = Clock.minToMs(this.min)
    this.sec = Clock.msToSec(newMs - minAsMs)
    const secAsMs = Clock.secToMs(this.sec)
    this.ms = newMs - minAsMs - secAsMs
  }

  toString() {
    return `${this.min}:${this.sec}:${this.ms}`
  }

  static toMs(clock) {
    return Clock.minToMs(clock.min) + Clock.secToMs(clock.sec) + clock.ms
  }

  static minToSec(min) {
    return min * 60
  }
  static minToMs(min) {
    return min * 60 * 1000
  }
  static secToMs(sec) {
    return sec * 1000
  }
  static msToMin(ms) {
    return Math.floor(ms / (1000 * 60))
  }
  static msToSec(ms) {
    return Math.floor(ms / 1000)
  }
  static secToMin(sec) {
    return Math.floor(sec / 60)
  }
}
