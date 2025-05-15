<script setup>
import { storeToRefs } from 'pinia'

import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'
import ProblemInfo from '@/components/ProblemCard.vue'

const { user } = storeToRefs(useUser())
</script>

<template>
  <AppHeader />

  <section>
    <h2>Профиль</h2>
    <ul>
      <li>Имя: {{ user.firstName }}</li>
      <li>Фамилия: {{ user.lastName }}</li>
      <li>Электронная почта: {{ user.email }}</li>
      <li>Полы: {{ user.gender }}</li>
    </ul>
  </section>

  <section>
    <h2>Список Ваших проблем</h2>
    <ul>
      <li v-for="problem in user.problems" :key="problem.id">
        <ProblemInfo :key="problem.id" v-bind="problem" :author="user" />
      </li>
    </ul>
  </section>
</template>