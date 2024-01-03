<script setup lang="ts">
defineProps({
  isOn: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <input class="toggle" type="checkbox" v-bind:checked="isOn" />
  <label class="toggleButton"></label>
</template>
