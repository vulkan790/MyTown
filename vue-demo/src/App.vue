<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
</script>

<template>
  <div class="wrapper">
    <AppHeader />
    <RouterView />
    <AppFooter />
  </div>
</template>

<style src="./styles.css"></style>
