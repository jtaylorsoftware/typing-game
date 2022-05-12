import axios from 'axios'
import { UserSession } from '../auth/session'

/**
 * Uploads the user's score.
 *
 * @param {number} score The score to upload.
 *
 * @param {UserSession} session Current user session that can be used for API token.
 */
export async function uploadScore(score, session) {
  try {
    const token = await session.getAccessToken()
    await axios.post(
      'https://7jl348vded.execute-api.us-west-2.amazonaws.com/scores',
      {
        GameTitle: 'Type Attack',
        Score: score,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  } catch (error) {
    console.error('Error uploading score')
    throw error
  }
}
