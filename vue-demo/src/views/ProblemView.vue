<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import { getProblemById, updateProblemStatus, addVoteToProblem, addCommentToProblem } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'

const { params } = useRoute()
const router = useRouter()
const auth = useAuth()
const userStore = useUser()

watchEffect(() => {
  if (!auth.token) {
    router.push('/login')
  }
})

const { 
  data: problem, 
  error, 
  isPending, 
  isError, 
  refetch: refetchProblem 
} = useQuery({
  queryKey: ['problem', params.id, auth.token],
  queryFn: () => getProblemById(params.id, auth.token),
  retry: false,
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  refetchInterval: false,
  enabled: !!auth.token,
})

const isGov = computed(() => userStore.user?.role === 'gov')
const isUpdatingStatus = ref(false)
const statusError = ref(null)

const canVote = computed(() => {
  return problem.value && ['wait_for_solve', 'solving'].includes(problem.value.status)
})

const commentContent = ref('')
const isSubmittingComment = ref(false)
const commentError = ref(null)

const canComment = computed(() => {
  return isGov.value || ['mod', 'admin'].includes(userStore.user?.role)
})

const handleClaim = async () => {
  if (isUpdatingStatus.value) return
  isUpdatingStatus.value = true
  statusError.value = null
  try {
    await updateProblemStatus(problem.value.id, 'claim', auth.token)
    await refetchProblem()
  } catch (error) {
    console.error('Не удалось взять проблему в работу:', error)
    statusError.value = 'Ошибка при взятии проблемы в работу'
  } finally {
    isUpdatingStatus.value = false
  }
}

const handleResolve = async () => {
  if (isUpdatingStatus.value) return
  isUpdatingStatus.value = true
  statusError.value = null
  try {
    await updateProblemStatus(problem.value.id, 'resolve', auth.token)
    await refetchProblem()
  } catch (error) {
    console.error('Не удалось отметить проблему как решённую:', error)
    statusError.value = 'Ошибка при отметке проблемы как решённой'
  } finally {
    isUpdatingStatus.value = false
  }
}

const isVoting = ref(false)
const voteError = ref(null)

const handleVote = async (voteValue) => {
  if (!auth.token || !userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (!canVote.value) {
    voteError.value = 'Голосование недоступно для этой проблемы'
    return
  }

  try {
    isVoting.value = true
    voteError.value = null
    const currentVote = problem.value.vote || 0
    let voteDelta = 0

    if (currentVote === voteValue) {
      voteDelta = -voteValue
    } else {
      voteDelta = voteValue - currentVote
    }

    await addVoteToProblem(problem.value.id, voteValue, auth.token)
    problem.value.vote = voteValue
    problem.value.votes += voteDelta
    await refetchProblem()
  } catch (error) {
    console.error('Ошибка голосования:', error)
    voteError.value = 'Ошибка при голосовании'
  } finally {
    isVoting.value = false
  }
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    commentError.value = 'Комментарий не может быть пустым'
    return
  }

  try {
    isSubmittingComment.value = true
    commentError.value = null
    
    await addCommentToProblem(
      problem.value.id, 
      commentContent.value, 
      auth.token
    )
    
    commentContent.value = ''
    await refetchProblem()
  } catch (error) {
    console.error('Ошибка при отправке комментария:', error)
    commentError.value = 'Не удалось отправить комментарий'
  } finally {
    isSubmittingComment.value = false
  }
}
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
            :src="problem.images?.[0] || '../images/problem-img.jpg'" 
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
          <div v-if="isGov">
            <template v-if="problem.status === 'wait_for_solve'">
              <button 
                class="btn-answer"
                @click="handleClaim"
                :disabled="isUpdatingStatus"
              >
                Взяться за проблему
              </button>
            </template>
            <template v-else-if="problem.status === 'solving'">
              <button 
                class="btn-answer"
                @click="handleResolve"
                :disabled="isUpdatingStatus"
              >
                Отметить как решённую
              </button>
            </template>
            <template v-else-if="problem.status === 'solved'">
              <p>Проблема решена</p>
            </template>
            <div v-if="statusError" class="error-message" style="color: red; margin-top: 10px;">
              {{ statusError }}
            </div>
          </div>
          <div v-else>
            <p class="question-problem" style="margin-left: 210px">
              Стоит ли решать данную проблему?
            </p>
            <div class="problem__status">
              <div class="status-number">{{ problem.votes }} голосов</div>
              <div>
                <button 
                  class="btn-answer"
                  :class="{ 
                    active: problem.vote === 1,
                    disabled: !canVote
                  }"
                  @click="handleVote(1)"
                  :disabled="isVoting || !canVote"
                >
                  Да
                </button>
              </div>
              <div>
                <button 
                  class="btn-answer"
                  :class="{ 
                    active: problem.vote === -1,
                    disabled: !canVote
                  }"
                  @click="handleVote(-1)"
                  :disabled="isVoting || !canVote"
                >
                  Нет
                </button>
              </div>
            </div>
            <div v-if="voteError" class="error-message" style="color: red; margin-top: 10px;">
              {{ voteError }}
            </div>
          </div>
        </div>
      </section>

      <section class="second" v-if="canComment">
        <div class="comments-section">
          <div class="mynic-comments">
            <h1 class="main-text-mynic" style="margin-top: -40px;">
              Комментарии
            </h1>
            <div class="comments-list">
              <div 
                class="comment"
                v-for="comment in problem.comments"
                :key="comment.id"
              >
                <div class="comment-header">
                  <img 
                    :src="comment.author?.avatarUrl || '../images/user-png.png'" 
                    alt="user" 
                    class="comment-avatar"
                  >
                  <div class="comment-author-info">
                    <span class="comment-author">
                      {{ comment.author?.firstName }} {{ comment.author?.lastName }}
                      <span v-if="comment.author?.middleName">{{ comment.author.middleName }}</span>
                    </span>
                    <span class="comment-time">
                      {{ new Date(comment.createdAt).toLocaleTimeString() }}
                      {{ new Date(comment.createdAt).toLocaleDateString() }}
                    </span>
                  </div>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
            <div class="comment-form" style="margin-top: 30px; display: flex; gap: 15px;">
              <div class="comment-avatar-container">
                <img 
                  :src="userStore.user?.avatarUrl || '../images/user-png.png'" 
                  alt="Аватар" 
                  class="comment-avatar"
                  style="width: 40px; height: 40px; border-radius: 50%;"
                >
              </div>
              <div class="comment-input-wrapper" style="flex: 1;">
                <div class="comment-input-container">
                  <textarea 
                    v-model="commentContent"
                    placeholder="Добавьте комментарий..." 
                    class="mynic-comment-input"
                    style="width: 100%; padding: 10px; border: 1px solid black; border-radius: 4px; min-height: 80px;"
                    :disabled="isSubmittingComment"
                  ></textarea>
                </div>
                <div v-if="commentError" class="error-message" style="color: red; margin-top: 10px;">
                  {{ commentError }}
                </div>
                <div class="comment-buttons" style="display: flex; justify-content: flex-end; margin-top: 10px; gap: 10px; margin-bottom: 15px;">
                  <button 
                    class="comment-submit-btn" 
                    style="background: #3786BE; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer;"
                    @click="submitComment"
                    :disabled="isSubmittingComment || !commentContent.trim()"
                  >
                    <span class="comment-submit-link" style="color: white; text-decoration: none; font-size: 22px;">
                      {{ isSubmittingComment ? 'Отправка...' : 'Комментировать' }}
                    </span>
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