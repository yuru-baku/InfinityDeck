<script setup lang="ts">
import ArComponent from '@/components/ar-component/ArComponent.vue';
import { GAME_CONFIG } from '@/model/game';
import { CardService } from '@/services/CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { onUnmounted, ref } from 'vue';

var showMenu = ref(false);
var showHand = ref(false);
let handSpacing = ref<number | null>(null);
let pinHideZone = ref(false);
let pinShareZone = ref(false);
let debugOverlay = ref(false);
let cardSize = ref<number | null>(null);
let resolution = ref();

let conService = new ConnectionService();
let cardService = new CardService(conService);

const arComponentViewRef = ref();

function toggleHand(): void {
    showHand.value = !showHand.value;
    arComponentViewRef.value.toggleHand();
}
function setHandSpacing(): void {
    arComponentViewRef.value.setHandSpacing(handSpacing);
}
function setCardSize(): void {
    arComponentViewRef.value.setCardSize(cardSize);
}
function setResolution(): void {
    arComponentViewRef.value.setResolution(resolution);
}
function shuffle(): void {
    conService.sendMessage('shuffleDrawPile', {});
}
function endGame(): void {
    conService.sendMessage('end', {});
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
        :pin-hide-zone="pinHideZone"
        :pin-share-zone="pinShareZone"
        :debug-overlay="debugOverlay"
    ></ArComponent>
    <div class="game-overlay" :class="showMenu ? 'expanded' : ''">
        <div id="left-container" v-if="showMenu">
            <div class="quick-info-container" v-if="showMenu">
                <h1 class="game-title" v-if="conService.room.value?.selectedGame">
                    {{ GAME_CONFIG[conService.room.value?.selectedGame || ''].label }}
                </h1>
                <p class="quick-info" v-if="conService.room.value?.id">
                    RoomID: {{ conService.room.value.id }}
                </p>
                <p class="quick-info" v-if="conService.you.value?.name">
                    Player: {{ conService.you.value.name }}
                    {{ conService.you.value.isOwner ? '(owner)' : '' }}
                </p>
            </div>

            <div id="settings" v-if="showMenu">
                <div class="number-input">
                    <label for="cardSize">card size</label>
                    <input
                        @change="setCardSize"
                        type="range"
                        id="cardSize"
                        v-model="cardSize"
                        min="30"
                        max="200"
                        defaultValue="100"
                    />
                </div>
                <div class="number-input">
                    <label for="cardSpacing">hand card spacing</label>
                    <input
                        @change="setHandSpacing"
                        type="range"
                        id="cardSpacing"
                        v-model="handSpacing"
                        min="30"
                        max="200"
                        defaultValue="20"
                    />
                </div>
            </div>
        </div>
        <div class="buttons">
            <button
                type="button"
                @click="showMenu = !showMenu"
                :class="showMenu ? 'active' : 'non-active'"
            >
                <font-awesome-icon :icon="['fas', 'bars']" />
            </button>
            <button
                type="button"
                @click="pinShareZone = !pinShareZone"
                :class="pinShareZone ? 'active' : 'non-active'"
            >
                <font-awesome-icon :icon="['fas', 'share-nodes']" />
            </button>
            <button
                type="button"
                @click="pinHideZone = !pinHideZone"
                :class="pinHideZone ? 'active' : 'non-active'"
            >
                <font-awesome-icon :icon="['fas', 'eye-slash']" />
            </button>
            <button
                type="button"
                @click="toggleHand"
                v-if="showMenu"
                :class="showHand ? 'active' : 'non-active'"
            >
                <font-awesome-icon :icon="['fas', 'hand']" />
            </button>
            <!-- <button
                type="button"
                @click="showUsers = !showUsers"
                v-if="showMenu"
                :class="showUsers ? 'active' : 'non-active'"
            >
                <font-awesome-icon :icon="['fas', 'users']" />
            </button> -->
            <button type="button" @click="shuffle" v-if="showMenu && conService.you.value?.isOwner">
                <font-awesome-icon :icon="['fas', 'shuffle']" />
            </button>
            <button
                type="button"
                @click="debugOverlay = !debugOverlay"
                :class="debugOverlay ? 'active' : 'non-active'"
                v-if="showMenu"
            >
                <font-awesome-icon :icon="['fas', 'bug']" />
            </button>
            <button type="button" @click="endGame" v-if="showMenu && conService.you.value?.isOwner">
                <font-awesome-icon :icon="['fas', 'door-open']" />
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
    padding: 8pt;
    overflow: auto;
    justify-content: end;

    display: flex;
    flex-direction: row;

    &.expanded {
        background-color: rgba(255, 255, 255, 0.9);
    }

    #left-container {
        font-size: 12pt;
        display: flex;
        flex-direction: column;
        .quick-info-container {
            justify-items: right;
            .game-title,
            .quick-info {
                padding: 0 auto;
                margin: 0 auto;
            }
        }

        #settings {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 0.8rem;
            .number-input {
                border-radius: 0;
                display: flex;
                flex-direction: column;
                margin: 0;
                padding: 0;
                gap: 0.2rem;
                label {
                    margin: 0;
                    padding: 0;
                    border-radius: 0;
                }
                input {
                    width: 100%;
                    border-radius: 8px;
                    padding: 0;
                    margin: 0;
                }
            }
        }
    }

    .buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        button {
            aspect-ratio: 1;
            justify-content: center;
            align-items: center;
            border: none;
            padding: 0;
            svg {
                padding: 8px;
                font-size: 32px;
                width: 32px;
                height: 32px;
            }
        }
    }

    button:active,
    buttoon:hover,
    .active {
        background-color: #acaeb3;
    }

    non-active {
        background-color: #fff;
    }
}

body {
    overflow: hidden;
}

video {
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
