<script setup>
import { ref, watchEffect } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'

import { getProblems } from '@/api/client'
import ProblemCard from '@/components/ProblemCard.vue'
import AppHeader from '@/components/AppHeader.vue'

const page = ref(1)
const limit = 1

const { data, isPending, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['problems', page],
  queryFn: ({ pageParam }) => getProblems(pageParam, limit),
  initialPageParam: 1,
  getNextPageParam: (currentPage) => {
    console.log(currentPage)
    if (currentPage.page * limit >= currentPage.total) {
      return undefined
    }

    return currentPage.page + 1
  },

  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
})

watchEffect(() => {
  console.log(data)
})
</script>

<template>
  <AppHeader />

  <section>
    <h2>Список проблем</h2>
    <template v-if="isPending">Загрузка проблем</template>
    <ul v-else-if="data">
      <li v-for="problem in data.pages.flatMap((page) => page.problems)" :key="problem.id">
        <ProblemCard v-bind="problem" :key="problem.id" />
      </li>
    </ul>
    <button :disabled="!hasNextPage || isFetching" @click="fetchNextPage">
      Загрузить еще
    </button>
  </section>
</template>