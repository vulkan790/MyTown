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

<template class="registration">

  <main class="main">
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
              <template v-slot="{ field }">
                <div class="form-group password-group">
                  <label :for="field.name">Пароль</label>
                  <input :id="field.name" :name="field.name" :value="field.state.value" @blur="field.handleBlur"
                    @input="(e) => field.handleChange(e.target.value)" type="password" placeholder="Введите пароль" />
                    <div v-if="meta.errors.length" class="error-message">
                          {{ meta.errors[0] }}
                    </div>
                </div>
            </template>
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
