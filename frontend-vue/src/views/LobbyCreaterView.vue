<script setup lang="ts">
  import { ref } from 'vue';
  import { useWebSocketStore } from '../stores/webSocketStore.js';

  const store = useWebSocketStore();
  console.log(store.webSocket)

//   let model = defineModel<WebSocket>('socket', { type: WebSocket, required: true });

</script>

<template>
    <main class="vertical">
        <div id="playerList" class="frame">
            <div class="playerStatus">
                <div class="playerOnline"></div>Player420
            </div>
            <div class="playerStatus">
                <div class="playerOffline"></div>empty
            </div>
            <div class="playerStatus">
                <div class="playerOffline"></div>empty
            </div>
            <div class="playerStatus">
                <div class="playerOffline"></div>empty
            </div>
            <button id="invite">Copy Invite</button>
        </div>
        <div id="playerList" class="frame">
            <div id="chooseGame">
                <p>ROMME</p>
                <p>UNO</p>
            </div>
            <div></div>
        </div>
        <button>Start</button>
    </main>
</template>