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
    drawCardCallbacks: ((markerId: string, cardName: string) => void)[] = [ ];

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
            const message = JSON.parse(event.data);
            if (message.action === 'connected') {
                this.cookies.set('userId', message.data.you.id);
                this.cookies.set('roomId', message.data.roomId);
                if (inLandingPage) {
                    // navigate to lobby
                    this.router.push(`/lobby?roomId=${message.data.roomId}`)
                } else {
                    this.addListeners();
                }
            } else {
                console.error('Could not join!');
                if (!inLandingPage) { // redirect if we are not already there
                    this.router.push(`/?roomId=${message.data.roomId}`);
                }
            }
            abortController.abort();
        }, { signal: abortController.signal });
    }

    /**
     * Main stuff of setup
     */
    public addListeners() {
        this.sendMessage('getRoomInfo', undefined);
        this.store.webSocket.addEventListener('message', (event : MessageEvent) => {
            const message = JSON.parse(event.data);
            console.log(message.action, message.data);
            switch (message.action) {
                case 'gotRoomInfo':
                    this.room.value = message.data.room;
                    this.game.value = message.data.game;
                    this.you.value = message.data.you;
                    if (message.data.state === 'inGame') {
                        this.router.push(`/${message.data.selectedGame}?roomId=${message.data.roomId}`);
                    }
                    if (message.data.state === 'initialising') {
                        this.router.push(`/lobby?roomId=${message.data.roomId}`);
                    }
                    this.connectionCallbacks.forEach((callback) => callback());
                    this.connectionCallbacks = [ ];
                    break;
                case 'settingsChanged':
                    this.room.value!.isLocal = message.data.isLocal || false;
                    break;
                case 'joined':
                    if (!this.room.value) return;
                    this.room.value.users.push(message.data.user);
                    break;
                case 'disconnected':
                    var user = this.room.value?.users.find(user => user.id === message.data.id);
                    if (user) {
                        user.disconnected = true;
                    }
                    break;
                case 'reconnected':
                    var user = this.room.value?.users.find(user => user.id === message.data.user.id);
                    if (user) {
                        user.disconnected = false;
                        console.log(user);
                    }
                    break;
                case 'started':
                case 'dealCards':
                    if (!this.room.value) return;
                    this.router.push(`/${this.room.value.selectedGame}?roomId=${this.room.value.id}`);
                    break;
                case 'drawCard':
                    this.drawCardCallbacks.forEach((callback) => callback(message.data.markerId, message.data.card))
                    break;
                default:
                    console.warn('Unhandled action', message.action, message.data);
            }
        });
    }

    // actions ======================================================================================================

    /**
     * Starts the game, should only be callable if we are an admin.
     */
    public startGame() {
        this.sendMessage('start', undefined);
    }

    public toggleLocal() {
        if (!this.room.value || !this.you.value?.isOwner) return;
        console.log(!this.room.value.isLocal)
        this.sendMessage('changeSettings', { isLocal: !this.room.value.isLocal });
    }

    public drawNewCard(markerId: string) {
        this.sendMessage('drawCard', { markerId: markerId });
    }

    public onConnection(callback: () => void) {
        if (this.game.value && this.room.value && this.you.value) {
            callback();
        }
        this.connectionCallbacks.push(callback);
    }

    public onCardDrawed(callback: (markerId: string, cardName: string) => void) {
        this.drawCardCallbacks.push(callback);
    }

    private sendMessage(action: string, data: any) {
        this.store.webSocket.send(JSON.stringify({ action: action, data: data }));
    }
}