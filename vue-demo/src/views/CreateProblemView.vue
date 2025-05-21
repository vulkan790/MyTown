<script setup>
import { storeToRefs } from 'pinia'

import { useUser } from '@/api/useUser'

import AppHeader from '@/components/AppHeader.vue'

const { user } = storeToRefs(useUser())
</script>

<template>
  <AppHeader />

</template>
