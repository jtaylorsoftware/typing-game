/**
 * Stores targets in a Map where first letter of the target word are keys
 */
export class TargetMap {
  constructor() {
    this.map = new Map()
    this.targetSet = new Set()
  }

  set(letter, target) {
    if (this.map.has(letter)) {
      const targets = this.map.get(letter)
      targets.push(target)
    } else {
      this.map.set(letter, [target])
    }
    this.targetSet.add(target)
  }

  get(letter) {
    return this.map.has(letter) ? [...this.map.get(letter)] : null
  }

  delete(target) {
    const letter = target.getText()[0]
    const targets = this.map.get(letter)
    if (targets) {
      const targetInd = targets.findIndex(t => t === target) // compare by reference
      if (targetInd >= 0) {
        const target = targets[targetInd]
        target.remove()
        targets.splice(targetInd, 1)
        this.targetSet.delete(target)
        return true
      }
    }
    return false
  }

  clear() {
    this.map.clear()
    this.targetSet.clear()
  }

  get size() {
    return this.map.size
  }

  has(letter) {
    return this.map.has(letter)
  }

  [Symbol.iterator]() {
    return this.targetSet.values()
  }
}
