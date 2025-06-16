<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { requestPasswordReset } from '@/api/client'

import AppHeaderWithGradient from '@/components/AppHeaderWithGradient.vue'

const router = useRouter()
const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const validateEmail = () => {
  if (!email.value.trim()) {
    errorMessage.value = 'Пожалуйста, введите email'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errorMessage.value = 'Пожалуйста, введите корректный email'
    return false
  }
  return true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    if (!validateEmail()) return

    await requestPasswordReset(email.value)
    router.push({ 
      path: '/remember-code', 
      query: { email: email.value } 
    })
    
  } catch (error) {
    console.error('Ошибка:', error)
    errorMessage.value = error.message || 'Произошла ошибка при отправке'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template> 
  <AppHeaderWithGradient />

  <main class="main" style="background: linear-gradient(to left, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
    <div class="container">
      <section class="reg-container">
        <div class="login-section-in">
          <p class="main-text-login"><strong>Почта, на которую пришлём сообщение!</strong></p>
          <p class="second-text">Введите почту, чтобы мы могли восстановить пароль.</p>
        </div>

        <div class="process-auth">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Восстановление пароля</label>
              <input
                v-model.trim="email"
                type="email"
                placeholder="Введите email">
              <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            </div>
            
            <div class="agreement-section">
              <div class="register-container">
                <button 
                  type="submit" 
                  class="next-btn"
                  :disabled="isSubmitting"
                  style="border: none;">
                  <span class="next-link">
                    {{ isSubmitting ? 'Отправка...' : 'Далее' }}
                  </span>
                </button>
                <router-link to="/login" class="login-title" style="margin-bottom: 525px; margin-top: 40px">Вернуться в авторизацию</router-link>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>
  
</template>