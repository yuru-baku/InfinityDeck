<script setup lang="ts">
const props = defineProps({
    isOn: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['clicks']);
</script>

<template>
    <label class="toggle-button" :class="{ disabled: disabled }">
        <input
            class="toggle-input"
            type="checkbox"
            :checked="isOn"
            :value="isOn"
            @click="$emit('clicks', $event)"
            :disabled="disabled"
        />
        <span class="toggle-slider"></span>
    </label>
</template>
