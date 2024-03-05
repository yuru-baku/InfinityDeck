import { Db } from "mongodb";
import { MauMau } from "./games/MauMau";
import { User } from "./user";
import { Game } from "./Game";
import { Uno } from "./games/Uno";

export type WsMessage = {
    action: string,
    data: any
}

const Games = {
    Uno: Uno,
    MauMau: MauMau
}

export class Room {

    id: string;
    users: User[];
    state: 'inLobby'|'inGame'|'finished';
    selectedGame: keyof typeof Games;
    game: Game;
    db: Db;
    isLocal: boolean;

    constructor(db: Db, id?: string) {
        if (id === undefined || id === null || id === 'undefined' || id === 'null') {
            this.id = 'room_' + (Math.random() + 1).toString(36).substring(7);
        } else {
            this.id = id;
        }
        this.users = [];    // Users taking part in this game
        this.state = 'inLobby';
        this.selectedGame = 'MauMau';
        this.game = new MauMau(this);
        this.db = db;
        this.isLocal = true;
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

    private setUpUserConnection(user: User, connectionAction: 'joined'|'reconnected') {
        console.log(user.id, connectionAction, this.id);

        // notify users
        this.sendMessageToUsers(connectionAction, { id: user.id, name: user.name, isOwner: user.isOwner }, this.users.filter(u => u.id != user.id));

        // listen for actions of normal players
        const availableActions = [
            'drawCard',
            'playCard',
            // 'endTurn'
        ];
        const availableRoomActions = [
            'getRoomInfo',
        ];
        user.ws.on('message', (msg: string) => {
            const message: any = JSON.parse(msg);
            if (availableActions.includes(message.action)) {
                // @ts-ignore
                this.game[message.action](user, message);
            } else if (availableRoomActions.includes(message.action)){
                // @ts-ignore
                this[message.action](user, message);
            }
        });
    }

    makeUserAdmin(user: User) {
        user.isOwner = true;
        // listen for actions of admin
        const availableGameActions = [
            'start',
            'end',
            'shuffleDrawPile'
        ];
        const availableRoomActions = [
            'changeGame',
            'changeSettings'
        ];
        user.ws.on('message', (msg: string) => {
            const message: any = JSON.parse(msg);
            if (availableGameActions.includes(message.action)) {
                // @ts-ignore
                this.game[message.action](user, message);
            } else if (availableRoomActions.includes(message.action)){
                // @ts-ignore
                this[message.action](user, message);
            }
        });
    }

    leave(user: User) {
        console.log(user.id, 'disconnected', this.id);
        this.sendMessageToUsers('disconnected', { id: user.id, name: user.name }, this.users.filter(u => u != user));
        user.timeout = setTimeout(() => {
            console.log('triggered timeout')
            this.users = this.users.filter(u => u != user); // remove this user
            // notify remaining
            this.sendMessageToUsers('left', { id: user.id, name: user.name });
            // close game if we were the last one and game hasn't finished
            if (this.users.length === 0) {
                // all left :(
                this.game.end();
            }
        }, 5 * 60 * 1000);
    }

    getRoomInfo(user: User) {
        console.log('getting room infos')
        this.sendMessageToUsers('gotRoomInfo', {
                you: { name: user.name, isOwner: user.isOwner, id: user.id },
                room: {
                    isLocal: this.isLocal,
                    selectedGame: this.selectedGame,
                    state: this.state,
                    users: this.getUserInformations(),
                    id: this.id,
                },
                game: { ...this.game, room: undefined },
                markerMap: Object.fromEntries(user.markerMap.entries()) // convert to plain object
            }, [user]);
    }

    changeGame(user: User, message: WsMessage) {
        if (!user.isOwner) {
            user.ws.send(JSON.stringify({ error: 'Only the owner of this room might perform this action!' }));
            return;
        }
        let selection = message.data.selectedGame;
        if (!Object.keys(Games).includes(selection)) {
            user.ws.send(JSON.stringify({ error: `${selection} is not a known game!` }));
            return;
        }
        this.selectedGame = selection;
        this.game = new Games[this.selectedGame](this);
        this.sendMessageToUsers('gameChanged', { selectedGame: this.selectedGame, game: { ...this.game, room: undefined } })
    }

    changeSettings(user: User, message: { action: 'changeSettings', data: { isLocal: boolean }}) {
        if (!user.isOwner) {
            user.ws.send(JSON.stringify({ error: 'Only the owner of this room might perform this action!' }));
            return;
        }
        this.isLocal = message.data.isLocal || false;
        this.sendMessageToUsers('settingsChanged', { isLocal: this.isLocal })
    }

    addLocalDataToMarker(user: User, message: WsMessage) {
        if (this.isLocal) {
            user.ws.send(JSON.stringify({ error: 'This game is a local game!' }));
            return;
        }
        if (message.data.markerId) {
            user.ws.send(JSON.stringify({ error: 'markerId is missing!' }));
            return;
        }
        this.addDataToMarker(message.data.markerId, message.data.card, user);
        this.sendMessageToUsers('addedLocalDataMarker', message.data, [user]);
    }



    getUserInformations(): { name: string, isOwner: boolean, id: string, disconnected: boolean }[] {
        return this.users.map(user => { return { name: user.name, isOwner: user.isOwner, id: user.id, disconnected: user.timeout !== undefined }})
    }

    addDataToMarker(markerId: string, data: any, user: User) {
        if (this.isLocal) {
            for (let user of this.users) {
                user.markerMap.set(markerId, data);
            }
        } else {
            user.markerMap.set(markerId, data);
        }
    }

    sendMessageToUsers(action: string, data: any, users: User[] = this.users) {
        users = users.filter(user => !user.timeout); // only send to connected users
        for (let user of users) {
            user.ws.send(JSON.stringify({ action, data }));
        }
    }

    public isJoinable(): boolean {
        return this.users.length < this.game.maxUsers && this.state === 'inLobby';
    }
}