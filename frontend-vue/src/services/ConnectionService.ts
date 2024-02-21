import { ref } from 'vue';
import { useRouter, type Router } from 'vue-router';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useWebSocketStore } from '@/stores/webSocketStore';
// import { registerMarker } from '@/components/ar-component/CardService';
import type { User } from '@/model/user';
import type { Game } from '@/model/game';
import type { Room } from '@/model/room';

export class ConnectionService {

    router: Router;
    store: any;
    cookies = useCookies(['username', 'roomId', 'userId']);
    connectionCallbacks: (() => void)[] = [ ];

    public room = ref<Room>();
    public game = ref<Game>();
    public you = ref<User>();

    constructor() {
        this.store = useWebSocketStore();
        this.router = useRouter();
        // maybe we need to reconnect
        if (!this.store.webSocket || this.store.webSocket === null) {
            this.connect();
        } else {
            // wait with init function until websocket connection was confirmed
            this.addListeners();
        }
    }

    /**
     * Handles a connection or reconnection
     */
    public connect() {
        let roomId = this.router.currentRoute.value.query.roomId || this.cookies.get('roomId');
        let userId = this.cookies.get('userId');
        let name = this.cookies.get('username');

        this.store.changeWebSocket(new WebSocket(`${import.meta.env.VITE_BACKEND_ENDPOINT}?name=${name}&roomId=${roomId}&userId=${userId}`));
        const abortController = new AbortController();
        this.store.webSocket.addEventListener('message', (event: MessageEvent) => {
            const inLandingPage = this.router.currentRoute.value.name === 'landing-page';
            const data = JSON.parse(event.data);
            if (data.action === 'connected') {
                if (inLandingPage) {
                    this.cookies.set('userId', data.data.you.id);
                    this.cookies.set('roomId', data.data.roomId);
                    // navigate to lobby
                    this.router.push(`/lobby?roomId=${data.data.roomId}`)
                } else {
                    this.addListeners();
                }
            } else {
                console.error('Could not join!');
                if (!inLandingPage) { // redirect if we are not already there
                    this.router.push(`/?roomId=${data.data.roomId}`);
                }
            }
            abortController.abort();
        }, { signal: abortController.signal });
    }

    /**
     * Main stuff of setup
     */
    public addListeners() {
        this.store.webSocket.send(JSON.stringify({ action: 'getRoomInfo' }));
        this.store.webSocket.addEventListener('message', (event : MessageEvent) => {
            const data = JSON.parse(event.data);
            console.log(data.action, data);
            switch (data.action) {
                case 'gotRoomInfo':
                    this.room.value = data.data.room;
                    this.game.value = data.data.game;
                    this.you.value = data.data.you;
                    if (data.data.state === 'inGame') {
                        this.router.push(`/${data.data.selectedGame}?roomId=${data.data.roomId}`);
                    }
                    this.connectionCallbacks.forEach((callback) => { console.log('calling', callback); callback()});
                    this.connectionCallbacks = [ ];
                    break;
                case 'settingsChanged':
                    this.room.value!.isLocal = data.data.isLocal || false;
                    console.log(this.room.value?.isLocal)
                    break;
                case 'joined':
                    if (!this.room.value) return;
                    this.room.value.users.push(data.data.user);
                    break;
                case 'disconnected':
                    var user = this.room.value?.users.find(user => user.id === data.data.id);
                    if (user) {
                        user.disconnected = true;
                    }
                    break;
                case 'reconnected':
                    var user = this.room.value?.users.find(user => user.id === data.data.user.id);
                    if (user) {
                        user.disconnected = false;
                        console.log(user);
                    }
                    break;
                case 'started':
                case 'dealCards':
                    if (!this.room.value) return;
                    this.router.push(`/${this.room.value.selectedGame}?roomId=${data.data.roomId}`);
                    break;
                case 'drawCard':
                    // registerMarker(data.data.markerId, data.data.card);
                    break;
                default:
                    console.warn('Unhandled action', data.action, data);
            }
        });
    }

    // actions ======================================================================================================

    /**
     * Starts the game, should only be callable if we are an admin.
     */
    public startGame() {
        this.store.webSocket.send(JSON.stringify({ action: 'start' }));
    }

    public toggleLocal() {
        if (!this.room.value || !this.you.value?.isOwner) return;
        console.log(!this.room.value.isLocal)
        this.store.webSocket.send(JSON.stringify({ action: 'changeSettings', data: { isLocal: !this.room.value.isLocal } }));
    }

    public drawNewCard(markerId: string) {
        this.store.webSocket.send(JSON.stringify({ action: 'drawCard', data: { markerId: markerId } }));
    }

    public onConnection(callback: () => void) {
        if (this.game.value && this.room.value && this.you.value) {
            callback();
        }
        this.connectionCallbacks.push(callback);
    }
}