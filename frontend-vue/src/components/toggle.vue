<script setup lang="ts">
const props = defineProps({
  isOn: {
    type: Boolean,
    default: false
  }
})

function iAmClicked(){
  console.log("I am clicked. Yay!")
}
</script>

<template>
  <input class="toggle" type="checkbox" v-bind:checked="isOn" @click="iAmClicked()" />
  <label class="toggle-button" ></label>
</template>
