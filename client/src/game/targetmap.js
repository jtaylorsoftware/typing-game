/**
 * Stores targets in a Map where first letter of the target word are keys
 */
export class TargetMap {
  constructor() {
    this.map = new Map()
  }

  set(letter, target) {
    this.map.set(letter, target)
    return this
  }

  get(letter) {
    return this.map.get(letter)
  }

  delete(target) {
    const letter = target.getText()[0]
    if (this.get(letter) === target) {
      this.map.delete(letter)
      return true
    }
    return false
  }

  clear() {
    for (const target of this.map.values()) {
      target.remove()
    }
    this.map.clear()
  }

  get size() {
    return this.map.size
  }

  has(letter) {
    return this.map.has(letter)
  }

  values() {
    return this.map.values()
  }

  [Symbol.iterator]() {
    return this.map[Symbol.iterator]()
  }
}
