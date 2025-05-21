<script setup>
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import { getProblemById } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import AppHeader from '@/components/AppHeader.vue'

const { params } = useRoute()
const auth = useAuth()

const { data: problem, error, isPending, isError } = useQuery({
  queryKey: ['problem', params.id, auth.token],
  queryFn: () => getProblemById(params.id, auth.token),

  retry: false,
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
})
</script>

<template>
  <AppHeader />

  <main class="main" v-if="isPending">Загрузка проблемы...</main>
  <main class="main" v-else-if="isError">Проблема не найдена</main>
  <main class="main" v-else-if="problem">
    <div class="container">
      <section class="first">
        <div class="left-problem">
          <img 
            :src="problem.imageUrl || '../images/problem-img.jpg'" 
            alt="Проблема" 
            class="first__photo"
            style="width: 550px; margin-top: 100px;"
          >
          <div class="group__statusbar-user">
            <img 
              src="../images/user-png.png" 
              alt="user" 
              class="group__statusbar-user-logo"
            >
            <span class="group__statusbar-user-name">
              {{ problem.author?.firstName }} {{ problem.author?.lastName }}
            </span>
          </div>
        </div>
        <div class="right-problem">
          <div class="problem__address">
            <h2 class="title-address">Адрес</h2>
            <p class="text-address">{{ problem.address }}</p>
          </div>
          <div class="problem__description">
            <h2 class="title-address">Описание</h2>
            <p class="text-address">{{ problem.description }}</p>
          </div>
          <p class="question-problem" style="margin-left: 210px">
            Стоит ли решать данную проблему?
          </p>
          <div class="problem__status">
            <li class="status-number">{{ problem.votesCount }} голосов</li>
            <li class="btn-answer">Да</li>
            <li class="btn-answer">Нет</li>
          </div>
        </div>
      </section>

      <section class="second">
        <div class="comments-section">
          <div class="mynic-comments">
            <h1 class="main-text-mynic" style="margin-top: 180px;">
              Комментарии муниципалитета
            </h1>
            <div class="comments-list">
              <div 
                class="comment"
                v-for="comment in problem.comments"
                :key="comment.id"
              >
                <div class="comment-header">
                  <img 
                    src="../images/user-png.png" 
                    alt="user" 
                    class="comment-avatar"
                  >
                  <div class="comment-author-info">
                    <span class="comment-author">
                      {{ comment.author?.firstName }} {{ comment.author?.lastName }}
                    </span>
                    <span class="comment-time">
                      {{ new Date(comment.createdAt).toLocaleTimeString() }}
                      {{ new Date(comment.createdAt).toLocaleDateString() }}
                    </span>
                  </div>
                </div>
                <p class="comment-text">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <AppFooter />
</template>