<script setup lang="ts">
import { ref } from 'vue';
import { useCookies } from '@vueuse/integrations/useCookies';
import startButton from '@/components/startButton.vue';
import { ConnectionService } from '@/services/ConnectionService';

const conService = new ConnectionService(false);
const cookies = useCookies(['username']);
let name = ref(cookies.get('username') || '');
function joinRoom() {
    cookies.set('username', name.value);
    conService.connect();
}
// s
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
