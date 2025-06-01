import { computed, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/client'
import { useAuth } from './useAuth'

export const useUser = defineStore('user', () => {
  const auth = useAuth()

  const { data: user, isError, isPending, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: () => getCurrentUser(auth.token),
    retry: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  watchEffect(() => {
    if (auth.token) {
      refetch()
    }
  })

  const isLoggedIn = computed(() => {
    if (!auth.token) return false
    if (isPending.value) return false
    if (isError.value) return false
    return true
  })

  return {
    user,
    isPending,
    isError,
    isLoggedIn,
  }
})