<script setup lang="ts">
import ArComponent from '@/components/ar-component/ArComponent.vue';
import { CardService } from '@/services/CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { ref, onUnmounted } from 'vue';

var showMenu = ref(false);
var showUsers = ref(false);
var showSettings = ref(false);
let handSpacing = ref<number | null>(null);
let cardSize = ref<number | null>(null);
let resolution = ref();

let conService = new ConnectionService();
let cardService = new CardService(conService);

const arComponentViewRef = ref();

function toggleHand() {
    arComponentViewRef.value.toggleHand();
}
function setHandSpacing() {
    arComponentViewRef.value.setHandSpacing(handSpacing);
}
function setCardSize() {
    arComponentViewRef.value.setCardSize(cardSize);
}
function setResolution(){
    arComponentViewRef.value.setResolution(resolution);
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
                    
                    <button type="button" @click="toggleHand" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'hand']" />
                    </button>
                    <button type="button" @click="showUsers = !showUsers" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'users']" />
                    </button>
                    <button type="button" @click="showMenu = !showMenu">
                        <font-awesome-icon :icon="['fas', 'bars']" />
                    </button>
                    <div class="spacer" v-if="showMenu"></div>

                    
                    <button type="button" @click="showSettings = !showSettings" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'gear']" />
                    </button>
                    <button type="button" @click="$router.go(-1)" v-if="showMenu">
                        <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />
                    </button>
                </div>
            </div>
        </div>
        <div id="number-input" v-if="showSettings && showMenu"> 
            <p> 
                <button class="settingsButton" @click="setCardSize">
                    <font-awesome-icon :icon="['fas', 'check']" />
                </button>
                <input type="number" v-model="cardSize" placeholder=100 ></input>
                card size
            </p>
            <p> 
                <button class="settingsButton" @click="setHandSpacing">
                    <font-awesome-icon :icon="['fas', 'check']" />
                </button>
                <input type="number" v-model="handSpacing" placeholder=20></input>
                hand card spacing
            </p>
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
    #number-input {
        input,
        select{
            aspect-ratio: 8;
            border: none;
            background-color: rgba(200, 200, 200, 0.5);
            padding: 0;
            margin: 0;            
            font-size: 16px;
            margin-top: 0%;
            float: right;

        }
        p {
        }
        input {
            width: 20%;
            border: 1px inset #ccc;
            }
        select {
            width: 45%;
        }
        button {
        border: none;
        background-color: rgba(255, 255, 255, 0.2);
        padding: 0;
        margin: 0;
        float: right;

        cursor: pointer;
            svg {
                padding: 3px;
                font-size: 13px;
                width: 13px;
                height: 13px;
            }
        margin-left: 2%;
        }
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
