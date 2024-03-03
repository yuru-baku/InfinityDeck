<script setup lang="ts">
const props = defineProps({
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['click']);
</script>

<template>
    <button type="button" class="startButton" :class="{ disabled: disabled }" @click="$emit('click', $event)" :disabled="disabled">
        <font-awesome-icon icon="fa-play" />
        <label>Start</label>
    </button>
</template>
