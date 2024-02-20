<script setup lang="ts">
import startButton from '@/components/startButton.vue'
import toggleDiscription from '@/components/toggleDiscription.vue'
import { Game } from '@/model/room'
import { you, room, testConnection, startGame, toggleLocal } from '@/services/ConnectionService';

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
          <toggleDiscription header="Local" info="are you playing across the table or the ocean?" :isOn="room.isLocal" :disabled="!you.isOwner" @toggle="toggleLocal()"></toggleDiscription>
        </div>
      </div>
    <startButton @click="startGame()"></startButton>
    </div>
  </main>
</template>