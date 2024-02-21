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
                <p class="quick-info" v-if="conService.room.value?.id && conService.you.value?.name">{{ conService.room.value.id }} - {{ conService.you.value.name }}</p>
            </div>
            <button type="button" class="settings-button" @click="showMenu = !showMenu">
                <font-awesome-icon icon="gear" />
            </button>
            </div>
        <pre v-if="showMenu && conService.you" id="menu">
            {{ '\n' + JSON.stringify(conService.you, null, 2) }}
            {{ '\n' + JSON.stringify(conService.game, null, 2) }}
        </pre>
    </div>
</template>


<style lang="scss">
    @import '@/styles/style.sass';
    .game-overlay {
        // border: 1px solid red;
        z-index: 1000;
        position: absolute;
        top: 10px;
        right: 10px;
        width: auto;
        background-color: rgba(255, 255, 255, .4);
        padding: 1rem;
        max-height: 80%;
        overflow: auto;
        
        #fixed-overlay-content {
            display: flex;
            flex-direction: row;
            align-items: center;

            .game-title, .quick-info {
                padding: 0;
                margin: 0;
            }
        }
        .settings-button {
            width: 2vw;
            height: 2vw;
            background: none;
            border: none;
            cursor: pointer;
            filter: none;
            svg {
                width: 100%;
                height: 100%;
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
        object-fit:  cover;
    }
</style>