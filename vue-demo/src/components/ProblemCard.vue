<script setup>
import { defineProps, computed } from 'vue'
import { RouterLink } from 'vue-router'
import ClassicAvatar from '@/images/user-png.png'

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
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${count} голосов`
  if (lastDigit === 1) return `${count} голос`
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} голоса`
  return `${count} голосов`
})
</script>

<template>
  <div class="group" style="max-width: 1000px">
    <div class="group__text">
      <h3 class="group__title">
        <RouterLink :to="{ name: 'problem', params: { id } }">{{ title || 'Без названия' }}</RouterLink>
      </h3>
      <p class="description">{{ description || 'Описание отсутствует' }}</p>
      <div class="group__statusbar">
        <div class="group__statusbar-user">
          <img 
            :src="author?.avatarUrl || ClassicAvatar" 
            alt="user" 
            class="group__statusbar-user-logo"
          >
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
    >
  </div>
</template>