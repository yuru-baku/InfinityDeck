<script setup lang="ts">
import startButton from '@/components/startButton.vue';
import toggleDescription from '@/components/toggleDescription.vue';
import { GAME_CONFIG } from '@/model/game';
import { ConnectionService } from '@/services/ConnectionService';
import { onUnmounted } from 'vue';

let conService = new ConnectionService();

function copyInviteToClipboard() {
    const inviteURL = window.location.origin + window.location.hash.replace('lobby', '');
    navigator.clipboard.writeText(inviteURL);
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
                v-for="(user, i) in conService.room.value?.users || []"
                :key="user.id"
                :class="{
                    online: !user?.disconnected,
                    offline: user.disconnected,
                    selected: user.id === conService.you.value?.id
                }"
            >
                <font-awesome-icon :icon="['fas', 'circle']" v-if="!user.isOwner" />
                <font-awesome-icon :icon="['fas', 'crown']" v-if="user.isOwner" />
                {{ user.name }}
            </div>
            <div
                class="playerStatus empty"
                v-for="i in 4 - (conService.room.value?.users.length || 0)"
            >
                <font-awesome-icon :icon="['fas', 'circle']" />
                empty
            </div>
            <button id="invite" @click="copyInviteToClipboard()">Copy Invite</button>
        </div>

        <div class="column">
            <div id="gameSettings" class="frame">
                <div id="chooseGame">
                    <button
                        class="game-option frame"
                        v-for="game in Object.values(GAME_CONFIG)"
                        :class="{
                            selected: game.id === conService.room.value?.selectedGame.toString(),
                            disabled: !conService.you.value.isOwner
                        }"
                        v-on:click="() => conService.changeGame(game.id)"
                    >
                        <img :src="`${game.basePath}/${game.cardBack}.svg`" />
                        <label>{{ game.label }}</label>
                    </button>
                </div>
                <div class="frame gameConfig">
                    <toggleDescription
                        header="Local"
                        info="are you playing across the table or the ocean?"
                        :isOn="conService.room.value?.isLocal"
                        :disabled="!conService.you.value?.isOwner"
                        @toggle="conService.toggleLocal()"
                    ></toggleDescription>
                    <div class="frame toggleDescription">
                        <div>
                            <h2>No cards?</h2>
                            <p>
                                You will need a set of marker-cards to play the game.<br />We
                                recommend you to print them on an A4-paper.
                            </p>
                        </div>
                        <a href="/InfinityDeck/markers.pdf" target="_blank" class="button"
                            >Print the Cards</a
                        >
                    </div>
                </div>
            </div>
            <startButton
                v-if="conService.room.value.state === 'inLobby'"
                @click="conService.startGame()"
                :disabled="!conService.you.value?.isOwner"
            ></startButton>
            <startButton
                v-if="conService.room.value.state === 'inGame'"
                @click="conService.navigateToGame()"
                label="Back to Game"
            ></startButton>
        </div>
    </main>
</template>
