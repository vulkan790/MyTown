<script setup>
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { useMutation } from '@tanstack/vue-query'

import { login } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import AppHeader from '@/components/AppHeader.vue'

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
  <AppHeader />

  <main>
    <h2>Вход</h2>

    <form @submit.prevent.stop="form.handleSubmit">
      <form.Field name="email">
        <template v-slot="{ field }">
          <div>
            <label :for="field.name">Email</label>
            <input :id="field.name" :name="field.name" :value="field.state.value" @blur="field.handleBlur"
              @input="(e) => field.handleChange(e.target.value)" type="email" placeholder="Введите email" />
          </div>
        </template>
      </form.Field>

      <form.Field name="password">
        <template v-slot="{ field }">
          <div>
            <label :for="field.name">Пароль</label>
            <input :id="field.name" :name="field.name" :value="field.state.value" @blur="field.handleBlur"
              @input="(e) => field.handleChange(e.target.value)" type="password" placeholder="Введите пароль" />
          </div>
        </template>
      </form.Field>

      <button type="submit" :disabled="isLoggingIn">Войти</button>
    </form>
  </main>
</template>
