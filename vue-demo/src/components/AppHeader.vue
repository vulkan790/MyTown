<script setup>
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUser } from '@/api/useUser'

const { user, isPending, isLoggedIn } = storeToRefs(useUser())
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header__inner">
        <RouterLink :to="{ name: 'home' }" class="logo">
          <img src="@/assets/images/logo.svg" alt="logo" class="logo__img">
          <span class="logo-text">Мой Город</span>
        </RouterLink>
        <nav class="menu">
          <ul class="menu__list">
            <li class="menu__list-item" v-if="isPending || !isLoggedIn">
              <RouterLink to="/login" class="menu__list-link">Войти</RouterLink>
            </li>
            <li class="menu__list-item-btn" v-if="isPending || !isLoggedIn">
              <RouterLink to="/registration" class="menu__list-link-btn">Регистрация</RouterLink>
            </li>
            <template v-else>
              <li class="menu__list-item">
                <RouterLink :to="{ name: 'profile' }" class="menu__list-link">
                  {{ user.firstName }} {{ user.lastName }}
                </RouterLink>
              </li>
              <li class="menu__list-item-btn">
                <RouterLink :to="{ name: 'logout' }" class="menu__list-link-btn">Выйти</RouterLink>
              </li>
            </template>
          </ul>
        </nav>
      </div>
    </div>
  </header>
  <style src="./style.css"></style>
</template>
