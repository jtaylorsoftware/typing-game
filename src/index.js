import createGame from './game/game'
import { getTopScores, showScores } from './scores/scoreboard'
import createUserSession from './auth/session'
import updateUserUI from './auth/session-ui'
import axios from 'axios'

$(async () => {
  axios.defaults.baseURL = 'https://words.jtaylorsoftware.com'

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
    await session.handleRedirectCallback()
    updateUserUI(session)
  } catch (error) {
    console.error(error)
  }
})
