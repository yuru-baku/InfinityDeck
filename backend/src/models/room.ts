import { Db } from "mongodb";
import { MauMau } from "./MauMau";
import { User } from "./user";

export type WsMessage = {
    action: string,
    data: any
}

export class Room {

    id: string;
    users: User[];
    state: 'initialising'|'inGame';
    selectedGame: 'MauMau';
    game: MauMau;
    db: Db|undefined;
    isLocal: boolean;

    constructor(db?: Db, id?: string) {
        this.id = id || 'room_' + (Math.random() + 1).toString(36).substring(7);
        this.users = [];    // Users taking part in this game
        this.state = 'initialising';
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
        this.sendMessageToUsers(connectionAction, { id: user.id, name: user.name }, this.users.filter(u => u.id != user.id));

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
            'selectGame',
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
            // return this.users.length;
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

    selectGame() {
        // ToDo add multiple games
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
}