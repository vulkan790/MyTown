import ky from 'ky'

export const api = ky.extend({
  prefixUrl: import.meta.env.VITE_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('access-token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ]
  }
})

export const PROBLEM_TYPES = {
  MODERATION: 'moderation',
  PENDING: 'pending',
  SOLVING: 'solving',
  ALL: undefined
}

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
 * @param {string} [type]
 * @returns {Promise<PaginatedResponse<Problem>>}
 */
export function getProblems(page = 1, limit = 12, type) {
  const searchParams = { page, limit };
  if (type !== undefined && type !== null) {
    searchParams.type = type;
  }
  return api.get('problems', { searchParams }).json();
}

/**
 * Fetch a problem by its ID.
 * @param {number} id
 * @returns {Promise<Problem & { comments: Comment[] }>}
 */
export function getProblemById(id) {
  return api.get(`problems/${id}`).json()
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
  return api.post('auth/login', { 
    json: { email, password },
    throwHttpErrors: false 
  }).json()
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
 * Отправить код восстановления пароля
 * @param {string} email
 * @returns {Promise<void>}
 */
export function requestPasswordReset(email) {
  return api.post('auth/forgot-password', { json: { email } }).json();
}

/**
 * Сбросить пароль с помощью кода
 * @param {string} email
 * @param {string} code
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export function resetPassword(email, code, newPassword) {
  return api.post('auth/reset-password', { 
    json: { email, code, newPassword } 
  }).json();
}

/**
 * Fetch the current user's details.
 * @returns {Promise<CurrentUserResponse>}
 */
export function getCurrentUser() {
  return api.get('users/me').json()
}

/**
 * Fetch address suggestions.
 * @param {string} address
 * @returns {Promise<AddressSuggestion[]>}
 */
export function getAddressSuggestions(address) {
  return api.get('problems/address-suggest', {
    searchParams: { address },
  }).json()
}

/**
 * Upload an image for a problem.
 * @param {FormData} formData
 * @returns {Promise<UploadImageResponse>}
 */
export const uploadProblemImage = async (formData) => {
  try {
    const response = await api.post('problems/images', {
      body: formData
    });
    const data = await response.json();
    console.log('Upload response:', data);
    return data;
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      if (error.response.status === 400)
        throw new Error(errorData.error || 'Invalid file format');
      if (error.response.status === 401)
        throw new Error('Authorization required');
      if (error.response.status === 500)
        throw new Error(`Server error: ${errorData.detail || 'Check server logs'}`);
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
 * @returns {Promise<CreateProblemResponse>}
 */
export const createProblem = async (problemData) => {
  try {
    const response = await api.post('problems', {
      json: problemData
    });
    return response.json();
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      console.error('Create problem error details:', errorData);
      if (error.response.status === 400)
        throw new Error(errorData.error || JSON.stringify(errorData.errors));
      if (error.response.status === 401)
        throw new Error('Authorization required');
    }
    throw error;
  }
}

/**
 * Moderate a problem.
 * @param {number} id
 * @param {'reject' | 'approve'} decision - строго по API
 * @returns {Promise<void>}
 */
export async function moderateProblem(id, decision) {
  try {
    const response = await api.post(`problems/${id}/moderation`, {
      json: { decision },
    });
    
    if (response.status !== 204)
      throw new Error('Ошибка модерации');
    return;
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      if (error.response.status === 400)
        throw new Error(errorData.error || 'Проблема уже была промодерирована');
      if (error.response.status === 401)
        throw new Error('Требуется авторизация');
      if (error.response.status === 403)
        throw new Error('Недостаточно прав');
      if (error.response.status === 404)
        throw new Error('Проблема не найдена');
    }
    throw new Error('Ошибка модерации: ' + error.message);
  }
}

/**
 * Update the status of a problem.
 * @param {number} id
 * @param {'claim' | 'resolve'} action
 * @returns {Promise<void>}
 */
export const updateProblemStatus = async (problemId, action) => {
  try 
  {
    const response = await api.post(`problems/${problemId}/town`, {
      json: { action }
    });
    if (response.status === 204)
      return;
    if (response.status === 401)
      throw new Error('Требуется авторизация');
    if (response.status === 403)
      throw new Error('Недостаточно прав');
    if (response.status === 404)
      throw new Error('Проблема не найдена');
    throw new Error(`Ошибка обновления статуса: ${response.status}`);
  } 
  catch (error) 
  {
    if (error.response) 
    {
      const errorData = await error.response.json().catch(() => ({}));
      throw new Error(errorData.error || error.message);
    }
    throw error;
  }
};

/**
 * Add a comment to a problem.
 * @param {number} id
 * @param {string} content
 * @returns {Promise<AddCommentResponse>}
 */
export const addCommentToProblem = async (problemId, content) => {
  return api.post(`problems/${problemId}/comments`, {
    json: { content }
  }).json()
}

/**
 * Vote for a problem.
 * @param {number} id
 * @param {number} vote - -1, 0, or 1
 * @returns {Promise<void>}
 */
export async function addVoteToProblem(id, vote) {
  try {
    const response = await api.post(`problems/${id}/vote`, {
      json: { vote }
    });
    if (response.status === 204)
      return;
    const data = await response.json();
    return data;
  } 
  catch (error) 
  {
    if (error.response) 
    {
      const errorData = await error.response.json().catch(() => ({}));
      if (error.response.status === 400)
        throw new Error(errorData.error || 'problem_is_closed');
      if (error.response.status === 404)
        throw new Error('Проблема не найдена');
    }
    throw error;
  }
}

/**
 * Upload user avatar.
 * @param {FormData} formData
 * @returns {Promise<{ avatarUrl: string }>}
 */
export const uploadUserAvatar = async (formData) => {
  try 
  {
    const response = await api.post('users/me/avatar', {
      body: formData
    });
    if (response.status === 201)
      return response.json();
    throw new Error('Ошибка загрузки аватара');
  } 
  catch (error) 
  {
    if (error.response) 
    {
      const errorData = await error.response.json();
      if (error.response.status === 400)
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      if (error.response.status === 401)
        throw new Error('Authorization required');
    }
    throw error;
  }
}

/**
 * Получить полный URL для ресурса
 * @param {string} url - относительный или абсолютный URL
 * @returns {string}
 */
export const getFullUrl = (url) => {
  if (!url)
    return ''
  if (url.startsWith('http') || url.startsWith('//'))
    return url
  const baseUrl = import.meta.env.VITE_API_URL || ''
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`
}

/**
 * Get static map image from Yandex Maps using geo URI
 * @param {string} uri - URI from address suggestions (ymapsbm1://geo?data=...)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} zoom - Zoom level (1-17)
 * @returns {string} - Map image URL
 */
export const getStaticMapUrl = (uri, width = 600, height = 400, zoom = 15) => {
  if (!uri) 
    return '';
  
  try 
  {
    const urlParams = new URLSearchParams(uri.replace('ymapsbm1://geo?', ''));
    const data = urlParams.get('data');
    if (data) 
    {
      const apiKey = '085624b9-22de-4b17-b432-f8a35fb66144';
      return `https://static-maps.yandex.ru/v1?apikey=${apiKey}&size=${width},${height}&zoom=${zoom}&lang=ru_RU&pt=${encodeURIComponent(data)}`;
    }
  } 
  catch (error) 
  {
    console.error('Error parsing map URI:', error);
  }
  
  return '';
}

/**
 * Get static map for address string (fallback method)
 * @param {string} address - Address string
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} zoom - Zoom level (1-17)
 * @returns {string} - Map image URL
 */
export const getStaticMapForAddress = (address, width = 600, height = 400, zoom = 15) => {
  if (!address) 
    return '';
  const apiKey = '085624b9-22de-4b17-b432-f8a35fb66144';
  return `https://static-maps.yandex.ru/v1?apikey=${apiKey}&size=${width},${height}&zoom=${zoom}&lang=ru_RU&text=${encodeURIComponent(address)}`;
}

/**
 * Get static map with multiple parameters for more control
 * @param {Object} params
 * @param {string} [params.uri] - Geo URI from suggestions
 * @param {string} [params.address] - Address string
 * @param {number} [params.width=600]
 * @param {number} [params.height=400]
 * @param {number} [params.zoom=15]
 * @param {string} [params.pt] - Custom point parameters
 * @returns {string} - Map image URL
 */
export const getStaticMap = (params = {}) => {
  const {
    uri,
    address,
    width = 600,
    height = 400,
    zoom = 15,
    pt
  } = params;
  
  const apiKey = '085624b9-22de-4b17-b432-f8a35fb66144';
  let url = `https://static-maps.yandex.ru/v1?apikey=${apiKey}&size=${width},${height}&zoom=${zoom}&lang=ru_RU`;
  
  if (uri) 
  {
    try 
    {
      const urlParams = new URLSearchParams(uri.replace('ymapsbm1://geo?', ''));
      const data = urlParams.get('data');
      if (data)
        url += `&pt=${encodeURIComponent(data)}`;
    } 
    catch (error) 
    {
      console.error('Error parsing URI:', error);
    }
  } 
  else if (pt)
    url += `&pt=${encodeURIComponent(pt)}`;
  else if (address)
    url += `&text=${encodeURIComponent(address)}`;
  return url;
}