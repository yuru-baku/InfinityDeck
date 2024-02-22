<script setup lang="ts">
const emit = defineEmits(['click']);
</script>

<template>
    <button type="button" class="startButton" @click="$emit('click', $event)">
        <font-awesome-icon icon="fa-play" />
        <label>Start</label>
    </button>
</template>
