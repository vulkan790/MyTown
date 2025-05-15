import { ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_STORAGE = 'access-token'

export const useAuth = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE) || '')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem(TOKEN_STORAGE, newToken)
  }

  const removeToken = () => {
    token.value = ''
    localStorage.removeItem(TOKEN_STORAGE)
  }

  return {
    token,
    setToken,
    removeToken,
  }
})