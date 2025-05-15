<script setup>
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUser } from '@/api/useUser'

const { user, isPending, isLoggedIn } = storeToRefs(useUser())
</script>

<template>
  <header>
    <span>Здесь логотип</span>
    <RouterLink :to="{ name: 'home' }">На главную</RouterLink>
    <RouterLink :to="{ name: 'problems-list' }">Все Проблемы</RouterLink>
    <hr />
    <template v-if="isPending || !isLoggedIn">Вы не авторизованы. <RouterLink to="/login">Войти</RouterLink></template>
    <template v-else>
      <span>Вы авторизованы как <RouterLink :to="{ name: 'profile' }">{{ user.firstName }} {{ user.lastName }}
        </RouterLink></span>
      <RouterLink :to="{ name: 'logout' }">Выйти</RouterLink>
    </template>
  </header>
</template>
