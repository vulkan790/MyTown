<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUser } from '@/api/useUser';
import { createProblem, uploadProblemImage } from '@/api/client';

const router = useRouter();
const userStore = useUser();

const form = ref({
  title: '',
  address: '',
  description: '',
});

const files = ref([]);
const isSubmitting = ref(false);
const MAX_FILE_SIZE_MB = 20;
const MAX_TOTAL_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const handleFileUpload = (event) => {
  const newFiles = Array.from(event.target.files);
  
  if (files.value.length + newFiles.length > 5) {
    alert('Максимальное количество файлов - 5');
    return;
  }

  const totalSize = [...files.value, ...newFiles].reduce((acc, file) => acc + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    alert(`Общий размер файлов не должен превышать ${MAX_FILE_SIZE_MB}MB`);
    return;
  }

  files.value = [...files.value, ...newFiles];
  event.target.value = '';
};

const removeFile = (index) => {
  files.value.splice(index, 1);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadFiles = async () => {
  const imageIds = [];
  
  for (const file of files.value) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const { id } = await uploadProblemImage(formData, userStore.token);
      imageIds.push(id);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      throw new Error('Не удалось загрузить файлы');
    }
  }
  
  return imageIds;
};

const handleSubmit = async () => {
  if (!userStore.isAuthenticated) {
    alert('Для создания проблемы необходимо авторизоваться');
    return router.push('/login');
  }

  try {
    isSubmitting.value = true;

    if (!form.value.title || !form.value.address || !form.value.description) {
      throw new Error('Заполните все обязательные поля');
    }

    const imageIds = await uploadFiles();

    const problemData = {
      title: form.value.title,
      address: form.value.address,
      description: form.value.description,
      images: imageIds,
    };

    const { id } = await createProblem(problemData, userStore.token);
    
    form.value = { title: '', address: '', description: '' };
    files.value = [];
    router.push(`/problems/${id}`);
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert(error.message || 'Произошла ошибка при создании проблемы');
  } finally {
    isSubmitting.value = false;
  }
};
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
            <label for="problem-title">Введите название проблемы</label>
            <input 
              type="text" 
              id="problem-title" 
              v-model="form.title"
              placeholder="Название проблемы" 
              required
              style="background: transparent"
            >
          </div>
          
          <div class="form-group">
            <label for="problem-address">Введите адрес проблемы</label>
            <input 
              type="text" 
              id="problem-address" 
              v-model="form.address"
              placeholder="Адрес" 
              required
              style="background: transparent"
            >
          </div>
          
          <div class="file-upload-group">
            <label>Прикрепите фото и/или видео</label>
            <div class="file-input-wrapper">
              <label for="file-upload" class="upload-btn">
                {{ files.length > 0 ? 'Добавить ещё' : 'Выбрать файл' }}
              </label>
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept=".png,.jpeg,.jpg,.wav,.mp4"
                hidden
                @change="handleFileUpload"
              >
              <div id="file-list" class="file-list">
                <div v-for="(file, index) in files" :key="index" class="file-item">
                  <span>{{ file.name }}</span>
                  <span>({{ formatFileSize(file.size) }})</span>
                  <button 
                    type="button" 
                    class="delete-btn" 
                    @click="removeFile(index)"
                  >×</button>
                </div>
              </div>
              <div class="file-formats">
                <span>Принимаемые форматы: PNG, JPEG/JPG, WAV, MP4 </span>
                <span>Максимум 5 файлов (общий размер до 20MB)</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="problem-description">Начните писать описание проблемы</label>
            <textarea 
              id="problem-description" 
              rows="5" 
              v-model="form.description"
              placeholder="Опишите проблему" 
              required
              style="background: transparent"
            ></textarea>
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