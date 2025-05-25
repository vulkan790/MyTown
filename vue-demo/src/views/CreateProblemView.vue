<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/api/useAuth'
import { createProblem, uploadProblemImage } from '@/api/client'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const auth = useAuth()

const form = ref({
  title: '',
  address: '',
  description: '',
})

const files = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')

const MAX_FILE_COUNT = 5
const MAX_TOTAL_SIZE_MB = 20
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024

const handleFileUpload = (event) => {
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
  const imageIds = []
  
  for (const file of files.value) {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const { id } = await uploadProblemImage(formData, auth.token)
      imageIds.push(id)
    } catch (error) {
      console.error('Ошибка загрузки файла:', error)
      throw new Error('Ошибка загрузки файлов')
    }
  }
  
  return imageIds
}

const handleSubmit = async () => {
  try {
    if (!auth.token) {
      errorMessage.value = 'Для создания проблемы необходимо авторизоваться'
      await router.push('/login')
      return
    }

    isSubmitting.value = true
    errorMessage.value = ''

    if (!form.value.title.trim() || !form.value.address.trim() || !form.value.description.trim()) {
      throw new Error('Заполните все обязательные поля')
    }

    const imageIds = await uploadFiles()

    const problemData = {
      title: form.value.title,
      address: form.value.address,
      description: form.value.description,
      images: imageIds,
    }

    const { id } = await createProblem(problemData, auth.token)
    
    form.value = { title: '', address: '', description: '' }
    files.value = []
    router.push(`/problems/${id}`)
    
  } catch (error) {
    console.error('Ошибка:', error)
    errorMessage.value = error.message || 'Произошла ошибка при создании проблемы'
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
              placeholder="Кратко опишите проблему"
              required
            >
          </div>
          <div class="form-group">
            <label for="problem-address">Адрес</label>
            <input
              type="text"
              id="problem-address"
              v-model.trim="form.address"
              placeholder="Укажите место проблемы"
              required
            >
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
                @change="handleFileUpload"
              >
              <div v-if="files.length" class="file-list">
                <div v-for="(file, index) in files" :key="index" class="file-item">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  <button
                    type="button"
                    class="delete-btn"
                    @click="removeFile(index)"
                  >×</button>
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
              required
            ></textarea>
          </div>
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Отправка...' : 'Опубликовать' }}
          </button>
        </form>
      </div>
    </div>
  </main>

</template>