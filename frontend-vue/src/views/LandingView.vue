<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useWebSocketStore } from '../stores/webSocketStore';

  const router = useRouter();
  const store = useWebSocketStore();
  let name = ref('');

  function joinRoom() {
    let roomId = router.currentRoute.value.query.roomId;
    console.log(roomId)
    store.changeWebSocket(new WebSocket(`ws://localhost:8080?name=${name.value}&roomId=${roomId}`));
    // ToDo remove this EventListener
    store.webSocket.addEventListener('message', (event : MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.action === 'connected') {
        // navigate to lobby 
        router.push(`/lobby?roomId=${data.data.roomId}`);
      } else {
        console.error('Could not join!');
      }
    });
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
