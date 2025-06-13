<script setup>
import { ref, computed } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { getProblems } from '@/api/client'
import { useUser } from '@/api/useUser'
import ProblemCard from '@/components/ProblemCard.vue'
import AppHeader from '@/components/AppHeader.vue'

const userStore = useUser()
const page = ref(1)
const limit = 12

const getProblemType = computed(() => {
  if (!userStore.user) return undefined
  
  if (['gov', 'admin', 'mod'].includes(userStore.user.role)) {
    return ''
  }
  return undefined
})

const {
  data,
  isPending,
  isFetching,
  fetchNextPage,
  hasNextPage,
  isError,
  error
} = useInfiniteQuery({
  queryKey: ['problems', getProblemType],
  queryFn: ({ pageParam = 1 }) => 
    getProblems(pageParam, limit, getProblemType.value),
  initialPageParam: 1,
  getNextPageParam: (currentPage) => {
    if (currentPage.page * limit >= currentPage.total) {
      return undefined
    }
    return currentPage.page + 1
  },
  refetchOnWindowFocus: false,
})
</script>

<template>
  <AppHeader />

  <main class="main">
    <div class="container">
      <section class="all__problems">
        <h1 class="all__problems-title">Список проблем</h1>
        
        <template v-if="isPending">
          <div class="loading">Загрузка проблем...</div>
        </template>
        
        <template v-else-if="isError">
          <div class="error">Ошибка загрузки: {{ error.message }}</div>
        </template>
        
        <template v-else>
          <div class="problems-container">
            <ul class="all__problems-list">
              <li v-for="problem in data.pages.flatMap((page) => page.problems)" 
                  :key="problem.id">
                <ProblemCard v-bind="problem" />
              </li>
            </ul>
          </div>
          
          <div class="load-more-container" style="text-align: center;">
            <button 
              :disabled="!hasNextPage || isFetching" 
              @click="fetchNextPage" 
              class="load-more-btn">
              {{ isFetching ? 'Загрузка...' : 'Загрузить еще' }}
            </button>
          </div>
        </template>
      </section>
    </div>
  </main>

</template>