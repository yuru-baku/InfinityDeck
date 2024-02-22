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
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="frame toggleDiscription">
    <div>
      <h2 class="toggleHeader">{{ header }}</h2>
      <p class="toggleInfo">{{ info }}</p>
    </div>
    <toggle
      :isOn="isOn"
      :disabled="disabled"
      @clicks="
        (event) => {
          console.log(event)
          $emit('toggle', event)
        }
      "
    ></toggle>
  </div>
</template>
