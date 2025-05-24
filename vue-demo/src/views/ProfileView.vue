<script setup>
import { storeToRefs } from 'pinia'

import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'
import ProblemInfo from '@/components/ProblemCard.vue'

const { user } = storeToRefs(useUser())
</script>

<template>
  <AppHeader />

  <main class="main">
    <div class="container">
      <div class="profile-layout">
        <section class="profile-auth">
          <div class="profile-header">
            <h1>Личные данные:</h1>
            <img 
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              alt="Profile"
              class="user-logo"
              @error="handleImageError"
            >
            <img
              v-else
              src="@/images/Profile.svg"
              alt="Default Profile"
              class="user-logo"
            >
            <div class="profile-info">
              <a href="#" class="change-photo-btn">Добавить/Изменить фото</a>
            </div>
          </div>

          <div class="profile-details">
            <div class="profile-details">
              <div class="detail-label">ФИО</div>
              <div class="detail-value">{{ user.lastName }} {{ user.firstName }} {{ user.middleName }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Почта</div>
              <div class="detail-value">Электронная почта: {{ user.email }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Всего отправленных проблем</div>
              <div class="problem-count">{{ user.totalProblems }}</div>
            </div>
          </div>
          <RouterLink to="/report" class="btn-report">Cообщить о проблеме</RouterLink>
        </section>

        <section class="problems-section">
          <h2 class="section-title">Все проблемы пользователя</h2>
          <ul class="all__problems-list">
            <li v-for="problem in user.problems" :key="problem.id" class="all__problems-list-item">
              <ProblemInfo :key="problem.id" v-bind="problem" :author="user" />
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>

</template>