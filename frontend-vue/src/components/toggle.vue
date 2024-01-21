<script setup lang="ts">

const props = defineProps({
  isOn: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits([ 'click' ])
</script>

<template>
  <label class="toggle-button" >
    <input class="toggle-input" type="checkbox" value="isOn" @click="$emit('click', $event)" />
    <span class="toggle-slider"></span>
  </label>
</template>
