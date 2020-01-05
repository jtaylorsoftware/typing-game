$(document).ready(() => {
  main()
})

function main() {
  try {
    startGame()
  } catch (error) {
    console.error(error)
  }
}
