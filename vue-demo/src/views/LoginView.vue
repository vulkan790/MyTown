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

const router = useRouter()
const auth = useAuth()
const isPasswordVisible = ref(false)

const loginForm = useForm({
  onSubmit: async ({ value: loginPayload }) => {
    try {
      await loginMutation.mutateAsync(loginPayload)
      router.push('/')
    } catch (e) {
      console.error('Login error:', e)
      
      let errorMessage = 'Сетевая ошибка. Проверьте соединение'
      
      if (e.response) {
        if (e.response.status === 401) {
          errorMessage = 'Неправильный логин или пароль'
        } else if (e.response.status === 400) {
          errorMessage = 'Проверьте введенные данные'
        }
      }
      
      alert(errorMessage)
    }
  },
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    email: ({ value }) => {
      if (!value) return 'Поле обязательно для заполнения'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return 'Введите корректный email'
      return null
    },
    password: ({ value }) => {
      if (!value) return 'Поле обязательно для заполнения'
      if (value.length < 6) return 'Пароль должен быть не менее 6 символов'
      return null
    } 
  }
})

const loginMutation = useMutation({
  mutationFn: ({ email, password }) => login(email, password),
  onSuccess: (data) => {
    auth.setToken(data.accessToken)
  },
  throwOnError: true,
})

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>

<template>
  <AppHeaderWithGradient />

  <main class="main" style="background: linear-gradient(to left, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
    <div class="container">
      <section class="reg-container">
        <div class="login-step-container">
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
                        :class="{ 'error': meta && !meta.valid && meta.touched }"/>
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
                          :class="{ 'error': meta && !meta.valid && meta.touched }"/>
                        <button 
                          type="button" 
                          class="toggle-password" 
                          @click="togglePasswordVisibility" 
                          aria-label="Показать пароль">
                          <img 
                            :src="isPasswordVisible ? EyeOpened : EyeClosed" 
                            alt="Иконка глаза" 
                            class="eye-icon"/>
                        </button>
                      </div>
                      <div v-if="meta && !meta.valid && meta.touched" class="error-message">{{ meta.errors }}</div>
                    </div>
                  </template>
                </loginForm.Field>
              </div>

              <div class="agreement-section">
                <div class="register-container">
                  <button type="submit" class="register-btn">
                    <a class="register-link">Войти</a>
                  </button>
                  <router-link to="/registration" class="login-title">Нет аккаунта?</router-link>
                  <router-link to="/forgot-password" class="login-title">Забыли пароль?</router-link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  </main>

</template>