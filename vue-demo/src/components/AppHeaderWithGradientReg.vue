<script setup>
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUser } from '@/api/useUser'

const { user, isPending, isLoggedIn } = storeToRefs(useUser())
</script>

<template>
  <header class="header" style="background: linear-gradient(to right, #D3DEF2 20%, #3786BE 80%);">
    <div class="container">
      <div class="header__inner">
        <RouterLink :to="{ name: 'home' }" class="logo">
          <img src="@/images/logo.svg" alt="logo" class="logo__img">
          <span class="logo-text">Мой Город</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>