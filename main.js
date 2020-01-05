$(document).ready(() => {
  main()
})

function main() {
  const gameArea = $('.game')
  gameArea.click(() => {
    gameArea.focus()
  })
  gameArea.focus(() => {
    console.log('game focused')
    $('.game-input').focus()
  })
  try {
    startGame()
  } catch (error) {
    console.error(error)
  }
}
