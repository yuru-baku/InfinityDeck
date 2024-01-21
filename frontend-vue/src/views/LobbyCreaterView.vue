<script setup lang="ts">
import { ref } from 'vue'
import { useWebSocketStore } from '@/stores/webSocketStore'
import { useRouter } from 'vue-router'
import startButton from '@/components/startButton.vue'
import toggleDiscription from '@/components/toggleDiscription.vue'
import type { User } from '@/model/user'
import type { Room } from '@/model/room'
import { Game } from '@/model/room'
import { useCookies } from '@vueuse/integrations/useCookies'

const router = useRouter()

const store = useWebSocketStore()
const cookies = useCookies(['username', 'roomId', 'userId'])

const games = Object.keys(Game).filter((key: any) => typeof Game[key] === 'number');

let room = ref<Room>()
// let users = ref([] as User[])
let you = ref()
let local = ref()


function reconnect() {
  let roomId = router.currentRoute.value.query.roomId || cookies.get('roomId')
  let userId = cookies.get('userId');
  let name = cookies.get('username');

  store.changeWebSocket(new WebSocket(`ws://localhost:8080?name=${name}&roomId=${roomId}&userId=${userId}`))
  const abortController = new AbortController();
  store.webSocket.addEventListener('message', (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    console.log(data)
    if (data.action === 'connected') {
      init();
    } else {
      console.error('Could not join!');
      router.push(`/?roomId=${data.data.roomId}`)
    }
    abortController.abort();
  }, { signal: abortController.signal });
}
function startGame() {
  store.webSocket.send(JSON.stringify({ action: 'start' }));
}
/**
 * Main stuff of setup
 */
function init() {
  store.webSocket.send(JSON.stringify({ action: 'getRoomInfo' }));
  store.webSocket.addEventListener('message', (event : MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log(data.action, data)
      switch (data.action) {
          case 'gotRoomInfo':
              room.value = data.data;
              you.value = data.data.you;
              if (data.data.state === 'inGame') {
                router.push(`/${data.data.selectedGame}?roomId=${data.data.roomId}`)
              }
              break;
          case 'joined':
              if (!room.value) return;
              room.value.users.push(data.data.user);
              break;
          case 'disconnected':
            var user = room.value?.users.find(user => user.id === data.data.id);
            if (user) {
              user.disconnected = true;
            }
            break;
          case 'reconnected':
            var user = room.value?.users.find(user => user.id === data.data.user.id);
            if (user) {
              user.disconnected = false;
              console.log(user)
            }
            break;
          case 'started':
          case 'dealCards':
            if (!room.value) return;
            router.push(`/${room.value.selectedGame}?roomId=${data.data.roomId}`)
            break;
      }
  });
}

// maybe we need to reconnect
if (!store.webSocket || store.webSocket === null) {
  reconnect();
} else {
  // wait with init function until websocket connection was confirmed
  init();
}

function copyToClipboard() {
  navigator.clipboard.writeText(window.location.origin + window.location.search);
}

</script>

<template>
  <main class="lobby" v-if="room && you">
    <div id="playerList" class="frame">
      <div class="playerStatus" v-for="(user, i) in room.users" :key="user.id" :class="{ online: !user.disconnected, offline: user.disconnected }">
        <font-awesome-icon icon="circle" v-if="user.id !== you.id" />
        <font-awesome-icon icon="play" v-if="user.id === you.id" />
        {{ user.name }}
      </div>
      <div class="playerStatus empty" v-for="i in 4 - room.users.length">
        <font-awesome-icon icon="circle" />
        empty
      </div>
      <button id="invite" @click="copyToClipboard()">Copy Invite</button>
    </div>

    <div class="column">
      <div id="gameSettings" class="frame">
        <div id="chooseGame" class="frame">
          <div class="frame" v-for="game in games" :class="{ selected: game === room.selectedGame.toString() }">{{ game }}</div>
        </div>
        <div class="frame gameConfig">
          <toggleDiscription header="Local" info="are you playing across the table or the ocean?" :isOn="room.isLocal" @click="room.isLocal = !room.isLocal;"></toggleDiscription>
          <toggleDiscription header="IsOn" info="Some info" :isOn="true"></toggleDiscription>
          <toggleDiscription header="IsOff" info="Click ME!" :isOn="false"></toggleDiscription>
          <toggleDiscription header="IsDefaultOff" info="I am friendly"></toggleDiscription>
        </div>
      </div>
    <startButton @click="startGame()"></startButton>
    </div>
  </main>
</template>
