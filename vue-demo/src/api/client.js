import ky from 'ky'

export const api = ky.extend({
  prefixUrl: import.meta.env.VITE_API_URL,
})

/**
 * @typedef {'wait_for_solve' | 'solving' | 'solved' | 'rejected' | 'on_moderation'} Status
 * @typedef {'male' | 'female'} Gender
 * @typedef {'user' | 'admin' | 'gov' | 'mod'} Role
 */

/**
 * @typedef {Object} Author
 * @property {number} id
 * @property {string} firstName
 * @property {string} [lastName]
 * @property {string} [middleName]
 * @property {string} avatarUrl
 */

/**
 * @typedef {Object} Problem
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} address
 * @property {string[]} images
 * @property {Status} status
 * @property {number} votes
 * @property {number} [vote] 
 * @property {string} createdAt - ISO date string
 * @property {Author} author
 */

/**
 * @typedef {Object} Comment
 * @property {number} id
 * @property {Author} author
 * @property {string} content
 * @property {string} createdAt - ISO date string
 */

/**
 * @typedef {Object} AddressSuggestion
 * @property {string} title
 * @property {string} subtitle
 * @property {string} uri
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @property {number} page
 * @property {number} total
 * @property {T[]} problems
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} accessToken
 */

/**
 * @typedef {Object} RegisterResponse
 * @property {string} accessToken
 */

/**
 * @typedef {Object} CurrentUserResponse
 * @property {number} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [middleName]
 * @property {Gender} gender
 * @property {Role} role
 * @property {Problem[]} problems
 */

/**
 * @typedef {Object} UploadImageResponse
 * @property {number} id
 * @property {string} url
 */

/**
 * @typedef {Object} CreateProblemResponse
 * @property {number} id
 */

/**
 * @typedef {Object} AddCommentResponse
 * @property {number} id
 * @property {string} content
 * @property {Author} author
 */

/**
 * Fetch a paginated list of problems.
 * @param {number} [page=1]
 * @param {number} [limit=12]
 * @returns {Promise<PaginatedResponse<Problem>>}
 */
export function getProblems(page = 1, limit = 12) {
  return api.get('problems', { searchParams: { page, limit } }).json()
}

/**
 * Fetch a problem by its ID.
 * @param {number} id
 * @param {string} [token]
 * @returns {Promise<Problem & { comments: Comment[] }>}
 */
export function getProblemById(id, token) {
  return api.get(`problems/${id}`, {
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  }).json()
}

/**
 * Fetch a list of hot problems.
 * @returns {Promise<Problem[]>}
 */
export function getHotProblems() {
  return api.get('problems/hot').json()
}

/**
 * Log in a user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<LoginResponse>}
 */
export function login(email, password) {
  return api.post('auth/login', { json: { email, password } }).json()
}

/**
 * Register a new user.
 * @param {Object} userData
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.firstName
 * @param {string} userData.lastName
 * @param {string} [userData.middleName]
 * @param {Gender} userData.gender
 * @returns {Promise<RegisterResponse>}
 */
export function register(userData) {
  return api.post('auth/register', { json: userData }).json()
}

/**
 * Verify email with a token.
 * @param {string} token - The verification token (code)
 * @returns {Promise<void>}
 */
export function verifyEmail(token) {
  return api.post('auth/verify', { json: { token } }).json();
}

/**
 * Fetch the current user's details.
 * @param {string} token
 * @returns {Promise<CurrentUserResponse>}
 */
export function getCurrentUser(token) {
  return api.get('users/me', { 
    headers: { Authorization: `Bearer ${token}` },
  }).json()
}
/**
 * Fetch address suggestions.
 * @param {string} address
 * @param {string} token
 * @returns {Promise<AddressSuggestion[]>}
 */
export function getAddressSuggestions(address, token) {
  return api.get('problems/address-suggest', { 
    headers: { Authorization: `Bearer ${token}` },
    searchParams: { address },
  }).json()
}

/**
 * Upload an image for a problem.
 * @param {FormData} formData
 * @param {string} token
 * @returns {Promise<UploadImageResponse>}
 */
export const uploadProblemImage = async (formData, token) => {
  try {
    const response = await api.post('problems/images', {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      body: formData
    });

    const data = await response.json();
    console.log('Upload response:', data);
    return data;
    
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      
      if (error.response.status === 400) {
        throw new Error(errorData.error || 'Invalid file format');
      }
      if (error.response.status === 401) {
        throw new Error('Authorization required');
      }
      if (error.response.status === 500) {
        throw new Error(`Server error: ${errorData.detail || 'Check server logs'}`);
      }
    }
    
    console.error('Full upload error:', error);
    throw new Error('File upload failed. Please try smaller files.');
  }
}

/**
 * Create a new problem.
 * @param {Object} problemData
 * @param {string} problemData.title
 * @param {string} problemData.description
 * @param {string} problemData.address
 * @param {number[]} problemData.images
 * @param {string} token
 * @returns {Promise<CreateProblemResponse>}
 */
export const createProblem = async (problemData, token) => {
  try {
    const response = await api.post('problems', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      json: problemData
    });
    
    return response.json();
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      console.error('Create problem error details:', errorData);
      
      if (error.response.status === 400) {
        throw new Error(errorData.error || JSON.stringify(errorData.errors));
      }
      if (error.response.status === 401) {
        throw new Error('Authorization required');
      }
    }
    throw error;
  }
}

/**
 * Moderate a problem.
 * @param {number} id
 * @param {'reject' | 'approve'} decision
 * @param {string} token
 * @returns {Promise<void>}
 */
export function moderateProblem(id, decision, token) {
  return api.post(`problems/${id}/moderation`, {
    headers: { Authorization: `Bearer ${token}` },
    json: { decision },
  }).json()
}

/**
 * Update the status of a problem.
 * @param {number} id
 * @param {'claim' | 'resolve'} action
 * @param {string} token
 * @returns {Promise<void>}
 */
export function updateProblemStatus(id, action, token) {
  return api.post(`problems/${id}/town`, {
    headers: { Authorization: `Bearer ${token}` },
    json: { action },
  }).json()
}

/**
 * Add a comment to a problem.
 * @param {number} id
 * @param {string} content
 * @param {string} token
 * @returns {Promise<AddCommentResponse>}
 */
export const addCommentToProblem = async (problemId, content, token) => {
  try {
    const response = await axios.post(
      `/api/problems/${problemId}/comment`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

/**
 * Vote for a problem.
 * @param {number} id
 * @param {number} vote - -1, 0, or 1
 * @param {string} token
 * @returns {Promise<void>}
 */
export function addVoteToProblem(id, vote, token) {
  return api.post(`problems/${id}/vote`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    json: { vote }
  })
}