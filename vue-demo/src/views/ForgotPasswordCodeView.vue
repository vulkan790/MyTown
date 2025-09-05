<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeaderWithGradient from '@/components/AppHeaderWithGradient.vue'

const router = useRouter()
const code = ref('')
const isSubmitting = ref(false)

const validateCode = () => {
  if (!code.value.trim()) {
    alert('Пожалуйста, введите код подтверждения')
    return false
  }
  return true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    if (!validateCode()) return

    console.log('Введенный код:', code.value)
    router.push('/reset-password')
    
  } catch (error) {
    console.error('Ошибка:', error)
    alert(error.message || 'Произошла ошибка при проверке кода')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template> 
  <AppHeaderWithGradient />

  <main class="main" style="background: #D3DEF2; min-height: 100vh; display: flex; flex-direction: column;">
    <div class="container">
      <section class="reg-container">
        <div class="login-section-in">
          <p class="main-text-login"><strong>Подтверждение кода!</strong></p>
          <p class="second-text">Введите код, который мы отправили на вашу электронную почту</p>
        </div>

        <div class="process-auth">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Код подтверждения</label>
              <input
                v-model.trim="code"
                type="password"
                placeholder="Введите код из письма"
                autocomplete="one-time-code"
                inputmode="numeric"
              >
            </div>
            
            <div class="agreement-section">
              <div class="register-container">
                <button 
                  type="submit" 
                  class="next-btn"
                  :disabled="isSubmitting">
                  <span class="next-link">
                    {{ isSubmitting ? 'Проверка...' : 'Подтвердить' }}
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