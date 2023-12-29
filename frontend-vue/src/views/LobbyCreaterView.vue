<script setup lang="ts">
    import { ref } from 'vue';
    //@ts-ignore
    import { useWebSocketStore } from '../stores/webSocketStore';

    type User = {
        name: string,
        id: string,
        isOwner: boolean
    }
    const store = useWebSocketStore();
    console.log(store.webSocket)
    let users = ref([] as User[]);
    let you = ref();
    let selectedGame = ref();
    let local = ref();

    store.webSocket.send(JSON.stringify({ action: 'getRoomInfo' }));
    store.webSocket.addEventListener('message', (event : MessageEvent) => {
        const data = JSON.parse(event.data);
        switch (data.action) {
            case 'gotRoomInfo': {
                users.value = data.data.users;
                you.value = data.data.you;
                selectedGame.value = data.data.selectedGame;
                local.value = data.data.local;
                break;
            }
            case 'joined': {
                users.value.push(data.data.user);
                break;
            }
            case 'started': {
                // ToDo: route to game
            }
        }
    });
</script>

<template>
    <main class="vertical">
        <div id="playerList" class="frame">
            <div class="playerStatus" v-for="user, i in users" :key="user.id">
                <div class="playerOnline"></div>{{  user.name }}
            </div>
            <div class="playerStatus" v-for="i in (4 - users.length)">
                <div class="playerOffline"></div>empty
            </div>
            <button id="invite">Copy Invite</button>
        </div>
        <div id="playerList" class="frame">
            <div id="chooseGame">
                <p>ROMME</p>
                <p>UNO</p>
            </div>
            <div></div>
        </div>
        <button>Start</button>
    </main>
</template>