<script setup lang="ts">
import startButton from '@/components/startButton.vue';
import toggleDiscription from '@/components/toggleDiscription.vue';
import { GameOption } from '@/model/room';
import { ConnectionService } from '@/services/ConnectionService';
import { onUnmounted } from 'vue';

const games = Object.keys(GameOption).filter((key: any) => typeof GameOption[key] === 'number');

let conService = new ConnectionService();

function copyToClipboard() {
    navigator.clipboard.writeText(window.location.origin + window.location.search);
}

onUnmounted(() => {
    conService.killConnection();
});
</script>

<template>
    <main class="lobby" v-if="conService.room.value && conService.you.value">
        <div id="playerList" class="frame">
            <div
                class="playerStatus"
                v-for="(user, i) in (conService.room.value?.users || [])"
                :key="user.id"
                :class="{ online: !user?.disconnected, offline: user.disconnected, selected: user.id === conService.you.value?.id }"
            >
                <font-awesome-icon
                    :icon="['fas', 'circle']"
                    v-if="!user.isOwner"
                />
                <font-awesome-icon
                    :icon="['fas', 'crown']"
                    v-if="user.isOwner"
                />
                {{ user.name }}
            </div>
            <div
                class="playerStatus empty"
                v-for="i in 4 - (conService.room.value?.users.length || 0)"
            >
                <font-awesome-icon :icon="['fas', 'circle']" />
                empty
            </div>
            <button id="invite" @click="copyToClipboard()">Copy Invite</button>
        </div>

        <div class="column">
            <div id="gameSettings" class="frame">
                <div id="chooseGame" class="frame">
                    <div
                        class="frame"
                        v-for="game in games"
                        :class="{
                            selected: game === conService.room.value?.selectedGame.toString()
                        }"
                    >
                        {{ game }}
                    </div>
                </div>
                <div class="frame gameConfig">
                    <toggleDiscription
                        header="Local"
                        info="are you playing across the table or the ocean?"
                        :isOn="conService.room.value?.isLocal"
                        :disabled="!conService.you.value?.isOwner"
                        @toggle="conService.toggleLocal()"
                    ></toggleDiscription>
                </div>
            </div>
            <startButton v-if="conService.room.value.state === 'inLobby'" @click="conService.startGame()" :disabled="!conService.you.value?.isOwner"></startButton>
            <startButton v-if="conService.room.value.state === 'inGame'" @click="conService.navigateToGame()" label="Back to Game"></startButton>
        </div>
    </main>
</template>
