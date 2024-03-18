import { Db } from 'mongodb';
import { User } from './user';
import { CardSyncService } from '../cardSyncService';
import { Uno } from './games/Uno';
import { MauMau } from './games/MauMau';
import { Game } from './Game';
import { Message } from './message';

export type WsMessage = {
    action: string;
    data: any;
};

const Games = {
    Uno: Uno,
    MauMau: MauMau
};

export class Room {
    id: string;
    users: User[];
    state: 'inLobby' | 'inGame' | 'finished';
    selectedGame: keyof typeof Games;
    game: Game;
    db: Db;
    isLocal: boolean;
    cardSync?: CardSyncService;

    constructor(db: Db, id?: string) {
        if (id === undefined || id === null || id === 'undefined' || id === 'null') {
            this.id = 'room_' + (Math.random() + 1).toString(36).substring(7);
        } else {
            this.id = id;
        }
        this.users = []; // Users taking part in this game
        this.state = 'inLobby';
        this.selectedGame = 'MauMau';
        this.game = new MauMau(this);
        this.db = db;
        this.isLocal = true;
        this.cardSync = new CardSyncService(this, 1000);
    }

    getState(): 'inLobby' | 'inGame' | 'finished' {
        return this.state;
    }

    setState(state: 'inLobby' | 'inGame' | 'finished') {
        switch (state) {
            case 'finished':
            case 'inLobby':
                this.cardSync?.stopSync();
                break;
            case 'inGame':
                if (this.state != state) {
                    this.cardSync?.addSyncListener();
                    this.cardSync?.startSync();
                }
                break;
            default:
                console.error('invalid game state change:', state);
                break;
        }
        this.state = state;
    }

    join(user: User) {
        this.setUpUserConnection(user, 'joined');

        // add user to game
        this.users.push(user);

        // make admin if first
        if (this.users.length === 1) {
            this.makeUserAdmin(user);
        }
    }

    reconnect(user: User) {
        clearTimeout(user.timeout);
        user.timeout = undefined;
        this.setUpUserConnection(user, 'reconnected');
    }

    private setUpUserConnection(user: User, connectionAction: 'joined' | 'reconnected') {
        console.log({ name: user.name, id: user.id }, connectionAction, this.id);

        // notify users
        this.sendMessageToUsers(
            connectionAction,
            { id: user.id, name: user.name, isOwner: user.isOwner },
            this.users.filter((u) => u.id != user.id)
        );

        // listen for actions of normal players
        const availableActions = ['drawCard'];
        const availableRoomActions = ['getRoomInfo'];
        user.ws.on('message', (msg: string) => {
            const message: any = JSON.parse(msg);
            if (availableActions.includes(message.action)) {
                // @ts-ignore
                this.game[message.action](user, message);
            } else if (availableRoomActions.includes(message.action)) {
                // @ts-ignore
                this[message.action](user, message);
            }
        });
    }

    makeUserAdmin(user: User) {
        user.isOwner = true;
        // listen for actions of admin
        const availableGameActions = ['start', 'end', 'shuffleDrawPile'];
        const availableRoomActions = ['changeGame', 'changeSettings'];
        user.ws.on('message', (msg: string) => {
            const message = JSON.parse(msg);
            if (availableGameActions.includes(message.action)) {
                // @ts-ignore
                this.game[message.action](user, message);
            } else if (availableRoomActions.includes(message.action)) {
                // @ts-ignore
                this[message.action](user, message);
            }
        });
    }

    leave(user: User) {
        console.log(user.id, 'disconnected', this.id);
        this.sendMessageToUsers(
            'disconnected',
            { id: user.id, name: user.name },
            this.users.filter((u) => u != user)
        );
        const fiveMinutes: number = 5 * 60 * 1000;
        user.timeout = setTimeout(() => {
            console.log('triggered timeout');
            this.users = this.users.filter((u) => u != user); // remove this user
            // notify remaining
            this.sendMessageToUsers('left', { id: user.id, name: user.name });
            // close game if we were the last one and game hasn't finished
            if (this.users.length === 0) {
                // all left :(
                this.game.end();
            }
        }, fiveMinutes);
    }

    getRoomInfo = (user: User) => this.sendRoomInfo(user, 'gotRoomInfo');

    sendRoomInfo(user: User, actionName: string) {
        this.sendMessageToUsers(
            actionName,
            {
                you: user.getPrivateInformations(),
                room: {
                    isLocal: this.isLocal,
                    selectedGame: this.selectedGame,
                    state: this.state,
                    users: this.users.map(user => user.getPublicInformations()),
                    id: this.id
                },
                game: { ...this.game, room: undefined }
            },
            [user]
        );
    }

    changeGame(user: User, message: WsMessage) {
        if (!user.isOwner) {
            user.ws.send(
                JSON.stringify({ error: 'Only the owner of this room might perform this action!' })
            );
            return;
        }
        let selection = message.data.selectedGame;
        if (!Object.keys(Games).includes(selection)) {
            user.ws.send(JSON.stringify({ error: `${selection} is not a known game!` }));
            return;
        }
        this.selectedGame = selection;
        this.game = new Games[this.selectedGame](this);
        this.sendMessageToUsers('gameChanged', {
            selectedGame: this.selectedGame,
            game: { ...this.game, room: undefined }
        });
    }

    changeSettings(user: User, message: { action: 'changeSettings'; data: { isLocal: boolean } }) {
        if (!user.isOwner) {
            user.ws.send(
                JSON.stringify({ error: 'Only the owner of this room might perform this action!' })
            );
            return;
        }
        this.isLocal = message.data.isLocal || false;
        this.sendMessageToUsers('settingsChanged', { isLocal: this.isLocal });
    }

    // addLocalDataToMarker(user: User, message: WsMessage) {
    //     if (this.isLocal) {
    //         user.ws.send(JSON.stringify({ error: 'This game is a local game!' }));
    //         return;
    //     }
    //     if (message.data.markerId) {
    //         user.ws.send(JSON.stringify({ error: 'markerId is missing!' }));
    //         return;
    //     }
    //     this.addDataToMarker(message.data.markerId, message.data.card, user);
    //     this.sendMessageToUsers('addedLocalDataMarker', message.data, [user]);
    // }

    // utility-functions ==================================================================================

    sendMessageToUsers(action: string, data: any, users: User[] = this.users) {
        users = users.filter((user) => !user.timeout); // only send to connected users
        for (let user of users) {
            user.ws.send(JSON.stringify({ action, data }));
        }
    }

    public isJoinable(): boolean {
        return (this.users.length < this.game.maxUsers) && (this.state === 'inLobby');
    }

    public addListenerToAll(
        action: string,
        callback: (user: User, data: any) => void
    ): EventListener[] {
        console.log('Activate listeners');
        return this.users.map((user) => this.addListener(user, action, callback));
    }

    private addListener(
        user: User,
        action: string,
        callback: (user: User, data: any) => void
    ): EventListener {
        const listener = (event: any) => {
            const msg = new Message(event);
            if (msg.action == action) {
                callback(user, msg.data);
            }
        };
        user.ws.addEventListener('message', listener);
        return listener;
    }
}
