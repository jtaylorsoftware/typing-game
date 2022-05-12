import createGame from './game/game'
import { getTopScores, showScores } from './scores/scoreboard'
import createUserSession, { updateUi } from './auth/session'

$(async () => {
  getTopScores()
    .then((scores) => showScores(scores))
    .catch(() => console.error('Error loading scores'))

  let session
  try {
    session = await createUserSession()
    $('#sessionError').text('')
  } catch (error) {
    $('#sessionError').text('Error initializing user session')
  }

  const game = createGame()
  game.setSession(session)

  try {
    await updateUi(session)
    await session.handleRedirectCallback()
    updateUi(session)
  } catch (error) {
    console.error(error)
  }
})
