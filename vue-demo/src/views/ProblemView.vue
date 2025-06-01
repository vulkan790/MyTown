<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import { getProblemById } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'

const { params } = useRoute()
const auth = useAuth()
const userStore = useUser()

const { data: problem, error, isPending, isError } = useQuery({
  queryKey: ['problem', params.id, auth.token],
  queryFn: () => getProblemById(params.id, auth.token),
  retry: false,
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
})

const isGovOrMod = computed(() => {
  if (!userStore.user) return false
  return ['gov', 'mod', 'admin'].includes(userStore.user.role)
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

      <section class="second" v-if="isGovOrMod">
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

            <div class="comment-form" style="margin-top: 30px; display: flex; gap: 15px;">
              <div class="comment-avatar-container">
                <img 
                  src="../images/user-png.png" 
                  alt="Аватар" 
                  class="comment-avatar"
                  style="width: 40px; height: 40px; border-radius: 50%;"
                >
              </div>
              <div class="comment-input-wrapper" style="flex: 1;">
                <div class="comment-input-container">
                  <textarea 
                    placeholder="Добавьте комментарий..." 
                    class="mynic-comment-input"
                    style="width: 100%; padding: 10px; border: 1px solid black; border-radius: 4px; min-height: 80px;"
                  ></textarea>
                </div>
                <div class="comment-buttons" style="display: flex; justify-content: flex-end; margin-top: 10px; gap: 10px; margin-bottom: 15px;">
                  <button class="comment-submit-btn" style="background: #3786BE; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer;">
                    <a class="comment-submit-link" style="color: white; text-decoration: none; font-size: 22px;">Комментировать</a>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

</template>