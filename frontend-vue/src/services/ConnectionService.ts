import { ref } from 'vue';
import { useRouter, type Router } from 'vue-router';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useWebSocketStore } from '@/stores/webSocketStore';
import type { User } from '@/model/user';
import type { Game } from '@/model/game';
import type { Room } from '@/model/room';
import { Message } from '@/model/message';
import type { Card } from '@/model/card';

export class ConnectionService {
    router: Router;
    store: any;
    cookies = useCookies(['username', 'roomId', 'userId', 'lastGame']);
    connectionCallbacks: ((data: any) => void)[] = [];
    drawCardCallbacks: ((markerId: string, card: Card) => void)[] = [];
    controller = new AbortController();

    public room = ref<Room>();
    public game = ref<Game>();
    public you = ref<User>();

    constructor(tryToConnect = true) {
        this.store = useWebSocketStore();
        this.router = useRouter();
        if (!tryToConnect) {
            return;
        }
        // maybe we need to reconnect
        this.tryConnection();
    }

    public tryConnection() {
        if (!this.isConnected()) {
            console.log('connecting...');
            this.connect();
        } else {
            // wait with init function until websocket connection was confirmed
            this.addListeners();
        }
    }

    /**
     * Handles a connection or reconnection
     */
    private connect() {
        // check for open connection
        const roomId = this.router.currentRoute.value.query.roomId || this.cookies.get('roomId');
        const userId = this.cookies.get('userId');
        const name = this.cookies.get('username');

        this.store.changeWebSocket(
            new WebSocket(
                `${
                    import.meta.env.VITE_BACKEND_ENDPOINT
                }?name=${name}&roomId=${roomId}&userId=${userId}`
            )
        );
        const abortController = new AbortController();
        this.getSocket().addEventListener(
            'message',
            (event: MessageEvent) => {
                const inLandingPage = this.router.currentRoute.value.name === 'landing-page';
                const message = JSON.parse(event.data);
                console.log(message.action, message.data);
                if (message.action === 'connected') {
                    this.cookies.set('userId', message.data.you.id);
                    this.cookies.set('roomId', message.data.room.id);
                    if (inLandingPage) {
                        // navigate to lobby
                        this.router.push(`/lobby?roomId=${message.data.room.id || roomId}`);
                    } else {
                        this.addListeners();
                    }
                } else {
                    console.error('Could not join!');
                    if (!inLandingPage) {
                        // redirect if we are not already there
                        this.router.push(`/?roomId=${message.data.room.id || roomId}`);
                    }
                }
                abortController.abort();
            },
            { signal: abortController.signal }
        );
    }

    /**
     * Registers callback for events on the websocket.
     * @param action the action to listen for
     * @param callback the callback to be executet. The given connectionService can be used to anwer the requests.
     * @returns Eventlistener needed to remove the listener.
     */
    public addListener(
        action: string,
        callback: (data: any, conService: ConnectionService) => void
    ): EventListener {
        console.log('register new listener for action:', action);
        const listener = (event: any) => {
            const msg = new Message(event);
            if (msg.action == action) {
                callback(msg.data, this);
            }
        };
        this.getSocket().addEventListener('message', listener);
        return listener;
    }

    /**
     * Removes the event listener
     * @param listener the listener to be removed
     * @returns nothing
     */
    public removeListener(listener: EventListener): void {
        this.getSocket().removeEventListener('message', listener);
    }

    /**
     * Main stuff of setup
     */
    private addListeners() {
        this.sendMessage('getRoomInfo', undefined);
        this.getSocket().addEventListener(
            'message',
            (event: MessageEvent) => {
                const message = JSON.parse(event.data);
                console.log('new message:', message.action, message.data);
                switch (message.action) {
                    case 'gotRoomInfo':
                        console.log('gotRoomInfo');
                        this.room.value = message.data.room;
                        this.game.value = message.data.game;
                        this.you.value = message.data.you;
                        if (message.data.state === 'inGame') {
                            this.router.push(`/game?roomId=${message.data.room.id}`);
                        }
                        if (message.data.state === 'inLobby') {
                            this.router.push(`/lobby?roomId=${message.data.room.id}`);
                        }
                        this.connectionCallbacks.forEach((callback) => callback(message.data));
                        this.connectionCallbacks = [];
                        break;
                    case 'settingsChanged':
                        console.log('changed settings');
                        this.room.value!.isLocal = message.data.isLocal || false;
                        break;
                    case 'gameChanged':
                        this.room.value!.selectedGame = message.data.selectedGame;
                        this.game.value! = message.data.game;
                        break;
                    case 'joined':
                        console.log('join');
                        if (!this.room.value) return;
                        this.room.value.users.push({ ...message.data });
                        break;
                    case 'disconnected':
                        console.log('Disconnect');
                        var user = this.room.value?.users.find(
                            (user) => user.id === message.data.id
                        );
                        if (user) {
                            user.disconnected = true;
                        }
                        break;
                    case 'left':
                        console.log('Left');
                        if (!this.room.value) return;
                        this.room.value.users = this.room.value.users.filter(
                            (user) => user.id === message.data.id
                        );
                        break;
                    case 'reconnected':
                        console.log('Reconeccted', message.data);
                        var user = this.room.value?.users.find(
                            (player) => player.id === message.data.id
                        );
                        if (user) {
                            user.disconnected = false;
                            console.log(user);
                        }
                        break;
                    case 'started':
                        console.log('Game started');
                    case 'dealCards':
                        console.log('Deal Cards');
                        if (!this.room.value) return;
                        this.router.push(`/game?roomId=${this.room.value.id}`);
                        break;
                    case 'drawCard':
                        console.log('Draw Card');
                        this.drawCardCallbacks.forEach((callback) =>
                            callback(message.data.markerId, message.data.card)
                        );
                        break;
                    case 'end':
                        console.log('Game end')
                        this.cookies.set('lastGame', JSON.stringify(message.data));
                        if (!this.room.value) return;
                        this.router.push(`/summary?roomId=${this.room.value.id}`);
                    case 'error':
                        console.error('Error:', message.message);
                        break;
                }
            },
            { signal: this.controller.signal }
        );
    }

    // actions ======================================================================================================

    /**
     * Starts the game, should only be callable if we are an admin.
     */
    public startGame() {
        if (!this.room.value || !this.you.value?.isOwner) return;
        this.sendMessage('start', undefined);
    }

    public toggleLocal() {
        if (!this.room.value || !this.you.value?.isOwner) return;
        console.log(!this.room.value.isLocal);
        this.sendMessage('changeSettings', { isLocal: !this.room.value.isLocal });
    }

    public changeGame(game: string) {
        if (!this.room.value || !this.you.value?.isOwner) return;
        this.sendMessage('changeGame', { selectedGame: game });
    }

    public drawNewCard(markerId: string, lastSeen: number) {
        this.sendMessage('drawCard', { markerId: markerId, lastSeen: lastSeen });
    }

    public onConnection(callback: (data: any) => void) {
        if (this.game.value && this.room.value && this.you.value) {
            callback(undefined);
        }
        this.connectionCallbacks.push(callback);
    }

    public onCardDrawed(callback: (markerId: string, card: Card) => void) {
        this.drawCardCallbacks.push(callback);
    }

    public sendMessage(action: string, data: any) {
        console.log('Send:', { action: action, data: data });
        const message = JSON.stringify({ action: action, data: data });
        this.getSocket().send(message);
    }
    public navigateToGame() {
        if (this.room.value) {
            this.router.push(`/game?roomId=${this.room.value.id}`);
        }
    }

    private isConnected() {
        const webSocket = this.store.webSocket;
        return (
            webSocket &&
            webSocket !== null &&
            (webSocket.readyState === 1 || webSocket.readyState === 0)
        ); /* OPEN */
    }

    public killConnection() {
        this.controller.abort();
        this.connectionCallbacks.forEach((callback) => callback(undefined));
        this.drawCardCallbacks.forEach((callback) => callback('', {
                cardFace: '',
                lastSeen: 0,
                found: false,
                url: '',
                zone: undefined
            }));
    }

    private getSocket() {
        return this.store.webSocket;
    }
}
