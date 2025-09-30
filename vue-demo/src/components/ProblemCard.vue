<script setup>
import { defineProps, computed } from 'vue'
import { RouterLink } from 'vue-router'
import ClassicAvatar from '@/images/user-png.png'
import { useUser } from '@/api/useUser'
import { moderateProblem } from '@/api/client'

const props = defineProps({
  id: Number,
  title: String,
  description: String,
  status: String,
  createdAt: String,
  votes: Number,
  author: {
    type: Object,
    default: () => ({
      id: 0,
      firstName: 'Аноним',
      avatarUrl: ''
    })
  },
  images: {
    type: Array,
    default: () => []
  }
})

const userStore = useUser()

const statusNames = {
  'wait_for_solve': 'В ожидании решения',
  'solving': 'В процессе решения',
  'solved': 'Решено',
  'rejected': 'Отклонено',
  'on_moderation': 'На модерации'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const votesText = computed(() => {
  const count = props.votes || 0
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19)
   return `${count} голосов`
  if (lastDigit === 1)
   return `${count} голос`
  if (lastDigit >= 2 && lastDigit <= 4)
   return `${count} голоса`
  return `${count} голосов`
})

const moderate = async (decision) => {
  try {
    await moderateProblem(props.id, decision)
    window.location.reload()
  } catch (error) {
    console.error('Ошибка модерации:', error)
    alert('Ошибка при выполнении модерации: ' + error.message)
  }
}

const canModerate = computed(() => {
  return userStore.isLoggedIn && ['admin', 'mod'].includes(userStore.user?.role)
})

const isOnModeration = computed(() => {
  return props.status === 'on_moderation'
})

const getAvatarUrl = (author) => {
  if (!author?.avatarUrl)
   return ClassicAvatar
  
  if (author.avatarUrl.startsWith('/'))
    return `${import.meta.env.VITE_API_URL || ''}${author.avatarUrl}`
  
  return author.avatarUrl
}

const handleImageError = (event, type = 'avatar') => {
  if (type === 'avatar')
    event.target.src = ClassicAvatar
  else 
    event.target.style.display = 'none'
}
</script>

<template>
  <div class="group" style="max-width: 800px">
    <div class="group__text">
      <h3 class="group__title">
        <RouterLink :to="{ name: 'problem', params: { id } }">{{ title || 'Без названия' }}</RouterLink>
      </h3>
      <p class="description">{{ description || 'Описание отсутствует' }}</p>
      
      <div v-if="canModerate && isOnModeration" class="moderation-buttons">
        <button @click="moderate('approve')" class="btn-approve">✓ Принять</button>
        <button @click="moderate('reject')" class="btn-reject">✗ Отклонить</button>
      </div>
      
      <div class="group__statusbar">
        <div class="group__statusbar-user">
          <img 
            :src="getAvatarUrl(author)" 
            alt="user" 
            class="group__statusbar-user-logo"
            @error="(e) => handleImageError(e, 'avatar')">
          <span class="group__statusbar-user-name">{{ author?.firstName || 'Аноним' }}</span>
        </div>
        <ul class="group__statusbar-status">
          <li class="group__statusbar-status-item">{{ votesText }}</li>
          <li class="group__statusbar-status-item">{{ statusNames[status] || 'Статус неизвестен' }}</li>
          <li class="group__statusbar-status-item">{{ formatDate(createdAt) }}</li>
        </ul>
      </div>
    </div>
    <img 
      v-if="images?.length" 
      :src="images[0]" 
      :alt="title" 
      class="group__img"
      @error="(e) => handleImageError(e, 'problem')"
    >
  </div>
</template>

<style scoped>
.moderation-buttons {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.btn-approve {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-approve:hover {
  background-color: #45a049;
}

.btn-reject {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-reject:hover {
  background-color: #da190b;
}
</style>