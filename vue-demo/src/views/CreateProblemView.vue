<script setup>
import { storeToRefs } from 'pinia'

import { useUser } from '@/api/useUser'

const { user } = storeToRefs(useUser())
</script>

<template>
  <main class="main">
    <div class="container">
      <section class="first">
        <div class="left-problem">
          <img src="../images/problem-img.jpg" alt="Проблема" class="first__photo"
            style="width: 550px; margin-top: 100px;">
          <div class="group__statusbar-user">
            <img src="../images/user-png.png" alt="user" class="group__statusbar-user-logo">
            <span class="group__statusbar-user-name">Вайсеров Вадим Юрьевич</span>
          </div>
        </div>
        <div class="right-problem">
          <div class="problem__address">
            <h2 class="title-address">Адрес</h2>
            <p class="text-address">Ростовская обл., Таганрог, ул. Розы Люксембург, 240-5, р-н Центральный</p>
          </div>
          <div class="problem__description">
            <h2 class="title-address">Описание</h2>
            <p class="text-address"> Сегодня во время сильного ветра огромное дерево рухнуло прямо на мой дом. Ветки
              повредили крышу, выбили стекло на втором этаже, а ствол перекрыл вход. Сейчас невозможно безопасно зайти
              внутрь, есть риск дальнейшего разрушения. Нужна срочная помощь коммунальных служб для удаления дерева и
              проверки конструкции здания</p>
          </div>
          <p class="question-problem" style="margin-left: 210px">Стоит ли решать данную проблему?</p>
          <div class="problem__status">
            <li class="status-number">45 голосов</li>
            <li class="btn-answer">Да</li>
            <li class="btn-answer">Нет</li>
          </div>
        </div>
      </section>
      <section class="second">
        <div class="comments-section">
          <div class="mynic-comments">
            <h1 class="main-text-mynic" style="margin-top: 180px;">Комментарии муниципалитета</h1>
            <div class="comments-list">
              <div class="comment">
                <div class="comment-header">
                  <img src="../images/user-png.png" alt="user" class="comment-avatar">
                  <div class="comment-author-info">
                    <span class="comment-author">Имя Фамилия Отчество</span>
                    <span class="comment-time">15:30 23.02.2025</span>
                  </div>
                </div>
                <p class="comment-text">Работаем, вызвали ещё спасателей</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
