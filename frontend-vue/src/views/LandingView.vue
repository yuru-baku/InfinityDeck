<script setup lang="ts">
  import { ref } from 'vue';

  let name = ref('');
  let socket: WebSocket;

  function joinRoom() {
      socket = new WebSocket(`ws://localhost:8080?name=${name}`);

      socket.addEventListener('message', (event) => {
          console.log(event)
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
