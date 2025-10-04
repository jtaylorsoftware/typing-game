import { UserSession } from "./session"

/**
 * @param {UserSession} session
 */
const updateUserUI = async (session) => {
  const loginBtn = $('#loginBtn')
  loginBtn.on('click', (e) => {
    e.preventDefault()
    session.onLogin()
  })

  const logoutBtn = $('#logoutBtn')
  logoutBtn.on('click', (e) => {
    e.preventDefault()
    session.onLogout()
  })

  const isAuthenticated = await session.isAuthenticated()

  const currentUser = $('#currentUser')
  currentUser.toggleClass('gone', !isAuthenticated)

  const noUser = $('#noUser')
  noUser.toggleClass('gone', isAuthenticated)

  $('#loadingUser').addClass('gone')

  if (isAuthenticated) {
    const user = await session.getUser()
    currentUser.text(`Logged in as: ${user.preferred_username}`)
  } else {
    currentUser.text('')
  }

  loginBtn.prop('disabled', isAuthenticated)
  loginBtn.toggleClass('gone', isAuthenticated)
  logoutBtn.prop('disabled', !isAuthenticated)
  logoutBtn.toggleClass('gone', !isAuthenticated)
}

export default updateUserUI