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
import { you, room, testConnection, startGame } from '@/services/ConnectionService';

const games = Object.keys(Game).filter((key: any) => typeof Game[key] === 'number');

testConnection();

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
@/services/ConnectionService