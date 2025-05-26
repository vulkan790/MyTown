<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeaderWithGradient from '@/components/AppHeaderWithGradient.vue'

const router = useRouter()
const email = ref('')
const isSubmitting = ref(false)

const validateEmail = () => {
  if (!email.value.trim()) {
    alert('Пожалуйста, введите email')
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    alert('Пожалуйста, введите корректный email')
    return false
  }
  return true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    if (!validateEmail()) return

    console.log('Email для восстановления:', email.value)
    router.push('/remember-code')
    
  } catch (error) {
    console.error('Ошибка:', error)
    alert(error.message || 'Произошла ошибка при отправке')
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
          <p class="main-text-login"><strong>Почта, на которую пришлём код!</strong></p>
          <p class="second-text">Введите почту, чтобы мы могли восстановить пароль.</p>
        </div>

        <div class="process-auth">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Восстановление пароля</label>
              <input
                v-model.trim="email"
                type="email"
                placeholder="Введите email"
              >
            </div>
            
            <div class="agreement-section">
              <div class="register-container">
                <button 
                  type="submit" 
                  class="next-btn"
                  :disabled="isSubmitting">
                  <span class="next-link">
                    {{ isSubmitting ? 'Отправка...' : 'Далее' }}
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