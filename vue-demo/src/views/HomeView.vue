<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getHotProblems } from '@/api/client'
import { useUser } from '@/api/useUser'

import ProblemCard from '@/components/ProblemCard.vue'
import AppHeader from '@/components/AppHeader.vue'

const { data: problems, isPending: isProblemsPending, isError: isProblemsError } = useQuery({
  queryKey: ['hotProblems'],
  queryFn: getHotProblems,
  refetchOnWindowFocus: false,
})

console.log('Hot problems data:', problems)

const userStore = useUser()

const shouldShowReportButton = computed(() => {
  if (userStore.isPending || userStore.isError) return false 
  
  if (!userStore.isLoggedIn) return true 
  
  return userStore.user?.role === 'user'
})
</script>

<template>
  <AppHeader />

  <main class="main">
      <div class="container">
        <section class="first">
          <div class="left">
            <h1 class="first__text">Следите за состоянием вашего города вместе с нами</h1>
            <p class="first__description">Сообщайте о проблемах, контролируйте их устранение и делайте ваш город лучше</p>
            <RouterLink 
              v-if="shouldShowReportButton" 
              to="/report" 
              class="first__button">
              Cообщить о проблеме
            </RouterLink>
          </div>
          <div class="right">
            <img src="@/images/first-photo.jpg" alt="Улица" class="first__photo">
          </div>
        </section>
        <section class="second">
          <h1 class="title">Горячие проблемы</h1>
          <template v-if="isProblemsPending">Загрузка...</template>
          <template v-else-if="isProblemsError">Ошибка загрузки данных</template>
          <template v-else>
            <div v-for="problem in problems" :key="problem.id" class="abc" style="display: flex; justify-content: center; align-items: center;">
              <ProblemCard v-bind="problem" class="wide-card" />
            </div>
            <RouterLink to="/problems/all" class="second__btn-txt">Показать все проблемы</RouterLink>
          </template>
        </section>
      </div>
  </main>
</template>

<style>
.abc {
  margin-bottom: 20px;
  width: 100%;
}

.wide-card {
  max-width: 90vw !important;
  min-width: 300px !important;
}
</style>