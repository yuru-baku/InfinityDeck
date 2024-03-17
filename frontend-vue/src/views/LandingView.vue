<script setup lang="ts">
import startButton from '@/components/startButton.vue';
import { ConnectionService } from '@/services/ConnectionService';
import { useCookies } from '@vueuse/integrations/useCookies';
import { onUnmounted, ref } from 'vue';

const conService = new ConnectionService(false);
const cookies = useCookies(['username']);
let name = ref(cookies.get('username') || '');
function joinRoom() {
    cookies.set('username', name.value);
    conService.tryConnection();
}
onUnmounted(() => {
    conService.killConnection();
});
</script>

<template>
    <main class="vertical">
        <form class="frame" id="name-chooser">
            <label for="nickname">Choose your name</label>
            <input type="text" id="nickname" default="LustigerName420" v-model="name" />
            <!-- <button type="button" class="startButton" @click="joinRoom()">Start</button> -->
            <startButton @click="joinRoom()"></startButton>
        </form>
    </main>
</template>
