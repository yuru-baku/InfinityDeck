<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useWebSocketStore } from '../stores/webSocketStore.js';

  const router = useRouter();
  const store = useWebSocketStore();

  let name = ref('');
  // let socket: WebSocket;

  function joinRoom() {
    store.changeWebSocket(new WebSocket(`ws://localhost:8080?name=${name}`));

    store.webSocket.addEventListener('message', (event) => {
      console.log(event)
    });
    console.log(store.webSocket)
    // navigate to lobby 
    router.push('/lobby');
  }
</script>

<template>
  <main class="vertical">
    <form class="frame">
        <label for="nickname">Choose your name</label>
        <input type="text" id="nickname" default="LustigerName420" v-model="name">
        <button type="button" class="startButton" @click="joinRoom()">Start</button>
    </form>
  </main>
</template>

<style lang="scss">
  @import "@/styles/style.sass";
</style>
