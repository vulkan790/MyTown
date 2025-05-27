<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { useMutation } from '@tanstack/vue-query'
import { register } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import EyeClosed from '@/images/EyeClosed.png'
import EyeOpened from '@/images/EyeOpened.png'

const auth = useAuth()
const router = useRouter()

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const togglePasswordVisibility = () => {
    isPasswordVisible.value = !isPasswordVisible.value
}

const toggleConfirmPasswordVisibility = () => {
    isConfirmPasswordVisible.value = !isConfirmPasswordVisible.value
}

const { isPending: isLoggingIn, mutateAsync } = useMutation({
    mutationFn: ({ lastname, firstname, middlename, email, password }) => register(lastname, firstname, middlename, email, password),
    onSuccess: (data) => {
        auth.setToken(data.accessToken)
        router.push('/')
    },
    throwOnError: false,
})

const form = useForm({
    onSubmit: async ({ value: registrationPayload }) => {
        try {
            await mutateAsync(registrationPayload)
        } catch (e) {
            console.error(e)
            if (e.name === 'HTTPError') {
                if (e.response.status === 400) {
                    alert('Ошибка регистрации. Пожалуйста, проверьте введенные данные.')
                }
            }
        }
    },
    defaultValues: {
        lastname: '',
        firstname: '',
        middlename: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreement: false,
    },
})

</script>

<template>
    <AppHeaderWithGradient />


    <main class="main"
        style="background: linear-gradient(to left, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
        <div class="container">
            <section class="reg-container">
                <div class="registration-section">
                    <p class="main-text-registration"><strong>Регистрация</strong></p>
                    <p class="second-text">Пожалуйста, заполните все поля для регистрации</p>
                </div>
                <div class="process-reg">
                    <form @submit.prevent.stop="form.handleSubmit">
                        <form.Field name="lastname">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Фамилия</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите фамилию" />
                                    <div v-if="meta.touched && meta.error" class="error-message">{{ meta.error }}</div>
                                </div>
                            </template>
                        </form.Field>


                        <form.Field name="firstname">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Имя</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите имя" />
                                    <div v-if="meta.touched && meta.error" class="error-message">{{ meta.error }}</div>
                                </div>
                            </template>
                        </form.Field>


                        <form.Field name="middlename">
                            <template v-slot="{ field }">
                                <div class="form-group">
                                    <label :for="field.name">Отчество (если не имеете, то оставьте поле пустым)</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите отчество" />
                                </div>
                            </template>
                        </form.Field>


                        <form.Field name="email">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Почта</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="email" placeholder="Введите почту" />
                                    <div v-if="meta.touched && meta.error" class="error-message">{{ meta.error }}</div>
                                </div>
                            </template>
                        </form.Field>


                        <form.Field name="password">
                            <template v-slot="{ field, meta }">
                                <div class="form-group password-group">
                                    <label :for="field.name">Пароль</label>
                                    <div class="password-input-wrapper">
                                        <input :id="field.name" :name="field.name" :value="field.state.value"
                                            @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                            :type="isPasswordVisible ? 'text' : 'password'" placeholder="Введите пароль"
                                            class="form-control" />
                                        <button type="button" class="toggle-password" @click="togglePasswordVisibility"
                                            aria-label="Показать пароль">
                                            <img :src="isPasswordVisible ? EyeOpened : EyeClosed"
                                                :style="{ height: isPasswordVisible ? '25px' : '30px' }"
                                                alt="Иконка глаза" class="eye-icon" />
                                        </button>
                                    </div>
                                    <div v-if="meta.touched && meta.error" class="error-message">{{ meta.error }}</div>
                                </div>
                            </template>
                        </form.Field>


                        <form.Field name="confirmPassword">
                            <template v-slot="{ field, meta }">
                                <div class="form-group password-group">
                                    <label :for="field.name">Подтвердить Пароль</label>
                                    <div class="password-input-wrapper">
                                        <input :id="field.name" :name="field.name" :value="field.state.value"
                                            @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                            :type="isConfirmPasswordVisible ? 'text' : 'password'"
                                            placeholder="Введите ещё раз пароль" class="form-control" />
                                        <button type="button" class="toggle-password"
                                            @click="toggleConfirmPasswordVisibility" aria-label="Показать пароль">
                                            <img :src="isConfirmPasswordVisible ? EyeOpened : EyeClosed"
                                                :style="{ height: isConfirmPasswordVisible ? '25px' : '30px' }"
                                                alt="Иконка глаза" class="eye-icon" />
                                        </button>
                                    </div>
                                    <div v-if="meta.touched && meta.error" class="error-message">{{ meta.error }}</div>
                                </div>
                            </template>
                        </form.Field>


                        <div class="agreement-section">
                            <label class="agreement-checkbox">
                                <input type="checkbox" v-model="form.agreement" id="agreement">
                                <span class="checkmark"></span>
                                <span class="agreement-text">Принять пользовательские соглашения</span>
                            </label>
                            <div v-if="errors.agreement" class="error-message">{{ errors.agreement }}</div>
                        </div>


                        <div class="register-container">
                            <button type="submit" class="register-btn"
                                :disabled="isLoggingIn">Зарегистрироваться</button>
                            <router-link to="/autorization" class="login-title">
                                Уже имеете аккаунт?
                            </router-link>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    </main>
</template>
