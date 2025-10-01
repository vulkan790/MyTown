<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getProblemById, moderateProblem, addVoteToProblem, addCommentToProblem, updateProblemStatus, getStaticMapUrl } from '@/api/client'
import AppHeader from '@/components/AppHeader.vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { useUser } from '@/api/useUser'
import fallbackAvatar from '@/images/user-png.png'

const route = useRoute()
const userStore = useUser()
const problemId = ref(route.params.id)
const voteValue = ref(0)
const newComment = ref('')

const {
  data: problem,
  isPending,
  isError,
  error,
  refetch
} = useQuery({
  queryKey: ['problem', problemId],
  queryFn: () => getProblemById(problemId.value),
  enabled: !!problemId.value
})

const voteMutation = useMutation({
  mutationFn: (vote) => addVoteToProblem(problemId.value, vote),
  onSuccess: () => {
    refetch()
  },
  onError: (error) => {
    alert('Ошибка при голосовании: ' + error.message)
  }
})

const commentMutation = useMutation({
  mutationFn: () => addCommentToProblem(problemId.value, newComment.value),
  onSuccess: () => {
    newComment.value = ''
    refetch()
  },
  onError: (error) => {
    alert('Ошибка при добавлении комментария: ' + error.message)
  }
})

const statusMutation = useMutation({
  mutationFn: (action) => updateProblemStatus(problemId.value, action),
  onSuccess: () => {
    refetch()
    alert('Статус проблемы успешно обновлен!')
  },
  onError: (error) => {
    alert('Ошибка при изменении статуса: ' + error.message)
  }
})

const statusNames = {
  'wait_for_solve': 'В ожидании решения',
  'solving': 'В процессе решения',
  'solved': 'Решено',
  'rejected': 'Отклонено',
  'on_moderation': 'На модерации'
}

const formatDate = (dateString) => {
  if (!dateString)
   return ''
  const date = new Date(dateString + 'Z') 
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow' 
  }) + ' ' + date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow'
  })
}

const moderate = async (decision) => {
  try {
    await moderateProblem(problemId.value, decision)
    await refetch()
    alert(decision === 'approve' ? 'Проблема одобрена' : 'Проблема отклонена')
  } catch (error) {
    console.error('Ошибка модерации:', error)
    alert('Ошибка при выполнении модерации: ' + error.message)
  }
}

const handleStatusChange = (action) => {
  if (!userStore.isLoggedIn) {
    alert('Для изменения статуса необходимо авторизоваться')
    return
  }
  statusMutation.mutate(action)
}

const handleVote = (vote) => {
  if (!userStore.isLoggedIn) {
    alert('Для голосования необходимо авторизоваться')
    return
  }
  const newVote = userVote.value === vote ? 0 : vote
  voteMutation.mutate(newVote)
}

const handleAddComment = () => {
  if (!userStore.isLoggedIn) {
    alert('Для добавления комментария необходимо авторизоваться')
    return
  }
  if (!newComment.value.trim()) {
    alert('Комментарий не может быть пустым')
    return
  }
  commentMutation.mutate()
}

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl)
   return fallbackAvatar
  if (avatarUrl.startsWith('/'))
    return `${import.meta.env.VITE_API_URL || ''}${avatarUrl}`
  
  return avatarUrl
}

const handleImageError = (event) => {
  event.target.src = fallbackAvatar
}

const handleMapError = (event) => {
  console.error('Error loading map image')
  event.target.style.display = 'none'
}

const canModerate = computed(() => {
  return userStore.isLoggedIn && ['admin', 'mod'].includes(userStore.user?.role)
})

const isGovUser = computed(() => {
  return userStore.isLoggedIn && userStore.user?.role === 'gov'
})

const isRegularUser = computed(() => {
  return userStore.isLoggedIn && userStore.user?.role === 'user'
})

const canVote = computed(() => {
  const isProblemSolved = problem.value?.status === 'solved'
  return (isRegularUser.value || isGovUser.value) && !isProblemSolved
})

const canComment = computed(() => {
  return userStore.isLoggedIn && ['admin', 'mod', 'gov'].includes(userStore.user?.role)
})

const isOnModeration = computed(() => {
  return problem.value?.status === 'on_moderation'
})

const canClaimProblem = computed(() => {
  return isGovUser.value && problem.value?.status === 'wait_for_solve'
})

const canResolveProblem = computed(() => {
  return isGovUser.value && problem.value?.status === 'solving'
})

const isProblemSolved = computed(() => {
  return problem.value?.status === 'solved'
})

const userVote = computed(() => {
  return problem.value?.vote || 0
})

const totalVotes = computed(() => {
  return problem.value?.votes || 0
})

const isYesActive = computed(() => {
  return userVote.value === 1
})

const isNoActive = computed(() => {
  return userVote.value === -1
})

const mapUrl = computed(() => {
  if (problem.value?.address) {
    return getStaticMapUrl(problem.value.address, 600, 300, 15)
  }
  return ''
})
</script>

<template>
  <AppHeader />

  <main class="main-problem">
    <div class="container">
      <template v-if="isPending">
        <div class="loading">Загрузки проблемы...</div>
      </template>
      
      <template v-else-if="isError">
        <div class="error">Ошибка загрузки: {{ error.message }}</div>
      </template>
      
      <template v-else-if="problem">
        <div class="problem-page">
          <div class="problem-layout">
            <div class="left-column">
              <div class="map-block" v-if="mapUrl">
                <img 
                  :src="mapUrl" 
                  :alt="'Карта: ' + problem.address"
                  class="problem-map"
                  @error="handleMapError"
                />
                <div class="map-overlay">
                  <a :href="`https://yandex.ru/maps/?text=${encodeURIComponent(problem.address)}`" 
                     target="_blank" 
                     class="map-link">
                    Открыть в Яндекс Картах
                  </a>
                </div>
              </div>
              
              <div v-if="problem.images && problem.images.length" class="images-block">
                <img 
                  v-for="(image, index) in problem.images" 
                  :key="index" 
                  :src="image" 
                  :alt="'Изображение ' + (index + 1)" 
                  class="problem-image"
                  @error="handleImageError">
              </div>
              
              <div class="author-block">
                <img 
                  :src="getAvatarUrl(problem.author?.avatarUrl)" 
                  class="author-avatar" 
                  alt="Аватар"
                  @error="handleImageError">
                <div class="author-info">
                  <h3 class="author-name">
                    {{ problem.author?.firstName || 'Аноним' }} 
                    {{ problem.author?.lastName || '' }} 
                    {{ problem.author?.middleName || '' }}
                  </h3>
                  <div class="problem-status-badge" :class="problem.status">
                    {{ statusNames[problem.status] || problem.status }}
                  </div>
                </div>
              </div>
            </div>

            <div class="right-column">
              <h2 class="title-address">Адрес</h2>
              <p class="text-address">{{ problem.address }}</p>

              <h2 class="title-address">Описание</h2>
              <p class="text-address">{{ problem.description }}</p>

              <template v-if="canVote && !isProblemSolved">
                <h3 class="question-problem">Стоит ли решать данную проблему?</h3>
                <div class="problem__status">
                  <div class="votes-counter">
                    <span class="votes-label">Голосов:</span>
                    <span class="votes-number" :class="{ positive: totalVotes > 0, negative: totalVotes < 0 }">
                      {{ totalVotes }}
                    </span>
                  </div>
                  <div class="vote-buttons">
                    <button 
                      @click="handleVote(1)" 
                      :class="['btn-answer', { active: isYesActive }]">
                      {{ 'Да' }}
                    </button>
                    <button 
                      @click="handleVote(-1)" 
                      :class="['btn-answer', { active: isNoActive }]">
                      {{ 'Нет' }}
                    </button>
                  </div>
                </div>
              </template>

              <div v-if="isProblemSolved" class="voting-closed-message">
                <h3>Голосование завершено</h3>
                <p>Проблема решена. Голосование больше недоступно.</p>
                <div class="final-votes">
                  <span class="votes-label">Итоговое количество голосов:</span>
                  <span class="votes-number" :class="{ positive: totalVotes > 0, negative: totalVotes < 0 }">
                    {{ totalVotes }}
                  </span>
                </div>
              </div>

              <template v-if="canModerate && isOnModeration">
                <div class="moderation-buttons">
                  <h3>Модерация проблемы</h3>
                  <button @click="moderate('approve')" class="btn-moderate approve">Одобрить</button>
                  <button @click="moderate('reject')" class="btn-moderate reject">Отклонить</button>
                </div>
              </template>
              
              <template v-if="isGovUser">
                <div class="gov-buttons">
                  <h3>Управление проблемой</h3>
                  <button 
                    v-if="canClaimProblem" 
                    @click="handleStatusChange('claim')" 
                    class="btn-gov claim">
                    Взять в работу
                  </button>
                  <button 
                    v-if="canResolveProblem" 
                    @click="handleStatusChange('resolve')" 
                    class="btn-gov resolve">
                    Проблема решена
                  </button>
                  <div v-if="problem.status === 'solved'" class="problem-solved-badge">
                    ✅ Проблема решена
                  </div>
                </div>
              </template>
            </div>
          </div>

          <section class="mynic-comments">
            <h2 class="main-text-mynic">Комментарии муниципалитета</h2>
            
            <div v-if="problem.comments && problem.comments.length" class="comments-list">
              <div v-for="comment in problem.comments" :key="comment.id" class="comment">
                <div class="comment-header">
                  <div class="comment-author-avatar-container">
                    <img 
                      :src="getAvatarUrl(comment.author?.avatarUrl)" 
                      class="comment-author-avatar"
                      alt="Аватар"
                      @error="handleImageError">
                  </div>
                  <div class="comment-author-info">
                    <span class="comment-author">
                      {{ comment.author.firstName }} 
                      {{ comment.author.lastName || '' }}
                      {{ comment.author.middleName || '' }}
                    </span>
                    <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>

            <div v-if="canComment" class="mynic-comment-box">
              <div class="comment-avatar-container">
                <img 
                  :src="getAvatarUrl(userStore.user?.avatarUrl)" 
                  class="comment-author-avatar"
                  alt="Аватар"
                  @error="handleImageError">
              </div>
              <div class="comment-input-wrapper">
                <div class="comment-input-container">
                  <textarea 
                    v-model="newComment" 
                    placeholder="Добавить комментарий..." 
                    class="mynic-comment-input"
                    rows="3"></textarea>
                </div>
                <div class="comment-buttons">
                  <button 
                    @click="handleAddComment" 
                    class="comment-submit-btn">
                    <span class="comment-submit-link">
                      Добавить комментарий
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
      
      <template v-else>
        <div class="not-found">Проблема не найдена</div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.problem-page {
  padding: 20px 0;
}

.problem-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 30px;
}

.left-column {
  flex: 1;
  min-width: 300px;
  max-width: 500px;
}

.right-column {
  flex: 1;
  min-width: 300px;
}

.map-block {
  position: relative;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.problem-map {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.map-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.map-link {
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  color: #000;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.map-link:hover {
  background: rgba(255, 255, 255, 1);
}

.images-block {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.problem-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.author-block {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.author-name {
  font-weight: normal;
  margin: 0;
  font-size: 1.1rem;
  color: #000;
}

.problem-status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.problem-status-badge.wait_for_solve {
  background-color: #fff3cd;
  color: #856404;
}

.problem-status-badge.solving {
  background-color: #d1ecf1;
  color: #0c5460;
}

.problem-status-badge.solved {
  background-color: #d4edda;
  color: #155724;
}

.problem-status-badge.rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.problem-status-badge.on_moderation {
  background-color: #e2e3e5;
  color: #383d41;
}

.title-address {
  margin-top: 0;
  margin-bottom: 10px;
  color: #000;
}

.text-address {
  margin-top: 0;
  margin-bottom: 20px;
  line-height: 1.5;
  color: #000;
}

.question-problem {
  text-align: center;
  justify-content: center;
  display: flex;
  margin-top: 25px;
  margin-bottom: 15px;
  margin-left: -5px;
  color: #000;
  font-size: 18px;
  font-weight: 600;
}

.problem__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.votes-counter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  justify-content: center;
}

.votes-label {
  font-weight: 500;
  color: #000;
}

.votes-number {
  font-weight: bold;
  padding: 5px 12px;
  background-color: #f0f0f0;
  min-width: 50px;
  text-align: center;
}

.votes-number.positive {
  color: #4CAF50;
  background-color: #f0f9f0;
}

.votes-number.negative {
  color: #f44336;
  background-color: #fef0f0;
}

.vote-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-answer {
  padding: 10px 20px;
  height: 50px;
  width: 100px;
  background-color: #2c6c9a;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-answer:hover {
  background-color: #1d4e6f;
}

.btn-answer.active {
  background-color: #4CAF50;
}

.btn-answer.active:last-of-type {
  background-color: #f44336;
}

.btn-answer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voting-closed-message {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.voting-closed-message h3 {
  color: #6c757d;
  margin-bottom: 10px;
}

.voting-closed-message p {
  color: #6c757d;
  margin-bottom: 15px;
}

.final-votes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
}

.moderation-buttons,
.gov-buttons {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.moderation-buttons h3,
.gov-buttons h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #000;
}

.btn-moderate {
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  margin-right: 10px;
  border: 1px solid;
  background: white;
  border-radius: 4px;
}

.btn-moderate.approve {
  color: #4CAF50;
  border-color: #4CAF50;
}

.btn-moderate.approve:hover {
  background-color: #4CAF50;
  color: white;
}

.btn-moderate.reject {
  color: #f44336;
  border-color: #f44336;
}

.btn-moderate.reject:hover {
  background-color: #f44336;
  color: white;
}

.btn-gov {
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  margin-right: 10px;
  border: 1px solid;
  background: white;
  border-radius: 4px;
  font-weight: 500;
}

.btn-gov.claim {
  color: #2196F3;
  border-color: #2196F3;
}

.btn-gov.claim:hover:not(:disabled) {
  background-color: #2196F3;
  color: white;
}

.btn-gov.resolve {
  color: #4CAF50;
  border-color: #4CAF50;
}

.btn-gov.resolve:hover:not(:disabled) {
  background-color: #4CAF50;
  color: white;
}

.btn-gov:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.problem-solved-badge {
  padding: 10px 15px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  font-weight: 500;
}

.mynic-comments {
  margin-top: 40px;
  padding-top: 20px;
  max-width: 800px;
  margin-left: 0;
  margin-right: auto;
}

.main-text-mynic {
  margin-bottom: 20px;
  color: #000;
  text-align: left;
}

.comments-list {
  margin-bottom: 30px;
}

.comment {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-author-avatar-container {
  flex-shrink: 0;
}

.comment-author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-author {
  font-weight: 500;
  color: #000;
}

.comment-time {
  font-size: 12px;
  color: #666;
}

.comment-text {
  margin: 0;
  line-height: 1.5;
  color: #000;
  padding-left: 52px;
}

.mynic-comment-box {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  max-width: 100%;
}

.comment-avatar-container {
  flex-shrink: 0;
}

.comment-input-wrapper {
  flex-grow: 1;
  max-width: 600px;
}

.comment-input-container {
  margin-bottom: 10px;
}

.mynic-comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  max-width: 100%;
}

.mynic-comment-input:focus {
  outline: none;
  border-color: #2c6c9a;
}

.comment-buttons {
  display: flex;
  justify-content: flex-end;
}

.comment-submit-btn {
  padding: 8px 16px;
  background-color: #2c6c9a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.comment-submit-btn:hover:not(:disabled) {
  background-color: #1d4e6f;
}

.comment-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-submit-link {
  font-size: 14px;
}

.loading, .error, .not-found {
  padding: 40px 0;
  text-align: center;
  font-size: 18px;
}

.error {
  color: #f44336;
}
</style>