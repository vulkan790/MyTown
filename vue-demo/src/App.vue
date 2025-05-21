<script setup>
import { RouterView } from 'vue-router'

import AppFooter from './components/AppFooter.vue';
</script>

<template>
  <div class="wrapper">
    <RouterView />
    <AppFooter />
  </div>
</template>

<style src="./styles.css"></style>
