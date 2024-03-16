<script setup lang="ts">
import ArComponent from '@/components/ar-component/ArComponent.vue';
import { CardService } from '@/services/CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { ref, onUnmounted } from 'vue';

var showMenu = ref(false);
var showUsers = ref(false);
var showSettings = ref(false);
let settingA = ref<number | null>(null);
let settingB = ref<number | null>(null);

let conService = new ConnectionService();
let cardService = new CardService(conService);

const arComponentViewRef = ref();

function toggleHand() {
    arComponentViewRef.value.toggleHand();
}
function submitSettings() {
    arComponentViewRef.value.changeSettings(settingA, settingB);
}

onUnmounted(() => {
    conService.killConnection();
});
</script>

<template>
    <ArComponent
        ref="arComponentViewRef"
        :card-service="cardService"
        :con-service="conService"
    ></ArComponent>
    <div class="game-overlay">
        <div id="fixed-overlay-content">
            <div class="quick-info-container">
                <h1 class="game-title">{{ conService.room.value?.selectedGame }}</h1>
                <p class="quick-info" v-if="conService.room.value?.id">
                    RoomID: {{ conService.room.value.id }}
                </p>
                <p class="quick-info" v-if="conService.you.value?.name">
                    Player: {{ conService.you.value.name }}
                </p>
            </div>
            <div class="preAndButtonsRow">
                <div class="buttons">
                    <button type="button" @click="showMenu = !showMenu">
                        <font-awesome-icon :icon="['fas', 'bars']" />
                    </button>
                    <button type="button" @click="showUsers = !showUsers" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'users']" />
                    </button>
                    <button type="button" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'comments']" />
                    </button>
                    <button type="button" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'dice-d20']" />
                    </button>
                    <div class="spacer" v-if="showMenu"></div>
                    <button type="button" @click="$router.go(-1)" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />
                    </button>
                    <button type="button" @click="toggleHand" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'hand']" />
                    </button>
                    <button type="button" @click="showSettings = !showSettings" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'gear']" />
                    </button>
                </div>
            </div>
        </div>
        <div class="number-input" v-if="showSettings && showMenu">
            <input type="number" v-model="settingA" />
            <br />
            <input type="number" v-model="settingB" />
            <br />
            <button @click="submitSettings">
                <font-awesome-icon :icon="['fas', 'hammer']" />
            </button>
        </div>
    </div>
</template>

<style lang="scss">
@import '@/styles/style.sass';

.game-overlay {
    z-index: 1000;
    position: absolute;
    top: 1vh;
    right: 1vh;
    max-height: 98vh;
    height: auto;
    width: auto;
    background-color: rgba(255, 255, 255, 0.4);
    padding: 8pt;
    overflow: auto;

    #fixed-overlay-content {
        display: grid;
        grid-template-columns: auto auto;
        height: 100%;
        align-items: start;

        .game-title,
        .quick-info {
            padding: 0 auto;
            margin: 0 auto;
        }
        .preAndButtonsRow {
            height: 100%;
            display: flex;
            flex-direction: row;
        }
        .buttons {
            display: flex;
            flex-direction: column;
            height: 100%;
            // gap: 1rem;
            .spacer {
                flex-grow: 2;
                height: 100%;
            }
        }

        button {
            aspect-ratio: 1;
            justify-content: center;
            align-items: center;
            border: none;
            background-color: rgba(255, 255, 255, 0.2);
            cursor: pointer;
            filter: none;
            padding: 0;
            margin: 0;
            svg {
                padding: 8px;
                font-size: 32px;
                width: 32px;
                height: 32px;
            }
            &:last-child:not(:first-child) {
                margin-top: auto;
            }
        }
    }
    input {
        aspect-ratio: 8;
        border: none;
        background-color: rgba(255, 255, 255, 0.2);
        cursor: pointer;
        filter: none;
        padding: 0;
        margin: 0;
        margin-top: 10px;
        display: block;
        font-size: 16px;
    }
}

body {
    overflow: hidden;
}

video {
    // position: absolute;
    // left: 0;
    // top: 0;
    // width: 100% !important;
    // height: 100% !important;
    // margin: 0 !important;
    border-radius: 0;
    object-fit: cover;
}
.a-canvas {
    position: fixed !important;
}
html.a-fullscreen .a-canvas {
    width: auto !important;
    height: auto !important;
}
</style>
