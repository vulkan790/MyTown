<script setup>
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { useMutation } from '@tanstack/vue-query'

import { login } from '@/api/client'
import { useAuth } from '@/api/useAuth'

const auth = useAuth()
const router = useRouter()

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

  <main class="main">
    <div class="container">
      <section class="reg-container">
        <div class="login-section-in">
          <p class="main-text-login"><strong>С возвращением!</strong></p>
          <p class="second-text">Чтобы продолжить работу с сайтом, необходимо авторизоваться</p>
        </div>
        <div class="process-auth">
          <form @submit.prevent="form.handleSubmit" class="form-selction">
            <form.Field name="email" v-slot="{ field, meta }">
              <div class="form-group">
                <label for="email" class="label-control">Почта</label>
                <input
                  type="email"
                  id="email"
                  class="form-control"
                  placeholder="Введите почту"
                  :value="field.state.value"
                  @input="(e) => field.handleChange(e.target.value)"
                  @blur="field.handleBlur"/>
                <div v-if="meta.errors.length" class="error-message">
                  {{ meta.errors[0] }}
                </div>
              </div>
            </form.Field>

            <form.Field name="password" v-slot="{ field, meta }">
              <div class="form-group password-group">
                <label for="password" class="label-control">Пароль</label>
                <div class="password-input-wrapper">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    class="form-control"
                    placeholder="Введите пароль"
                    :value="field.state.value"
                    @input="(e) => field.handleChange(e.target.value)"
                    @blur="field.handleBlur"/>
                  <button
                    type="button"
                    class="toggle-password"
                    @click="showPassword = !showPassword"
                    aria-label="Показать пароль">
                    <img
                      :src="showPassword ? '/images/EyeOpen.png' : '/images/EyeClosed.png'"
                      alt="Показать пароль"
                      class="eye-icon"/>
                  </button>
                </div>
                <div v-if="meta.errors.length" class="error-message">
                  {{ meta.errors[0] }}
                </div>
              </div>
            </form.Field>

            <div class="agreement-section">
              <div class="register-container">
                <button 
                  type="submit" 
                  class="register-btn"
                  :disabled="isLoggingIn">
                  Авторизоваться
                </button>
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
