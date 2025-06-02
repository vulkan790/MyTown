<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { useMutation } from '@tanstack/vue-query'

import { login } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import AppHeaderWithGradient from '@/components/AppHeaderWithGradient.vue'

import EyeClosed from '@/images/EyeClosed.png'
import EyeOpened from '@/images/EyeOpened.png'

const STEP_LOGIN = 1
const STEP_FORGOT_PASSWORD = 2
const STEP_CODE_VERIFICATION = 3
const STEP_RESET_PASSWORD = 4

const router = useRouter()
const auth = useAuth()
const currentStep = ref(STEP_LOGIN)

const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const emailError = ref('')
const codeError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

const goToLogin = () => {
  currentStep.value = STEP_LOGIN
  resetErrors()
}
const goToForgotPassword = () => {
  currentStep.value = STEP_FORGOT_PASSWORD
  resetErrors()
}
const goToCodeVerification = () => {
  currentStep.value = STEP_CODE_VERIFICATION
  resetErrors()
}
const goToResetPassword = () => {
  currentStep.value = STEP_RESET_PASSWORD
  resetErrors()
}

const resetErrors = () => {
  emailError.value = ''
  codeError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
}

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const loginForm = useForm({
  onSubmit: async ({ value: loginPayload }) => {
    try {
      await loginMutation.mutateAsync(loginPayload)
      router.push('/')
    } catch (e) {
      console.error(e)
      if (e.name === 'HTTPError' && e.response.status === 400) {
        loginForm.setFieldError('email', 'Неверный логин или пароль')
        loginForm.setFieldError('password', 'Неверный логин или пароль')
      }
    }
  },
  defaultValues: {
    email: '',
    password: '',
  },
})

const loginMutation = useMutation({
  mutationFn: ({ email, password }) => login(email, password),
  onSuccess: (data) => {
    auth.setToken(data.accessToken)
  },
  throwOnError: false,
})

const validateEmail = () => {
  emailError.value = ''
  
  if (!email.value.trim()) {
    emailError.value = 'Пожалуйста, введите email'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Пожалуйста, введите корректный email'
    return false
  }
  return true
}

const handleEmailSubmit = async () => {
  try {
    isSubmitting.value = true
    if (!validateEmail()) return
    console.log('Email для восстановления:', email.value)
    goToCodeVerification()
  } catch (error) {
    console.error('Ошибка:', error)
    emailError.value = error.message || 'Произошла ошибка при отправке'
  } finally {
    isSubmitting.value = false
  }
}

const validateCode = () => {
  codeError.value = ''
  
  if (!code.value.trim()) {
    codeError.value = 'Пожалуйста, введите код подтверждения'
    return false
  }
  return true
}

const handleCodeSubmit = async () => {
  try {
    isSubmitting.value = true
    if (!validateCode()) return
    console.log('Введенный код:', code.value)
    goToResetPassword()
  } catch (error) {
    console.error('Ошибка:', error)
    codeError.value = error.message || 'Произошла ошибка при проверке кода'
  } finally {
    isSubmitting.value = false
  }
}

const toggleResetPasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const toggleConfirmPasswordVisibility = () => {
  isConfirmPasswordVisible.value = !isConfirmPasswordVisible.value
}

const validatePassword = () => {
  passwordError.value = ''
  confirmPasswordError.value = ''
  let isValid = true
  
  if (!password.value.trim()) {
    passwordError.value = 'Пожалуйста, введите пароль'
    isValid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'Пароль должен содержать минимум 6 символов'
    isValid = false
  }
  
  if (!confirmPassword.value.trim()) {
    confirmPasswordError.value = 'Пожалуйста, подтвердите пароль'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Пароли не совпадают'
    isValid = false
  }
  
  return isValid
}

const handlePasswordSubmit = async () => {
  try {
    isSubmitting.value = true
    if (!validatePassword()) return
    console.log('Новый пароль:', password.value)
    alert('Пароль успешно изменен!')
    goToLogin()
  } catch (error) {
    console.error('Ошибка:', error)
    passwordError.value = error.message || 'Произошла ошибка при смене пароля'
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
        <div v-if="currentStep === STEP_LOGIN" class="login-step-container">
          <div class="login-section-in">
            <p class="main-text-login"><strong>С возвращением!</strong></p>
            <p class="second-text">Чтобы продолжить работу с сайтом, необходимо авторизоваться</p>
          </div>
          
          <div class="process-auth">
            <form @submit.prevent.stop="loginForm.handleSubmit">
              <div class="form-selction">
                <loginForm.Field name="email">
                  <template v-slot="{ field, meta }">
                    <div class="form-group">
                      <label :for="field.name" class="label-control">Почта</label>
                      <input 
                        :id="field.name" 
                        :name="field.name" 
                        :value="field.state.value" 
                        @blur="field.handleBlur"
                        @input="(e) => field.handleChange(e.target.value)" 
                        type="email" 
                        placeholder="Введите email" 
                        class="form-control"
                        :class="{ 'error': meta && !meta.valid && meta.touched }"
                      />
                      <div v-if="meta && !meta.valid && meta.touched" class="error-message">{{ meta.errors }}</div>
                    </div>
                  </template>
                </loginForm.Field>

                <loginForm.Field name="password">
                  <template v-slot="{ field, meta }">
                    <div class="form-group password-group">
                      <label :for="field.name" class="label-control">Пароль</label>
                      <div class="password-input-wrapper">
                        <input 
                          :id="field.name" 
                          :name="field.name" 
                          :value="field.state.value" 
                          @blur="field.handleBlur"
                          @input="(e) => field.handleChange(e.target.value)" 
                          :type="isPasswordVisible ? 'text' : 'password'" 
                          placeholder="Введите пароль" 
                          class="form-control"
                          :class="{ 'error': meta && !meta.valid && meta.touched }"
                        />
                        <button 
                          type="button" 
                          class="toggle-password" 
                          @click="togglePasswordVisibility" 
                          aria-label="Показать пароль"
                        >
                          <img 
                            :src="isPasswordVisible ? EyeOpened : EyeClosed" 
                            alt="Иконка глаза" 
                            class="eye-icon"
                          />
                        </button>
                      </div>
                      <div v-if="meta && !meta.valid && meta.touched" class="error-message">{{ meta.errors }}</div>
                    </div>
                  </template>
                </loginForm.Field>
              </div>

              <div class="agreement-section">
                <div class="register-container">
                  <button type="submit" class="register-btn" :disabled="isLoggingIn"><a class="register-link">Войти</a></button>
                  <router-link to="/registration" class="login-title">Нет аккаунта?</router-link>
                  <a href="#" class="login-title-end" @click="goToForgotPassword">Забыли пароль?</a>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div v-else-if="currentStep === STEP_FORGOT_PASSWORD" class="login-step-container">
          <div class="login-section-in">
            <p class="main-text-login"><strong>Почта, на которую пришлём код!</strong></p>
            <p class="second-text">Введите почту, чтобы мы могли восстановить пароль.</p>
          </div>

          <div class="process-auth">
            <form @submit.prevent="handleEmailSubmit">
              <div class="form-selction">
                <div class="form-group">
                  <label class="label-control">Восстановление пароля</label>
                  <input
                    v-model.trim="email"
                    type="email"
                    placeholder="Введите email"
                    class="form-control"
                    :class="{ 'error': emailError }"
                  >
                  <div v-if="emailError" class="error-message">{{ emailError }}</div>
                </div>
              </div>
              
              <div class="agreement-section">
                <div class="register-container">
                  <button type="submit" class="register-btn"><a class="register-link">{{ isSubmitting ? 'Отправка...' : 'Далее' }}</a></button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div v-else-if="currentStep === STEP_CODE_VERIFICATION" class="login-step-container">
          <div class="login-section-in">
            <p class="main-text-login"><strong>Подтверждение кода!</strong></p>
            <p class="second-text">Введите код, который мы отправили на вашу электронную почту</p>
          </div>

          <div class="process-auth">
            <form @submit.prevent="handleCodeSubmit">
              <div class="form-selction">
                <div class="form-group">
                  <label class="label-control">Код подтверждения</label>
                  <input
                    v-model.trim="code"
                    type="text"
                    placeholder="Введите код из письма"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                    class="form-control"
                    :class="{ 'error': codeError }"
                  >
                  <div v-if="codeError" class="error-message">{{ codeError }}</div>
                </div>
              </div>
              
              <div class="agreement-section">
                <div class="register-container">
                  <button type="submit" class="register-btn"><a class="register-link">{{ isSubmitting ? 'Проверка...' : 'Подтвердить' }}</a></button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div v-else-if="currentStep === STEP_RESET_PASSWORD" class="login-step-container">
          <div class="login-section-in">
            <p class="main-text-login"><strong>Сброс пароля!</strong></p>
            <p class="second-text">Введите новый пароль и подтвердите его</p>
          </div>

          <div class="process-auth">
            <form @submit.prevent="handlePasswordSubmit">
              <div class="form-selction">
                <div class="form-group password-group">
                  <label class="label-control">Пароль</label>
                  <div class="password-input-wrapper">
                    <input 
                      v-model.trim="password"
                      :type="isPasswordVisible ? 'text' : 'password'" 
                      placeholder="Введите пароль" 
                      class="form-control"
                      :class="{ 'error': passwordError }"
                      required
                    />
                    <button 
                      type="button" 
                      class="toggle-password" 
                      @click="toggleResetPasswordVisibility" 
                      aria-label="Показать пароль"
                    >
                      <img 
                        :src="isPasswordVisible ? EyeOpened : EyeClosed" 
                        alt="Иконка глаза" 
                        class="eye-icon"
                      />
                    </button>
                  </div>
                  <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
                </div>

                <div class="form-group password-group">
                  <label class="label-control">Подтвердите пароль</label>
                  <div class="password-input-wrapper">
                    <input 
                      v-model.trim="confirmPassword"
                      :type="isConfirmPasswordVisible ? 'text' : 'password'" 
                      placeholder="Повторите пароль" 
                      class="form-control"
                      :class="{ 'error': confirmPasswordError }"
                      required
                    />
                    <button 
                      type="button" 
                      class="toggle-password" 
                      @click="toggleConfirmPasswordVisibility" 
                      aria-label="Показать пароль"
                    >
                      <img 
                        :src="isConfirmPasswordVisible ? EyeOpened : EyeClosed" 
                        alt="Иконка глаза" 
                        class="eye-icon"
                      />
                    </button>
                  </div>
                  <div v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</div>
                </div>
              </div>
              
              <div class="agreement-section">
                <div class="register-container">
                  <button type="submit" class="register-btn"><a class="register-link">{{ isSubmitting ? 'Сохранение...' : 'Сохранить пароль' }}</a></button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  </main>

</template>