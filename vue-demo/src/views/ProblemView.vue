<script setup>
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import { getProblemById } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import AppHeader from '@/components/AppHeader.vue'

const { params } = useRoute()
const auth = useAuth()

const { data: problem, error, isPending, isError } = useQuery({
  queryKey: ['problem', params.id, auth.token],
  queryFn: () => getProblemById(params.id, auth.token),

  retry: false,
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
})
</script>

<template>
  <AppHeader />

  <section>
    <h1>Подробно о преблеме</h1>

    <template v-if="isPending">Загрузка проблемы</template>
    <template v-else-if="isError">Проблема не найдена</template>
    <article v-else-if="problem">
      <h2>{{ problem.title }}</h2>
      <pre>{{ problem.description }}</pre>
    </article>
  </section>

  <section v-if="problem">
    <h2>Комментарии</h2>
    <ul>
      <li v-for="comment in problem.comments" :key="comment.id">
        <p>{{ comment.text }}</p>
        <p>Автор: {{ comment.author.firstName }} {{ comment.author.lastName }}</p>
        <p>Дата: {{ new Date(comment.createdAt).toLocaleDateString() }}</p>
      </li>
    </ul>
  </section>
</template>