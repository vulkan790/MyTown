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
      return 'Все проблемы'
    case 'gov':
      return 'Все проблемы'
    default:
      return 'Список проблем'
  }
})

const allProblems = computed(() => {
  if (!data.value || !data.value.pages) return []
  const allProblems = data.value.pages.flatMap(page => page.problems || [])
  return allProblems.filter(problem => problem.status !== 'solved')
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
          <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка проблем...</p>
          </div>
        </template>
        
        <template v-else-if="isError">
          <div class="error">
            <div class="error-icon">⚠️</div>
            <p>Ошибка загрузки: {{ error.message }}</p>
            <button @click="refetch" class="retry-btn">Попробовать снова</button>
          </div>
        </template>
        
        <template v-else-if="hasProblems">
          <div class="problems-container">
            <ul class="all__problems-list">
              <li v-for="problem in allProblems" 
                  :key="problem.id">
                <ProblemCard v-bind="problem" class="wide-card" />
              </li>
            </ul>
          </div>
          
          <div class="load-more-container">
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
            <div class="no-problems-icon">📋</div>
            <p>Проблем не найдено</p>
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 0;
}

.all__problems-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.problem-type-selector {
  display: flex;
  align-items: center;
}

.type-select {
  padding: 0.6rem 1.2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.type-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.loading, .error, .no-problems {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  font-size: 1.1rem;
  text-align: center;
}

.loading p, .error p, .no-problems p {
  margin-top: 1rem;
  margin-bottom: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error {
  color: #e74c3c;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #c0392b;
}

.no-problems {
  color: #7f8c8d;
}

.no-problems-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.load-more-btn {
  padding: 0.8rem 2.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.load-more-btn:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.load-more-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.all__problems-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.5rem;
}

.wide-card {
  width: 100%;
}
</style>