<script setup>

import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '@/api/client'

import AppHeaderWithGradient from '@/components/AppHeaderWithGradient.vue'
import EyeClosed from '@/images/EyeClosed.png'
import EyeOpened from '@/images/EyeOpened.png'

const route = useRoute()
const router = useRouter()
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const email = ref(route.query.email || '')

const validateForm = () => {
  if (!code.value.trim()) {
    errorMessage.value = 'Пожалуйста, введите код подтверждения'
    return false
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return false
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Пароли не совпадают'
    return false
  }
  return true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    if (!validateForm()) return

    await resetPassword(email.value, code.value, newPassword.value)
    router.push('/login')
    
  } catch (error) {
    console.error('Ошибка:', error)
    errorMessage.value = error.message || 'Произошла ошибка при сбросе пароля'
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
          <p class="main-text-login"><strong>Сброс пароля!</strong></p>
          <p class="second-text">Введите новый пароль и подтвердите его</p>
        </div>

        <div class="process-auth">
          <form @submit.prevent="handleSubmit">
            <div class="form-group password-group">
              <label>Пароль</label>
              <div class="password-input-wrapper">
                <input 
                  v-model.trim="password"
                  :type="isPasswordVisible ? 'text' : 'password'" 
                  placeholder="Введите пароль" 
                  class="form-control"/>
                <button 
                  type="button" 
                  class="toggle-password" 
                  @click="togglePasswordVisibility" 
                  aria-label="Показать пароль">
                  <img 
                    :src="isPasswordVisible ? EyeOpened : EyeClosed" 
                    :style="{height: isPasswordVisible ? '25px' : '30px'}"
                    alt="Иконка глаза" 
                    class="eye-icon"/>
                </button>
              </div>
            </div>

            <div class="form-group password-group">
              <label>Подтвердите пароль</label>
              <div class="password-input-wrapper">
                <input 
                  v-model.trim="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'" 
                  placeholder="Повторите пароль" 
                  class="form-control"/>
                <button 
                  type="button" 
                  class="toggle-password" 
                  @click="toggleConfirmPasswordVisibility" 
                  aria-label="Показать пароль">
                  <img 
                    :src="isConfirmPasswordVisible ? EyeOpened : EyeClosed" 
                    :style="{height: isConfirmPasswordVisible ? '25px' : '30px'}"
                    alt="Иконка глаза" 
                    class="eye-icon"/>
                </button>
              </div>
            </div>
            
            <div class="agreement-section">
              <div class="register-container">
                <button 
                  type="submit" 
                  class="next-btn"
                  style="border: none"
                  :disabled="isSubmitting">
                  <span class="next-link">
                    {{ isSubmitting ? 'Сохранение...' : 'Сохранить пароль' }}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>

</template>