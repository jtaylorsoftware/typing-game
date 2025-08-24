import axios from 'axios'

export async function getTopScores() {
  showProgress()
  try {
    const response = await axios.get(
      '/api/scores',
      {
        params: { game: 'Words', count: 10 },
      }
    )
    hideProgress()
    hideError()
    return response.data.data
  } catch (error) {
    showError('Could not load scores right now.')
    throw error
  }
}

export function showScores(scores) {
  const list = $('#scoreboardList')
  list.empty()
  scores.forEach((score) => {
    list.append(
      `<li class="scoreboard__score">
        <span class="scoreboard__score__user">${score.PlayerUsername}</span>
        <span class="scoreboard__score__value">${score.Score}</span>
      </li>`
    )
  })
}

function showProgress() {
  const el = $('#scoreboardProgress')
  el.text('Loading scores...')
  el.toggleClass('gone')
}

function hideProgress() {
  const el = $('#scoreboardProgress')
  el.text('')
  el.toggleClass('gone')
}

function showError(errorMsg) {
  const el = $('#scoreboardError')
  el.text(errorMsg)
  el.toggleClass('gone')
}

function hideError() {
  const el = $('#scoreboardError')
  el.text('')
  el.toggleClass('gone')
}
