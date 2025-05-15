<script setup>
import { defineProps, watchEffect } from 'vue'

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
// or
// const props = defineProps(['title', 'description', 'status', 'createdAt', 'votes', 'author', 'images'])

watchEffect(() => {
  console.log('ProblemCard props:', props.author)
})

const names = {
  'wait_for_solve': 'В ожидании решения',
  'solving': 'В процессе решения',
  'solved': 'Решено',
  'rejected': 'Отклонено',
  'on_moderation': 'На модерации'
}
</script>

<template>
  <article>
    <h2>{{ title }}</h2>
    <pre>{{ description }}</pre>
    <p>Статус: {{ names[status] }}</p>
    <p>Создан: {{ new Date(createdAt).toLocaleDateString('ru-RU', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }) }}</p>
    <p>Голосов: {{ votes }}</p>
    <p>Автор: {{ author.firstName }}</p>
    <img v-for="image in images" :src="image" :alt="title" />

    <RouterLink :to="{ name: 'problem', params: { id } }">
      <button>Подробнее</button>
    </RouterLink>
  </article>
</template>