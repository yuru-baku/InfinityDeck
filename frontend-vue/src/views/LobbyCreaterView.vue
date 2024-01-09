<script setup lang="ts">
import { ref } from 'vue'
import { useWebSocketStore } from '@/stores/webSocketStore'
import { useRouter } from 'vue-router'
import startButton from '@/components/startButton.vue'
import toggleDiscription from '@/components/toggleDiscription.vue'
import type { User } from '@/model/user'
import type { Room } from '@/model/room'

const router = useRouter()

const store = useWebSocketStore()
console.log(store.webSocket)
let room = ref()
let users = ref([] as User[])
let you = ref()
let selectedGame = ref('maumau')
let local = ref()

store.webSocket.send(JSON.stringify({ action: 'getRoomInfo' }));
store.webSocket.addEventListener('message', (event : MessageEvent) => {
    const data = JSON.parse(event.data);
    switch (data.action) {
        case 'gotRoomInfo': {
            room = data.data;
            break;
        }
        case 'joined': {
            users.value.push(data.data.user);
            break;
        }
        case 'started': {
          router.push(`/${selectedGame.value}?roomId=${data.data.roomId}`)
        }
    }
});
</script>

<template>
  <main class="lobby">
    <div id="playerList" class="frame">
      <div class="playerStatus" v-for="(user, i) in users" :key="user.id">
        <font-awesome-icon icon="circle" />
        <div class="playerOnline"></div>
        {{ user.name }}
      </div>
      <div class="playerStatus" v-for="i in 4 - users.length">
        <font-awesome-icon icon="circle" />
        <div class="playerOffline"></div>
        empty
      </div>
      <button id="invite">Copy Invite</button>
    </div>

    <div class="column">
      <div id="gameSettings" class="frame">
        <div id="chooseGame" class="frame">
          <div class="frame">ROMME</div>
          <div class="frame">UNO</div>
        </div>
        <div class="frame gameConfig">
          <toggleDiscription isOn></toggleDiscription>
          <toggleDiscription header="IsOn" info="Some info" :isOn="true"></toggleDiscription>
          <toggleDiscription header="IsOff" info="Click ME!" :isOn="false"></toggleDiscription>
          <toggleDiscription header="IsDefaultOff" info="I am friendly"></toggleDiscription>
        </div>
      </div>
    <startButton></startButton>
    </div>
  </main>
</template>
