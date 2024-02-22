<script setup lang="ts">
import ArComponent from '@/components/ar-component/ArComponent.vue';
import { CardService } from '@/components/ar-component/CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { ref } from 'vue';

var showMenu = ref(false);

const conService = new ConnectionService();
const cardService = new CardService(conService);
</script>

<template>
    <ArComponent :card-service="cardService" :con-service="conService"></ArComponent>
    <div class="game-overlay">
        <div id="fixed-overlay-content">
            <div>
                <h1 class="game-title">{{ conService.room.value?.selectedGame }}</h1>
                <p class="quick-info" v-if="conService.room.value?.id">
                    RoomID: {{ conService.room.value.id }}
                </p>
                <p class="quick-info" v-if="conService.you.value?.name">
                    Player: {{ conService.you.value.name }}
                </p>
            </div>
            <div class="preAndButtonsRow">
                <pre v-if="showMenu && conService.you" id="menu">
                {{ '\n' + JSON.stringify(conService.you.value, null, 2) }}
                {{ '\n' + JSON.stringify(conService.game.value, null, 2) }}
                </pre>
                <div class="buttons">
                    <button type="button" @click="showMenu = !showMenu">
                        <font-awesome-icon :icon="['fas', 'gear']" />
                    </button>
                    <button type="button">
                        <font-awesome-icon :icon="['fas', 'users']" />
                    </button>
                    <button type="button">
                        <font-awesome-icon :icon="['fas', 'comments']" />
                    </button>
                    <button type="button">
                        <font-awesome-icon :icon="['fas', 'dice-d20']" />
                    </button>
                    <button type="button">
                        <font-awesome-icon :icon="['fas', 'door-closed']" />
                    </button>
                </div>
            </div>
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
    height: 98vh;
    width: auto;
    background-color: rgba(255, 255, 255, 0.4);
    padding: 8pt;
    overflow: auto;

    #fixed-overlay-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        border: 1px solid orangered;
        align-items: end;

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
            border: 1px solid orange;
            display: flex;
            flex-direction: column;
            height: 100%;
            gap: 1rem;

            button {
                aspect-ratio: 1;
                justify-content: center;
                align-items: center;
                background: none;
                border: 1px solid black;
                cursor: pointer;
                filter: none;
                padding: 0;
                margin: 0;
                svg {
                    padding: 4px;
                    font-size: 32px;
                }
                &:last-child {
                    margin-top: auto;
                }
            }
        }
    }
}

body {
    overflow: hidden;
}

video {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0;
    object-fit: cover;
}
</style>
