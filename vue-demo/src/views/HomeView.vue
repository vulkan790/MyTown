<script setup>
import { useQuery } from '@tanstack/vue-query'

import { getHotProblems } from '@/api/client'

import AppHeader from '@/components/AppHeader.vue'
import ProblemInfo from '@/components/ProblemCard.vue'

const { data: problems, isPending, isError } = useQuery({
  queryKey: ['hotProblems'],
  queryFn: getHotProblems,

  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
})

</script>

<template>
  <AppHeader />

  <section>
    <h1>Мой Город - наше приложение</h1>
  </section>

  <main>
    <h2>Горячие проблемы</h2>
    <template v-if="isPending">Loading</template>
    <template v-else-if="isError">Нет доступных проблем</template>
    <ul v-else-if="problems">
      <li v-for="problem in problems">
        <ProblemInfo :key="problem.id" v-bind="problem" />
      </li>
    </ul>
  </main>
</template>
