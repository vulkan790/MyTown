<script setup>
import { storeToRefs } from 'pinia'

import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'

const { user } = storeToRefs(useUser())
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
                ref="fileInput"
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
                    class="remove-file" 
                    @click="removeFile(index)"
                  >
                  </button>
                </div>
              </div>
              <div class="file-formats">
                <span>Принимаемые форматы: PNG, JPEG/JPG, WAV, MP4</span>
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
            ></textarea>
          </div>
          
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Отправка...' : 'Опубликовать' }}
          </button>
        </form>
      </div>
    </div>
  </main>
  
</template>