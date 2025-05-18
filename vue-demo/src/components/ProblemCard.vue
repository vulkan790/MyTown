<script setup>
import { defineProps } from 'vue'
import { RouterLink } from 'vue-router'
const props = defineProps({
  id: Number,
  title: String,
  description: String,
  status: String,
  createdAt: String,
  votes: Number,
  author: {
    id: Number,
    firstName: String,
    avatarUrl: String
  },
  images: Array
})
const statusNames = {
  'wait_for_solve': 'В ожидании решения',
  'solving': 'В процессе решения',
  'solved': 'Решено',
  'rejected': 'Отклонено',
  'on_moderation': 'На модерации'
}
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
<template>
  <div class="group">
    <div class="group__text">
      <h3 class="group__title">
        <RouterLink :to="{ name: 'problem', params: { id } }">{{ title }}</RouterLink>
      </h3>
      <p class="description">{{ description }}</p>
      <div class="group__statusbar">
        <div class="group__statusbar-user">
          <img 
            :src="author.avatarUrl || '@/images/user-default.png'" 
            alt="user" 
            class="group__statusbar-user-logo"
          >
          <span class="group__statusbar-user-name">{{ author.firstName }}</span>
        </div>
        <ul class="group__statusbar-status">
          <li class="group__statusbar-status-item">{{ votes }} голосов</li>
          <li class="group__statusbar-status-item">{{ statusNames[status] }}</li>
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
<style src="/src/style.css"></style>
