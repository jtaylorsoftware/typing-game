$(document).ready(() => {
  main()
    .then(() => console.log('exiting'))
    .catch(e => console.error(e))
})

async function main() {
  try {
    await startGame()
  } catch (error) {
    console.error(error)
  }
}
