<script setup>
import { useQuery } from '@tanstack/vue-query'
import { getHotProblems } from '@/api/client'

import ProblemCard from '@/components/ProblemCard.vue'
import AppHeader from '@/components/AppHeader.vue'

const { data: problems, isPending, isError } = useQuery({
  queryKey: ['hotProblems'],
  queryFn: getHotProblems,
  refetchOnWindowFocus: false,
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
            <RouterLink to="/report" class="first__button">Cообщить о проблеме</RouterLink>
          </div>
          <div class="right">
            <img src="@/images/first-photo.jpg" alt="Улица" class="first__photo">
          </div>
        </section>
        <section class="second">
          <h1 class="title">Горячие проблемы</h1>
          <template v-if="isPending">Загрузка...</template>
          <template v-else-if="isError">Ошибка загрузки данных</template>
          <template v-else>
            <div v-for="problem in problems" :key="problem.id" class="abc" style="display: flex; justify-content: center; align-items: center;">
              <ProblemCard v-bind="problem" />
            </div>
            <RouterLink to="/problems/all" class="second__btn-txt">Показать все проблемы</RouterLink>
          </template>
        </section>
      </div>
  </main>
</template>
