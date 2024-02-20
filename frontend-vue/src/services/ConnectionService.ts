import { ref } from 'vue';
import { useWebSocketStore } from '@/stores/webSocketStore';
import { useRouter, type Router } from 'vue-router';
import type { Room } from '@/model/room';
import { useCookies } from '@vueuse/integrations/useCookies';
import type { User } from '@/model/user';


let router: Router;
let store: any;
const cookies = useCookies(['username', 'roomId', 'userId']);

export let room = ref<Room>();
export let you = ref<User>();


/**
 * Tests if we already have a Websocket Connection otherwise tries to reconnect
 */
export function testConnection() {
    if (!store) {
        store = useWebSocketStore();
        router = useRouter();
    }
    // maybe we need to reconnect
    if (!store.webSocket || store.webSocket === null) {
        connect();
    } else {
        // wait with init function until websocket connection was confirmed
        addListeners();
    }
}
export function setup() {
    store = useWebSocketStore();
    router = useRouter();
}

/**
 * Handles a connection or reconnection
 */
export function connect() {
    let roomId = router.currentRoute.value.query.roomId || cookies.get('roomId');
    let userId = cookies.get('userId');
    let name = cookies.get('username');

    store.changeWebSocket(new WebSocket(`${import.meta.env.VITE_BACKEND_ENDPOINT}?name=${name}&roomId=${roomId}&userId=${userId}`));
    const abortController = new AbortController();
    store.webSocket.addEventListener('message', (event: MessageEvent) => {
        const inLandingPage = router.currentRoute.value.name === 'landing-page';
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.action === 'connected') {
            if (inLandingPage) {
                cookies.set('userId', data.data.you.id);
                cookies.set('roomId', data.data.roomId);
                // navigate to lobby
                router.push(`/lobby?roomId=${data.data.roomId}`)
            } else {
                addListeners();
            }
        } else {
            console.error('Could not join!');
            if (!inLandingPage) { // redirect if we are not already there
                router.push(`/?roomId=${data.data.roomId}`);
            }
        }
        abortController.abort();
    }, { signal: abortController.signal });
}

/**
 * Starts the game, should only be callable if we are an admin.
 */
export function startGame() {
  store.webSocket.send(JSON.stringify({ action: 'start' }));
}

export function toggleLocal() {
    if (!room.value || !you.value?.isOwner) return;
    console.log(!room.value.isLocal)
    store.webSocket.send(JSON.stringify({ action: 'changeSettings', data: { isLocal: !room.value.isLocal } }));
}

/**
 * Main stuff of setup
 */
export function addListeners() {
    store.webSocket.send(JSON.stringify({ action: 'getRoomInfo' }));
    store.webSocket.addEventListener('message', (event : MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log(data.action, data);
        switch (data.action) {
            case 'gotRoomInfo':
                room.value = data.data;
                you.value = data.data.you;
                if (data.data.state === 'inGame') {
                    router.push(`/${data.data.selectedGame}?roomId=${data.data.roomId}`);
                }
                break;
            case 'settingsChanged':
                room.value!.isLocal = data.data.isLocal || false;
                console.log(room.value?.isLocal)
                break;
            case 'joined':
                if (!room.value) return;
                room.value.users.push(data.data.user);
                break;
            case 'disconnected':
                var user = room.value?.users.find(user => user.id === data.data.id);
                if (user) {
                    user.disconnected = true;
                }
                break;
            case 'reconnected':
                var user = room.value?.users.find(user => user.id === data.data.user.id);
                if (user) {
                    user.disconnected = false;
                    console.log(user);
                }
                break;
            case 'started':
            case 'dealCards':
                if (!room.value) return;
                router.push(`/${room.value.selectedGame}?roomId=${data.data.roomId}`);
                break;
            default:
                console.warn('Unhandeld action', data.action, data);
        }
    });
}