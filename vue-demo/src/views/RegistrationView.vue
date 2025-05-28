<script setup>

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from '@tanstack/vue-form'
import { useMutation } from '@tanstack/vue-query'
import { register } from '@/api/client'
import { useAuth } from '@/api/useAuth'

import AppHeaderWithGradientReg from '@/components/AppHeaderWithGradientReg.vue'

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
    mutationFn: register,
    onSuccess: (data) => {
        auth.setToken(data.accessToken)
        router.push('/')
    },
    throwOnError: false,
})

const translateError = (error) => {
    const errorMap = {
        'must match format "email"': 'должен быть в формате email',
        'is required': 'обязателен для заполнения',
        'min length is 6': 'должен содержать минимум 6 символов',
        'must NOT have fewer than 6 characters': 'должен содержать минимум 6 символов',
        'must be one of': 'должен быть одним из допустимых значений',
        'must be a string': 'должен быть текстом',
        'must be a valid gender': 'должен быть указан пол',
        'passwords do not match': 'пароли не совпадают',
        'user already exists': 'пользователь уже существует',
        'agreement must be accepted': 'необходимо принять пользовательское соглашение',
        'body/email': 'Почта',
        'body/password': 'Пароль',
        'body/firstName': 'Имя',
        'body/lastName': 'Фамилия',
        'body/gender': 'Пол',
        'body/agreement': 'Соглашение',
    };

    let translated = error;
    for (const [key, value] of Object.entries(errorMap)) {
        translated = translated.replace(key, value);
    }
    return translated;
};

const form = useForm({
    validators: {
        lastName: ({ value }) => !value ? 'Фамилия обязательна' : undefined,
        firstName: ({ value }) => !value ? 'Имя обязательно' : undefined,
        email: ({ value }) => {
            if (!value) return 'Почта обязательна'
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный формат почты'
            return undefined
        },
        password: ({ value }) => {
            if (!value) return 'Пароль обязателен'
            if (value.length < 6) return 'Пароль должен быть не менее 6 символов'
            return undefined
        },
        confirmPassword: ({ value, fieldApi }) => 
            value !== fieldApi.form.getFieldValue('password') 
                ? 'Пароли не совпадают' 
                : undefined,
        agreement: ({ value }) => 
            !value ? 'Необходимо принять пользовательское соглашение' : undefined
    },
    onSubmit: async ({ value: registrationPayload }) => {
        const errors = []
        let firstErrorElement = null
        
        for (const fieldName in form.state.errorMap) {
            const error = form.state.errorMap[fieldName]
            if (error) {
                errors.push(error)
                
                if (!firstErrorElement) {
                    const fieldElement = document.querySelector(`[name="${fieldName}"]`)
                    if (fieldElement) firstErrorElement = fieldElement
                }
            }
        }

        if (errors.length > 0) {
            const errorMessage = 
                'Пожалуйста, исправьте ошибки:\n\n' + 
                errors.map(e => `• ${e}`).join('\n')
            
            alert(errorMessage)
            
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                })
                firstErrorElement.focus()
            }
            
            return
        }

        const payload = {
            email: registrationPayload.email.toLowerCase(),
            password: registrationPayload.password,
            firstName: registrationPayload.firstName,
            lastName: registrationPayload.lastName,
            middleName: registrationPayload.middleName,
            gender: registrationPayload.gender
        }

        try {
            await mutateAsync(payload)
        } catch (e) {
            console.error('Registration error:', e)
            
            if (e.name === 'HTTPError') {
                const errorData = await e.response.json()
                
                if (e.response.status === 400) {
                    let errorMsg = 'Ошибка в данных:\n'
                    
                    if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorData.errors.forEach(err => {
                            errorMsg += `\n• ${translateError(err.message)}`
                        })
                    } else {
                        errorMsg += `\n• ${translateError(errorData.message || 'Неизвестная ошибка валидации')}`
                    }
                    
                    alert(errorMsg)
                } 
                else if (e.response.status === 409) {
                    alert('Пользователь с такой почтой уже существует')
                } 
                else {
                    const errorMsg = translateError(
                        errorData.message || 'Ошибка регистрации. Пожалуйста, проверьте данные'
                    )
                    alert(errorMsg)
                }
            } else {
                alert('Произошла неизвестная ошибка. Попробуйте позже')
            }
        }
    },
    defaultValues: {
        lastName: '',
        firstName: '',
        middleName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreement: false,
        gender: 'male'
    },
})
</script>

<template>
    <AppHeaderWithGradientReg />

    <main class="main"
        style="background: linear-gradient(to right, #D3DEF2 20%, #3786BE 80%); min-height: 100vh; display: flex; flex-direction: column;">
        <div class="container">
            <section class="reg-container">
                <div class="process-reg">
                    <form @submit.prevent.stop="form.handleSubmit">
                        <form.Field name="lastName">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Фамилия</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите фамилию" 
                                        :class="{ 'has-error': meta?.touched && meta.error }" />
                                </div>
                            </template>
                        </form.Field>

                        <form.Field name="firstName">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Имя</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите имя" 
                                        :class="{ 'has-error': meta?.touched && meta.error }" />
                                </div>
                            </template>
                        </form.Field>

                        <form.Field name="middleName">
                            <template v-slot="{ field }">
                                <div class="form-group">
                                    <label :for="field.name">Отчество (если нет, оставьте пустым)</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="text" placeholder="Введите отчество" />
                                </div>
                            </template>
                        </form.Field>

                        <form.Field name="gender">
                            <template v-slot="{ field }">
                                <div class="centered-radio-group">
                                    <label>Пол</label>
                                    <div class="radio-options">
                                        <label class="radio-option">
                                            <input type="radio" :name="field.name" value="male" 
                                                @change="field.handleChange" :checked="field.state.value === 'male'">
                                            Мужской
                                        </label>
                                        <label class="radio-option">
                                            <input type="radio" :name="field.name" value="female"
                                                @change="field.handleChange" :checked="field.state.value === 'female'">
                                            Женский
                                        </label>
                                    </div>
                                </div>
                            </template>
                        </form.Field>

                        <form.Field name="email">
                            <template v-slot="{ field, meta }">
                                <div class="form-group">
                                    <label :for="field.name">Почта</label>
                                    <input :id="field.name" :name="field.name" :value="field.state.value"
                                        @blur="field.handleBlur" @input="(e) => field.handleChange(e.target.value)"
                                        type="email" placeholder="Введите почту" 
                                        :class="{ 'has-error': meta?.touched && meta.error }" />
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
                                            class="form-control" 
                                            :class="{ 'has-error': meta?.touched && meta.error }" />
                                        <button type="button" class="toggle-password" @click="togglePasswordVisibility"
                                            aria-label="Показать пароль">
                                            <img :src="isPasswordVisible ? EyeOpened : EyeClosed"
                                                :style="{ height: isPasswordVisible ? '25px' : '30px' }"
                                                alt="Иконка глаза" class="eye-icon" />
                                        </button>
                                    </div>
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
                                            placeholder="Введите ещё раз пароль" class="form-control" 
                                            :class="{ 'has-error': meta?.touched && meta.error }" />
                                        <button type="button" class="toggle-password"
                                            @click="toggleConfirmPasswordVisibility" aria-label="Показать пароль">
                                            <img :src="isConfirmPasswordVisible ? EyeOpened : EyeClosed"
                                                :style="{ height: isConfirmPasswordVisible ? '25px' : '30px' }"
                                                alt="Иконка глаза" class="eye-icon" />
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </form.Field>

                        <form.Field name="agreement" v-slot="{ field, meta }">
                            <div class="agreement-section">
                                <label class="agreement-checkbox">
                                    <input 
                                        type="checkbox" 
                                        :id="field.name"
                                        :name="field.name"
                                        :checked="field.state.value"
                                        @change="(e) => field.handleChange(e.target.checked)"
                                        @blur="field.handleBlur"
                                        :class="{ 'has-error': meta?.touched && meta.error }"
                                    >
                                    <span class="checkmark"></span>
                                    <span class="agreement-text">Принять пользовательские соглашения</span>
                                </label>
                            </div>
                        </form.Field>

                        <div class="register-container">
                            <button type="submit" class="register-btn"
                                :disabled="isLoggingIn" 
                                style="color: white; border: none; font-size: 20px;">
                                {{ isLoggingIn ? 'Регистрация...' : 'Зарегистрироваться' }}
                            </button>
                            <router-link to="/autorization" class="login-title">
                                Уже имеете аккаунт?
                            </router-link>
                        </div>
                    </form>
                </div>
                <div class="login-section">
                    <p class="main-text"><strong>Пользователь!</strong></p>
                    <p class="second-text">Чтобы продолжить работу с сайтом, необходимо зарегистрироваться и принять пользовательские соглашения.</p>
                </div>
            </section>
        </div>
    </main>

</template>