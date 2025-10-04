import { Auth0Client, User, createAuth0Client } from '@auth0/auth0-spa-js'

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
        clientId: 'ohJyNtW7tqCi5opqQdwwnZKDSUXdEqhQ',
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
        authorizationParams: {
          redirect_uri: window.location.origin
        }
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

    await this.#auth0.logout({
      logoutParams: { returnTo: window.location.origin }
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
    if (query.includes('code=') && (query.includes('state=') || query.includes('error='))) {
      const url = window.location.href
      try {
        await this.#auth0.handleRedirectCallback(url)
        window.history.replaceState({}, document.title, '/')
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
