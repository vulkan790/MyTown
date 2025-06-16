<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyEmail } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import { useUser } from '@/api/useUser'

import AppHeaderWithGradientReg from '@/components/AppHeaderWithGradientReg.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const userStore = useUser()

const token = ref(route.query.token || '')
const message = ref('')
const isSuccess = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  if (!token.value) {
    message.value = 'Токен подтверждения отсутствует в URL.'
    isLoading.value = false
    return
  }

  try {
    await verifyEmail(token.value)
    
    // Обновляем данные пользователя если он залогинен
    if (auth.token) {
      await userStore.refetch()
    }

    isSuccess.value = true
    message.value = 'Ваш email успешно подтвержден!'
  } catch (error) {
    let errorMessage = 'Произошла неизвестная ошибка. Попробуйте позже.'
    
    if (error.name === 'HTTPError') {
      try {
        const errorData = await error.response.json()
        if (errorData.error === 'token_expired') {
          errorMessage = 'Срок действия токена истек. Пожалуйста, запросите новую ссылку.'
        } else if (errorData.error === 'invalid_token') {
          errorMessage = 'Неверный токен подтверждения.'
        }
      } catch {
        // Ошибка парсинга ответа
      }
    }
    
    message.value = errorMessage
    isSuccess.value = false
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AppHeaderWithGradientReg />
    
    <main class="main" style="background: linear-gradient(to right, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
      <div class="container">
        <div class="verify-email-layout">
          <section class="reg-container">
            <div class="verify-email-card">
              <div v-if="isLoading" class="loading-section">
                <div class="spinner"></div>
                <p>Подтверждение email...</p>
              </div>

              <div v-else class="result-section">
                <div v-if="isSuccess" class="success-result">
                  <h2 class="success-title">✓✓✓ Подтверждение успешно! ✓✓✓</h2>
                  <p class="success-message">{{ message }}</p>
                </div>

                <div v-else class="error-result">
                  <h2 class="error-title">!!! Ошибка подтверждения !!!</h2>
                  <p class="error-message">{{ message }}</p>
                </div>

                <div class="verify-actions">
                  <router-link 
                    v-if="isSuccess && !auth.token"
                    to="/login" 
                    class="btn-login"
                    style="color: white; border: none; font-size: 20px;">
                    Войти в систему
                  </router-link>
                  
                  <router-link 
                    v-if="isSuccess"
                    to="/" 
                    class="btn-login"
                    style="color: white; border: none; font-size: 20px;">
                    На главную
                  </router-link>
                  
                  <router-link 
                    v-if="!isSuccess"
                    to="/registration" 
                    class="register-btn"
                    style="color: white; border: none; font-size: 20px;">
                    Зарегистрироваться
                  </router-link>
                </div>
              </div>
            </div>
          </section>
          <div class="login-section">
            <p class="main-text"><strong>Пользователь!</strong></p>
            <p class="second-text">Если вы на этой странице, то вы зарегистрировались, просто нажмите на кнопку зарегистрироваться.</p>
          </div>
        </div>
      </div>
    </main>

</template>