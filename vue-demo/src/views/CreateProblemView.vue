<script setup>

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/api/useAuth'
import { useUser } from '@/api/useUser'
import { createProblem, uploadProblemImage, getAddressSuggestions } from '@/api/client'
import { debounce } from 'lodash-es'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuth()
const userStore = useUser()
const { token } = storeToRefs(authStore)
const { isLoggedIn } = storeToRefs(userStore)

const form = ref({
  title: '',
  addressDisplay: '',
  addressUri: '',
  description: ''
})

const files = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const addressSuggestions = ref([])
const isAddressDropdownOpen = ref(false)
const addressTouched = ref(false)

const MAX_FILE_COUNT = 5
const MAX_TOTAL_SIZE_MB = 20
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024

const formValid = computed(() => {
  return (
    form.value.title.trim().length >= 5 &&
    form.value.addressUri &&
    form.value.description.trim().length >= 10 &&
    form.value.categoryId
  )
})

const addressError = computed(() => {
  return addressTouched.value && !form.value.addressUri
    ? 'Выберите адрес из списка предложений'
    : ''
})

const handleAddressInput = debounce(async (event) => {
  const query = event.target.value.trim()
  addressTouched.value = true
  
  if (!query || !isLoggedIn.value) {
    addressSuggestions.value = []
    isAddressDropdownOpen.value = false
    return
  }

  try {
    const suggestions = await getAddressSuggestions(query, token.value)
    addressSuggestions.value = suggestions
    isAddressDropdownOpen.value = suggestions.length > 0
  } catch (error) {
    console.error('Ошибка получения подсказок адреса:', error)
    addressSuggestions.value = []
    isAddressDropdownOpen.value = false
    if (error.message === 'Authorization required') {
      authStore.removeToken()
      router.push('/login')
    } else {
      errorMessage.value = 'Ошибка при поиске адреса. Попробуйте позже.'
    }
  }
}, 300)

const selectAddress = (suggestion) => {
  form.value.addressDisplay = suggestion.title
  form.value.addressUri = suggestion.uri
  isAddressDropdownOpen.value = false
  errorMessage.value = ''
}

const handleFileUpload = (event) => {
  if (!isLoggedIn.value) {
    router.replace('/login')
    return
  }

  const newFiles = Array.from(event.target.files)
  
  if (files.value.length + newFiles.length > MAX_FILE_COUNT) {
    errorMessage.value = `Можно загрузить не более ${MAX_FILE_COUNT} файлов`
    event.target.value = ''
    return
  }

  const totalSize = [...files.value, ...newFiles].reduce((acc, file) => acc + file.size, 0)
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    errorMessage.value = `Общий размер файлов не должен превышать ${MAX_TOTAL_SIZE_MB}MB`
    event.target.value = ''
    return
  }

  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'video/mp4',
    'video/avi',
    'video/quicktime'
  ]
  
  const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type))
  
  if (invalidFiles.length > 0) {
    errorMessage.value = `Недопустимые форматы файлов: ${invalidFiles.map(f => f.name).join(', ')}`
    event.target.value = ''
    return
  }

  files.value = [...files.value, ...newFiles]
  errorMessage.value = ''
  event.target.value = ''
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const formatFileSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const uploadFiles = async () => {
  if (!isLoggedIn.value || files.value.length === 0) {
    return []
  }
  
  const imageIds = []
  for (const file of files.value) {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await uploadProblemImage(formData, token.value)
      imageIds.push(response.id)
    } catch (error) {
      errorMessage.value = 'Ошибка загрузки файла: ' + error.message
      throw error
    }
  }
  return imageIds
}

const handleSubmit = async () => {
  try {
    if (!isLoggedIn.value) {
      router.replace('/login')
      return
    }

    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    if (!form.value.title.trim()) {
      throw new Error('Введите название проблемы')
    }
    if (!form.value.categoryId) {
      throw new Error('Выберите категорию проблемы')
    }
    if (!form.value.addressUri) {
      addressTouched.value = true
      throw new Error('Выберите адрес из предложенных вариантов')
    }
    if (!form.value.description.trim()) {
      throw new Error('Введите описание проблемы')
    }

    const imageIds = files.value.length > 0 ? await uploadFiles() : []

    const problemData = {
      title: form.value.title,
      description: form.value.description,
      address: form.value.addressUri,
      images: imageIds
    }

    const response = await createProblem(problemData, token.value)
    
    if (!response?.id) {
      throw new Error('Ошибка создания проблемы: неверный ответ сервера')
    }
    
    successMessage.value = 'Проблема успешно создана! Перенаправляем...'
    setTimeout(() => {
      router.push({ name: 'problem', params: { id: response.id } })
    }, 1500)
    
  } catch (error) {
    if (error.message === 'Authorization required') {
      authStore.removeToken()
      router.replace('/login')
    } else {
      console.error('Ошибка:', error)
      errorMessage.value = error.message || 'Произошла ошибка при создании проблемы'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleClickOutside = (e) => {
  const addressGroup = document.querySelector('.address-autocomplete')
  if (addressGroup && !addressGroup.contains(e.target)) {
    isAddressDropdownOpen.value = false
  }
}

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (!token.value || !isLoggedIn.value) {
    router.replace('/login')
    return
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <AppHeader />
  
  <main class="main">
    <div class="container">
      <div class="report-section">
        <h1>Сообщить о проблеме</h1>
        <form class="report-form" @submit.prevent="handleSubmit">
          <p class="form-message">Ваше сообщение поможет сделать город лучше!</p>

          <div class="form-group">
            <label for="problem-title">Название проблемы</label>
            <input
              type="text"
              id="problem-title"
              v-model.trim="form.title"
              @input="clearMessages"
              placeholder="Напишите название проблемы"
              required
              minlength="5"
              maxlength="100">
          </div>

          <div class="form-group">
            <label for="problem-address">Адрес проблемы</label>
            <div class="address-autocomplete">
              <input
                type="text"
                id="problem-address"
                v-model="form.addressDisplay"
                @input="handleAddressInput"
                @focus="isAddressDropdownOpen = true"
                @blur="addressTouched = true"
                placeholder="Укажите место проблемы"
                required
                autocomplete="off">

              <select 
                v-if="isAddressDropdownOpen && addressSuggestions.length"
                v-model="form.addressUri"
                @change="selectAddress(addressSuggestions.find(s => s.uri === form.addressUri))"
                class="form-select"
                size="5"
              >
                <option 
                  v-for="suggestion in addressSuggestions" 
                  :key="suggestion.uri"
                  :value="suggestion.uri"
                >
                  {{ suggestion.title }} - {{ suggestion.subtitle }}
                </option>
              </select>
              
              <div v-if="isAddressDropdownOpen && !addressSuggestions.length" class="no-suggestions">
                Ничего не найдено
              </div>
            </div>
            <small v-if="addressError" class="error">{{ addressError }}</small>
            <small v-else class="hint">Начните вводить адрес и выберите из списка</small>
          </div>

          <div class="file-upload-group">
            <label>Прикрепите материалы</label>
            <div class="file-input-wrapper">
              <label for="file-upload" class="upload-btn">
                <span>{{ files.length ? 'Добавить ещё' : 'Выбрать файлы' }}</span>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*, video/*"
                  hidden
                  @change="handleFileUpload">
              </label>
              
              <div v-if="files.length" class="file-list">
                <div v-for="(file, index) in files" :key="index" class="file-item">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  <button
                    type="button"
                    class="delete-btn"
                    @click="removeFile(index)"
                    aria-label="Удалить файл">
                    ×
                  </button>
                </div>
              </div>
              <div class="file-requirements">
                <span>Допустимые форматы: PNG, JPEG, MP4, AVI</span>
                <span>Максимум: {{ MAX_FILE_COUNT }} файлов ({{ MAX_TOTAL_SIZE_MB }}MB)</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="problem-description">Подробное описание</label>
            <textarea
              id="problem-description"
              v-model.trim="form.description"
              @input="clearMessages"
              rows="5"
              placeholder="Опишите проблему подробно"
              required
              minlength="10"
              maxlength="1000"></textarea>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting || !formValid">
            {{ isSubmitting ? 'Отправка...' : 'Опубликовать' }}
          </button>
        </form>
      </div>
    </div>
  </main>

</template>