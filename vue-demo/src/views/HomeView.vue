<script setup>
import { useQuery } from '@tanstack/vue-query'
import { getHotProblems } from '@/api/client'
import AppHeader from '@/components/AppHeader.vue'
import ProblemCard from '@/components/ProblemCard.vue'
const { data: problems, isPending, isError } = useQuery({
  queryKey: ['hotProblems'],
  queryFn: getHotProblems,
  refetchOnWindowFocus: false,
})
</script>
<template>
  <div class="wrapper">
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
            <div v-for="problem in problems" :key="problem.id" class="group">
              <ProblemCard v-bind="problem" />
            </div>
            <RouterLink to="/problems" class="second__btn-txt">Показать все проблемы</RouterLink>
          </template>
        </section>
      </div>
    </main>
    <footer class="footer">
      <div class="container">
        <nav class="footer__menu">
          <ul class="footer__menu-list footer__menu-list-logo">
            <li class="footer__menu-item">
              <a href="#" class="footer__menu-link">
                <img src="@/images/logo.svg" alt="logo">
              </a>
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
              <a href="#" class="footer__menu-link">Вконтакте</a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  </div>
</template>
