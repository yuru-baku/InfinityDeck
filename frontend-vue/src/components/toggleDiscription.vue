<script setup lang="ts">
import toggle from './toggle.vue'
const props = defineProps({
  header: {
    type: String,
    default: 'Lorem Ipsum'
  },
  info: {
    type: String,
    default: 'Lorem Ipsium sit dalor'
  },
  isOn: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="frame toggleDiscription">
    <div>
      <h2 class="toggleHeader">{{ header }}</h2>
      <p class="toggleInfo">{{ info }}</p>
    </div>
    <toggle v-bind:isOn="isOn"></toggle>
  </div>
</template>
