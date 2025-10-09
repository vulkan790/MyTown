<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUser } from '@/api/useUser'
import AppHeader from '@/components/AppHeader.vue'
import ProblemInfo from '@/components/ProblemCard.vue'
import { uploadUserAvatar, getCurrentUser } from '@/api/client'

const { user } = storeToRefs(useUser())
const userStore = useUser()
const fileInput = ref(null)
const isUploading = ref(false)
const uploadError = ref(null)

const isGov = computed(() => user.value?.role === 'gov')
const isModOrAdmin = computed(() => ['mod', 'admin'].includes(user.value?.role))
const isRegularUser = computed(() => user.value?.role === 'user' || !user.value)

const solvedProblems = computed(() => {
  if (!user.value?.problems) return []
  return user.value.problems.filter(problem => problem.status === 'solved')
})

const allProblems = computed(() => {
  if (!user.value?.problems) return []
  return user.value.problems
})

const solvingProblems = computed(() => {
  if (!user.value?.problems) return []
  return user.value.problems.filter(problem => problem.status === 'solving')
})

const solvedProblemsCount = computed(() => solvedProblems.value.length)

const totalProblemsCount = computed(() => allProblems.value.length)

const solvingProblemsCount = computed(() => solvingProblems.value.length)

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl)
    return new URL('@/images/Profile.svg', import.meta.url).href
  
  return avatarUrl
}

const handleImageError = (event) => {
  event.target.src = new URL('@/images/Profile.svg', import.meta.url).href
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) 
    return
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) 
  {
    uploadError.value = 'Пожалуйста, выберите изображение в формате JPG, JPEG, PNG или WEBP'
    return
  }
  
  if (file.size > 5 * 1024 * 1024) 
  {
    uploadError.value = 'Файл слишком большой (максимум 5MB)'
    return
  }
  
  isUploading.value = true
  uploadError.value = null
  
  try 
  {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadUserAvatar(formData)
    
    if (userStore.refetch)
      await userStore.refetch()
    else 
    {
      const freshUserData = await getCurrentUser()
      user.value = freshUserData
    }
    
    if (fileInput.value)
      fileInput.value.value = ''
    alert('Аватар успешно обновлен!')
  } 
  catch (error) 
  {
    console.error('Ошибка загрузки аватара:', error)
    
    if (error.message === 'Authorization required')
      uploadError.value = 'Требуется авторизация'
    else if (error.message.includes('too_large_file'))
      uploadError.value = 'Файл слишком большой (максимум 5MB)'
    else if (error.message.includes('Invalid file format'))
      uploadError.value = 'Неверный формат файла. Разрешены только JPG, JPEG, PNG, WEBP'
    else
      uploadError.value = error.message || 'Ошибка загрузки файла'
  } 
  finally 
  {
    isUploading.value = false
  }
}
</script>

<template>
  <AppHeader />

  <main class="main">
    <div class="container">
      <div class="profile-layout">
        <section class="profile-auth">
          <div class="profile-header">
            <h1>Личные данные:</h1>
            <div class="avatar-wrapper">
              <div class="avatar-container">
                <img 
                  v-if="user?.avatarUrl"
                  :src="getAvatarUrl(user.avatarUrl)"
                  alt="Profile"
                  class="user-logo"
                  @error="handleImageError">
                <img
                  v-else
                  src="@/images/Profile.svg"
                  alt="Default Profile"
                  class="user-logo default-avatar">
                <div v-if="isUploading" class="upload-overlay">
                  <div class="upload-spinner"></div>
                </div>
              </div>
            </div>
            <div class="profile-info">
              <input
                ref="fileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                @change="handleFileUpload"
                class="file-input"
                hidden>
              <button 
                @click="triggerFileInput" 
                class="change-photo-btn"
                :disabled="isUploading">
                {{ isUploading ? 'Загрузка...' : 'Добавить/Изменить фото' }}
              </button>
              <div class="file-formats">Допустимые форматы: JPG, JPEG, PNG, WEBP (макс. 5MB)</div>
              <div v-if="uploadError" class="upload-error">
                {{ uploadError }}
              </div>
            </div>
          </div>

          <div class="profile-details">
            <div class="detail-label">ФИО</div>
            <div class="detail-value">{{ user.lastName }} {{ user.firstName }} {{ user.middleName }}</div>
            
            <div class="detail-item">
              <div class="detail-label">Почта</div>
              <div class="detail-value">{{ user.email }}</div>
            </div>
          </div>
          
          <RouterLink 
            v-if="isRegularUser" 
            to="/report" 
            class="btn-report">
            Cообщить о проблеме
          </RouterLink>
        </section>

        <section 
          v-if="!isModOrAdmin"
          class="problems-section">
          <h2 class="section-title">
            Все проблемы пользователя
          </h2>
          
          <ul class="all__problems-list">
            <li 
              v-for="problem in (isGov ? solvedProblems : user.problems)" 
              :key="problem.id" 
              class="all__problems-list-item">
              <ProblemInfo :key="problem.id" v-bind="problem" :author="user" />
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border: 3px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-logo {
  width: 100%;
  height: 100%;
  object-fit: contain; 
  padding: 4px;
  box-sizing: border-box;
}

.default-avatar {
  width: 80%;
  height: 80%;
  object-fit: contain;
  padding: 0;
  background: transparent;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.change-photo-btn {
  background: #3786BE;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 16px;
  transition: background-color 0.2s ease;
}

.change-photo-btn:hover:not(:disabled) {
  background: #2c6b9d;
}

.change-photo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-formats {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
}

.upload-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  max-width: 250px;
}

.file-input {
  display: none;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.profile-header h1 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.profile-details {
  margin-bottom: 24px;
}

.detail-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.detail-value {
  color: #666;
  margin-bottom: 16px;
}

.detail-item {
  margin-bottom: 16px;
}

.problem-count {
  font-size: 18px;
  font-weight: 600;
  color: #3786BE;
}

.btn-report {
  display: inline-block;
  background: #3786BE;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.2s;
}

.btn-report:hover {
  background: #2c6b9d;
}

.problems-section {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.all__problems-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.all__problems-list-item {
  margin-bottom: 16px;
}
</style>