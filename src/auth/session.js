import createAuth0Client, { Auth0Client, User } from '@auth0/auth0-spa-js'

/**
 * Create an empty session that can handle a login attempt
 * or a redirect from a login attempt.
 *
 * @returns a new {@link UserSession} object
 */
export default async function createUserSession() {
  const session = new UserSession()
  await session.init()
  return session
}

export class UserSession {
  /**
   * @type {Auth0Client}
   */
  #auth0 = null

  /**
   * @type {User}
   */
  #user = null

  /**
   * Prepares to use a new or existing session.
   */
  async init() {
    try {
      this.#auth0 = await createAuth0Client({
        domain: 'dev-8cswtg2p.us.auth0.com',
        client_id: 'ohJyNtW7tqCi5opqQdwwnZKDSUXdEqhQ',
        audience: 'https://game-services-api.com',
      })
    } catch (error) {
      throw new Error('Error configuring user session')
    }
  }

  /**
   * Handles a user-initiated login attempt.
   */
  async onLogin() {
    if (this.#auth0 == null) {
      return
    }

    try {
      await this.#auth0.loginWithRedirect({
        redirect_uri: window.location.origin,
      })
    } catch (error) {
      console.error('Error performing login redirect')
    }
  }

  /**
   * Handles a user-initiated logout attempt.
   */
  async onLogout() {
    if (this.#auth0 == null) {
      return
    }

    this.#auth0.logout({
      returnTo: window.location.origin,
    })
  }

  /**
   * Gets the current user's profile data.
   */
  async getUser() {
    if (this.#auth0 == null) {
      return null
    }
    if (this.#user != null) {
      return this.#user
    }

    try {
      this.#user = await this.#auth0.getUser()
    } catch (error) {
      console.error('Error loading user')
      return null
    }
    return this.#user
  }

  /**
   * @returns {Promise<boolean>} `true` if user is currently logged in.
   */
  async isLoggedIn() {
    return (await this.getUser()) !== null
  }

  /**
   * Gets an access token for the API.
   *
   * @throws {@link LoginRequired} - when the user must log in again to get a token.
   *
   * @returns {Promise<?string>} The token, or null if client is not initialized or user never logged in.
   */
  async getAccessToken() {
    if (this.#auth0 == null || this.#user == null) {
      return null
    }

    try {
      return await this.#auth0.getTokenSilently()
    } catch (error) {
      if (error.error != null && error.error === 'login_required') {
        // User has to login again
        throw new LoginRequired()
      } else {
        console.error(error)
        throw new Error('Could not get API token')
      }
    }
  }

  async isAuthenticated() {
    if (this.#auth0 == null) {
      return false
    }
    return this.#auth0.isAuthenticated()
  }

  /**
   * Handles the current or previous login redirect callback.
   */
  async handleRedirectCallback() {
    if (this.#auth0 == null) {
      throw new Error('Can not handle redirect - session client is null')
    }

    const query = window.location.search
    if (query.includes('code=') && query.includes('state=')) {
      const url = window.location.href
      window.history.replaceState({}, document.title, '/')
      try {
        await this.#auth0.handleRedirectCallback(url)
        this.#user = await this.#auth0.getUser()
      } catch (error) {
        throw new Error('Error getting user')
      }
    }
  }
}

export class LoginRequired extends Error {
  constructor() {
    super('user must login again')
  }
}

/**
 * @param {UserSession} session
 */
export async function updateUi(session) {
  const loginBtn = $('#loginBtn')
  loginBtn.on('click', () => {
    session.onLogin()
  })

  const logoutBtn = $('#logoutBtn')
  logoutBtn.on('click', () => {
    session.onLogout()
  })

  const isAuthenticated = await session.isAuthenticated()

  const currentUser = $('#currentUser')
  currentUser.toggleClass('gone', !isAuthenticated)

  const noUser = $('#noUser')
  noUser.toggleClass('gone', isAuthenticated)

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
