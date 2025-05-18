<script setup>
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUser } from '@/api/useUser'

const { user, isPending, isLoggedIn } = storeToRefs(useUser())
</script>

<template>
  <footer class="footer">
    <div class="container">
      <nav class="footer__menu">
        <ul class="footer__menu-list footer__menu-list-logo">
          <li class="footer__menu-item">
            <RouterLink :to="{ name: 'home' }" class="footer__menu-link">
              <img src="@/images/logo.svg" alt="logo" class="logo__img">
            </RouterLink>
          </li>
        </ul>
        <ul class="footer__menu-list">
          <li class="footer__menu-item">
            <a href="mailto:mytown@mail.ru" class="footer__menu-link">mytown@mail.ru</a>
          </li>
          <li class="footer__menu-item">© 2025 Мой Город</li>
        </ul>
        <ul class="footer__menu-list">
          <li class="footer__menu-item">
            <a href="tel:+79528126969" class="footer__menu-link">8-952-812-69-69</a>
          </li>
          <li class="footer__menu-item">
            <RouterLink :to="{ name: 'social' }" class="footer__menu-link">
              Вконтакте
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>
