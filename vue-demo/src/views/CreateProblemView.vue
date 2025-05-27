<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/api/useAuth'
import { createProblem, uploadProblemImage, getAddressSuggestions } from '@/api/client'
import { debounce } from 'lodash-es'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuth()
const { token } = storeToRefs(authStore)

onMounted(() => {
  if (!token.value) {
    router.replace('/login')
  }
})

const form = ref({
  title: '',
  addressDisplay: '',
  addressUri: '',
  description: '',
})

const files = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const addressSuggestions = ref([])
const showSuggestions = ref(false)

const MAX_FILE_COUNT = 5
const MAX_TOTAL_SIZE_MB = 20
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024

const handleFileUpload = (event) => {
  if (!token.value) return router.replace('/login')
  
  const newFiles = Array.from(event.target.files)
  if (files.value.length + newFiles.length > MAX_FILE_COUNT) {
    errorMessage.value = `Максимум ${MAX_FILE_COUNT} файлов`
    event.target.value = ''
    return
  }

  const totalSize = [...files.value, ...newFiles].reduce((acc, file) => acc + file.size, 0)
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    errorMessage.value = `Общий размер не должен превышать ${MAX_TOTAL_SIZE_MB}MB`
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
  if (!token.value) return router.replace('/login')
  
  const imageIds = []
  for (const file of files.value) {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await uploadProblemImage(formData, token.value)
      if (!response?.id) throw new Error('Ошибка загрузки файла')
      imageIds.push(response.id)
    } catch (error) {
      errorMessage.value = error.message
      throw error
    }
  }
  return imageIds
}

const fetchAddressSuggestions = debounce(async (query) => {
  if (!query.trim() || !token.value) {
    addressSuggestions.value = []
    return
  }
  
  try {
    const suggestions = await getAddressSuggestions(query, token.value)
    addressSuggestions.value = suggestions
    showSuggestions.value = true
  } catch (error) {
    if (error.response?.status === 401) {
      authStore.removeToken()
      router.push('/login')
    }
    console.error('Ошибка получения подсказок:', error)
  }
}, 300)

const selectAddress = (suggestion) => {
  form.value.addressDisplay = suggestion.title 
  form.value.addressUri = suggestion.uri
  showSuggestions.value = false
}

const onClickOutside = (e) => {
  if (!e.target.closest('.address-autocomplete')) {
    showSuggestions.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

const handleSubmit = async () => {
  try {
    if (!token.value) return router.replace('/login')

    isSubmitting.value = true
    errorMessage.value = ''

    if (!form.value.title.trim() || !form.value.addressUri.trim() || !form.value.description.trim()) {
      throw new Error('Заполните все обязательные поля')
    }

    const imageIds = await uploadFiles()
    
    const problemData = {
      title: form.value.title,
      address: form.value.addressUri,
      description: form.value.description,
      images: imageIds,
    }

    const response = await createProblem(problemData, token.value)
    if (!response?.problem?.id) {
      throw new Error('Ошибка создания проблемы: неверный ответ сервера')
    }
    
    router.push({ path: `/problems/${response.problem.id}`, replace: true })

  } catch (error) {
    if (error.response?.status === 401) {
      authStore.removeToken()
      router.replace('/login')
    } else {
      errorMessage.value = error.message || 'Ошибка при создании проблемы'
    }
  } finally {
    isSubmitting.value = false
  }
}
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
              placeholder="Напишите название проблемы"
              required>
          </div>

          <div class="form-group">
            <label for="problem-address">Адрес</label>
            <div class="address-autocomplete">
              <input
                type="text"
                id="problem-address"
                v-model.trim="form.addressDisplay"
                @input="fetchAddressSuggestions($event.target.value)"
                placeholder="Укажите место проблемы"
                required
                autocomplete="off">
              <ul v-if="showSuggestions && addressSuggestions.length" class="suggestions-list">
                <li
                  v-for="(suggestion, index) in addressSuggestions"
                  :key="index"
                  @click="selectAddress(suggestion)"
                  class="suggestion-item">
                  <strong>{{ suggestion.title }}</strong>
                  <br>
                  <small>{{ suggestion.subtitle }}</small>
                </li>
              </ul>
            </div>
          </div>

          <div class="file-upload-group">
            <label>Прикрепите материалы</label>
            <div class="file-input-wrapper">
              <label for="file-upload" class="upload-btn">
                {{ files.length ? 'Добавить ещё' : 'Выбрать файлы' }}
              </label>
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*, video/*"
                hidden
                @change="handleFileUpload">
              <div v-if="files.length" class="file-list">
                <div v-for="(file, index) in files" :key="index" class="file-item">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  <button
                    type="button"
                    class="delete-btn"
                    @click="removeFile(index)">×</button>
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
              rows="5"
              placeholder="Опишите проблему подробно"
              required></textarea>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting">
            {{ isSubmitting ? 'Отправка...' : 'Опубликовать' }}
          </button>
        </form>
      </div>
    </div>
  </main>

</template>