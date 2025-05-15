<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/api/useAuth'

const router = useRouter()
const auth = useAuth()

onMounted(() => {
  auth.removeToken()
  router.push('/login')
})
</script>

<template></template>
