<script setup>
import { ref, computed, watch } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { getProblems, PROBLEM_TYPES } from '@/api/client'
import { useUser } from '@/api/useUser'
import ProblemCard from '@/components/ProblemCard.vue'
import AppHeader from '@/components/AppHeader.vue'

const userStore = useUser()
const page = ref(1)
const limit = 12
const selectedProblemType = ref(null)

const availableProblemTypes = computed(() => {
  if (!userStore.user)
   return []
  
  const types = [
    { value: null, label: 'Все проблемы' }
  ]
  
  if (['admin', 'mod'].includes(userStore.user.role))
    types.push( { value: PROBLEM_TYPES.MODERATION, label: 'На модерации' } )
  
  if (userStore.user.role === 'gov')
    types.push( { value: PROBLEM_TYPES.PENDING, label: 'Ожидающие решения' }, { value: PROBLEM_TYPES.SOLVING, label: 'В процессе решения' } )
  
  return types
})

const getProblemType = computed(() => {
  if (!userStore.user)
   return undefined
  if (selectedProblemType.value !== null)
    return selectedProblemType.value
  if (['admin', 'mod'].includes(userStore.user.role))
    return PROBLEM_TYPES.MODERATION
  if (userStore.user.role === 'gov')
    return PROBLEM_TYPES.PENDING
  return undefined
})

const {
  data,
  isPending,
  isFetching,
  fetchNextPage,
  hasNextPage,
  isError,
  error,
  refetch
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

watch(data, (newData) => {
  console.log('Problems data:', newData)
  if (newData) {
    console.log('Pages:', newData.pages)
    newData.pages.forEach((page, index) => {
      console.log(`Page ${index}:`, page)
      console.log(`Problems on page ${index}:`, page.problems)
    })
  }
})

const handleProblemTypeChange = (type) => {
  selectedProblemType.value = type
  refetch()
}

const pageTitle = computed(() => {
  if (!userStore.user)
   return 'Список проблем'
  const selectedType = availableProblemTypes.value.find(type => type.value === selectedProblemType.value)
  if (selectedType && selectedType.value !== null)
    return selectedType.label
  switch (userStore.user.role)
  {
    case 'mod':
    case 'admin':
      return 'Проблемы на модерации'
    case 'gov':
      return 'Проблемы для решения'
    default:
      return 'Список проблем'
  }
})

const allProblems = computed(() => {
  if (!data.value || !data.value.pages) return []
  return data.value.pages.flatMap(page => page.problems || [])
})

const hasProblems = computed(() => {
  return allProblems.value.length > 0
})
</script>

<template>
  <AppHeader />

  <main class="main">
    <div class="container">
      <section class="all__problems">
        <div class="problems-header">
          <h1 class="all__problems-title">{{ pageTitle }}</h1>
          
          <div v-if="availableProblemTypes.length > 1" class="problem-type-selector">
            <select 
              v-model="selectedProblemType" 
              @change="handleProblemTypeChange(selectedProblemType)"
              class="type-select">
              <option 
                v-for="type in availableProblemTypes" 
                :key="type.value" 
                :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>
        
        <template v-if="isPending">
          <div class="loading">Загрузка проблем...</div>
        </template>
        
        <template v-else-if="isError">
          <div class="error">Ошибка загрузки: {{ error.message }}</div>
        </template>
        
        <template v-else-if="hasProblems">
          <div class="problems-container">
            <ul class="all__problems-list">
              <li v-for="problem in allProblems" 
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
        
        <template v-else>
          <div class="no-problems">
            Проблем не найдено
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.problem-type-selector {
  display: flex;
  align-items: center;
}

.type-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  font-size: 1rem;
}

.type-select:focus {
  outline: none;
  border-color: #007bff;
}

.loading, .error, .no-problems {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #dc3545;
}

.no-problems {
  color: #666;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 2rem;
}

.load-more-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.load-more-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.all__problems-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.5rem;
}
</style>