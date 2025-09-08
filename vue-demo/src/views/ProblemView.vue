<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getProblemById, moderateProblem } from '@/api/client'
import AppHeader from '@/components/AppHeader.vue'
import { useQuery } from '@tanstack/vue-query'
import { useUser } from '@/api/useUser'

const route = useRoute()
const userStore = useUser()
const problemId = ref(route.params.id)

const {
  data: problem,
  isPending,
  isError,
  error,
  refetch
} = useQuery({
  queryKey: ['problem', problemId],
  queryFn: () => getProblemById(problemId.value, userStore.user?.token),
  enabled: !!problemId.value
})

const statusNames = {
  'wait_for_solve': 'В ожидании решения',
  'solving': 'В процессе решения',
  'solved': 'Решено',
  'rejected': 'Отклонено',
  'on_moderation': 'На модерации'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const moderate = async (decision) => {
  try {
    await moderateProblem(problemId.value, decision, userStore.user?.token)
    await refetch()
    alert(decision === 'approve' ? 'Проблема одобрена' : 'Проблема отклонена')
  } catch (error) {
    console.error('Ошибка модерации:', error)
    alert('Ошибка при выполнении модерации: ' + error.message)
  }
}

const canModerate = computed(() => {
  return userStore.isLoggedIn && ['admin', 'mod'].includes(userStore.user?.role)
})

const isOnModeration = computed(() => {
  return problem.value?.status === 'on_moderation'
})
</script>

<template>
  <AppHeader />

  <main class="main">
    <div class="container">
      <template v-if="isPending">
        <div class="loading">Загрузка проблемы...</div>
      </template>
      
      <template v-else-if="isError">
        <div class="error">Ошибка загрузки: {{ error.message }}</div>
      </template>
      
      <template v-else-if="problem">
        <section class="problem-detail">
          <h1 class="problem-title">{{ problem.title }}</h1>
          
          <div v-if="canModerate && isOnModeration" class="moderation-buttons">
            <button @click="moderate('approve')" class="btn-approve">✓ Принять проблему</button>
            <button @click="moderate('reject')" class="btn-reject">✗ Отклонить проблему</button>
          </div>
          
          <div class="problem-meta">
            <div class="problem-author">
              <img 
                :src="problem.author?.avatarUrl || '/src/images/user-png.png'" 
                alt="Автор" 
                class="author-avatar">
              <span class="author-name">{{ problem.author?.firstName || 'Аноним' }}</span>
            </div>
            <div class="problem-status">{{ statusNames[problem.status] || problem.status }}</div>
            <div class="problem-date">{{ formatDate(problem.createdAt) }}</div>
            <div class="problem-votes">Голосов: {{ problem.votes }}</div>
          </div>
          
          <div class="problem-content">
            <p class="problem-description">{{ problem.description }}</p>
            
            <div v-if="problem.images && problem.images.length" class="problem-images">
              <img 
                v-for="(image, index) in problem.images" 
                :key="index" 
                :src="image" 
                :alt="'Изображение ' + (index + 1)" 
                class="problem-image">
            </div>
            
            <div class="problem-address" v-if="problem.address">
              <strong>Адрес:</strong> {{ problem.address }}
            </div>
          </div>
          
          <div class="problem-comments" v-if="problem.comments">
            <h3>Комментарии ({{ problem.comments.length }})</h3>
            
            <div v-if="problem.comments.length" class="comments-list">
              <div v-for="comment in problem.comments" :key="comment.id" class="comment">
                <div class="comment-author">
                  <img 
                    :src="comment.author.avatarUrl || '/src/images/user-png.png'" 
                    alt="Автор комментария" 
                    class="comment-avatar">
                  <span class="comment-author-name">
                    {{ comment.author.firstName }} 
                    {{ comment.author.lastName || '' }}
                    {{ comment.author.middleName || '' }}
                  </span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
                <div class="comment-date">{{ formatDate(comment.createdAt) }}</div>
              </div>
            </div>
            
            <div v-else class="no-comments">
              Комментариев пока нет
            </div>
          </div>
        </section>
      </template>
      
      <template v-else>
        <div class="not-found">Проблема не найдена</div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.moderation-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.btn-approve {
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-approve:hover {
  background-color: #45a049;
}

.btn-reject {
  padding: 12px 24px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-reject:hover {
  background-color: #da190b;
}

.problem-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
}

.problem-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

.problem-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.problem-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.problem-status {
  padding: 0.25rem 0.75rem;
  background-color: #e3f2fd;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.problem-date {
  color: #666;
  font-size: 0.9rem;
}

.problem-votes {
  padding: 0.25rem 0.75rem;
  background-color: #f3e5f5;
  border-radius: 20px;
  font-weight: 500;
}

.problem-content {
  margin-bottom: 2rem;
}

.problem-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #444;
}

.problem-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.problem-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.problem-address {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.problem-comments {
  border-top: 2px solid #e0e0e0;
  padding-top: 2rem;
  margin-top: 2rem;
}

.problem-comments h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.comment {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #fff;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-author-name {
  font-weight: 500;
  color: #333;
}

.comment-content {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: #444;
}

.comment-date {
  font-size: 0.8rem;
  color: #666;
}

.loading, .error, .not-found, .no-comments {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: #666;
}

.error {
  color: #d32f2f;
}

.not-found {
  color: #757575;
}
</style>