import { computed, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/client'
import { useAuth } from './useAuth'

export const useUser = defineStore('user', () => {
  const auth = useAuth()

  const { 
    data: user, 
    isError, 
    isPending, 
    refetch,
    error
  } = useQuery({
    queryKey: ['user', auth.token],
    queryFn: () => auth.token ? getCurrentUser() : null,
    retry: false,
    refetchOnWindowFocus: true,
  })

  watchEffect(() => {
    if (auth.token) {
      refetch()
    } else {
      user.value = null
    }
  })

  const isLoggedIn = computed(() => {
    return !!auth.token && !!user.value && !isError.value
  })

  const role = computed(() => user.value?.role || null)
  
  const isPrivilegedUser = computed(() => {
    return ['gov', 'admin', 'mod'].includes(role.value)
  })

  return {
    user,
    isPending,
    isError,
    error,
    isLoggedIn,
    role,
    isPrivilegedUser,
    refetch
  }
})