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

const auth = useAuth()
const router = useRouter()

const isPasswordVisible = ref(false)
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const { isPending: isLoggingIn, mutateAsync } = useMutation({
  mutationFn: ({ email, password }) => login(email, password),
  onSuccess: (data) => {
    auth.setToken(data.accessToken)
  },
  throwOnError: false,
})

const form = useForm({
  onSubmit: async ({ value: loginPayload }) => {
    try {
      await mutateAsync(loginPayload)
      router.push('/')
    } catch (e) {
      console.error(e)
      if (e.name === 'HTTPError') {
        if (e.response.status === 400) {
          console.log(e.response)
          alert('Неверный логин или пароль')
        }
      }
    }
  },

  defaultValues: {
    email: '',
    password: '',
  },
})

</script>

<template> 
  <AppHeaderWithGradient />

  <main class="main" style="background: linear-gradient(to left, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
    <div class="container">
      <section class="reg-container">
        <div class="login-section-in">
          <p class="main-text-login"><strong>С возвращением!</strong></p>
          <p class="second-text">Чтобы продолжить работу с сайтом, необходимо авторизоваться</p>
        </div>
        <div class="process-auth">
          <form @submit.prevent.stop="form.handleSubmit">
            <form.Field name="email">
              <template  v-slot="{ field, meta }">
                <div class="form-group">
                  <label :for="field.name">Почта</label>
                  <input :id="field.name" :name="field.name" :value="field.state.value" @blur="field.handleBlur"
                    @input="(e) => field.handleChange(e.target.value)" type="email" placeholder="Введите email" />
                </div>
              </template>
            </form.Field>

            <form.Field name="password">
              <template v-slot="{ field, meta }">
                <div class="form-group password-group">
                  <label :for="field.name">Пароль</label>
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
                    />
                    <button 
                      type="button" 
                      class="toggle-password" 
                      @click="togglePasswordVisibility" 
                      aria-label="Показать пароль"
                      >
                      <img 
                        :src="isPasswordVisible ? EyeOpened : EyeClosed" 
                        :style="{height: isPasswordVisible ? '25px' : '30px'}"
                        alt="Иконка глаза" 
                        class="eye-icon"
                      />
                    </button>
                  </div>
                </div>
            </template>
            </form.Field>

            <div class="agreement-section">
              <div class="register-container">
                <button type="submit" class="register-btn" :disabled="isLoggingIn"><a class="register-link">Войти</a></button>
                <router-link to="/registration" class="login-title">
                  Нет аккаунта?
                </router-link>
                <router-link to="/forgot-password" class="login-title-end">
                  Забыли пароль?
                </router-link>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>

</template>