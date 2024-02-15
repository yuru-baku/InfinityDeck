<script setup lang="ts">
    import ArComponent from '@/components/ar-component/ArComponent.vue';
    import { ref } from 'vue';

    var showMenu = ref(false);
    var lobby = ref('missing');
    var userName = ref('mssing');
    
</script>


<template>
    <ArComponent></ArComponent>
    <div class="game-overlay">
        <div id="fixed-overlay-content">
            <div>
                <h1 class="game-title">MauMau</h1>
                <p class="quick-info" v-if="lobby && userName">{{ lobby }} - {{ userName }}</p>
            </div>
            <button type="button" class="settings-button" @click="showMenu = !showMenu">
                <font-awesome-icon icon="gear" />
            </button>
            </div>
        <div v-if="showMenu" id="menu">
            {{ userName }}
        </div>
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