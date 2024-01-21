import { Db } from "mongodb";
import { MauMau } from "./MauMau";
import { User } from "./user";

export class Room {

    id: string;
    users: User[];
    state: 'initialising'|'inGame';
    selectedGame: 'MauMau';
    game: MauMau;
    db: Db;

    constructor(db: Db, id?: string) {
        this.id = id || 'room_' + (Math.random() + 1).toString(36).substring(7);
        this.users = [];    // Users taking part in this game
        this.state = 'initialising';
        this.selectedGame = 'MauMau';
        this.game = new MauMau(this);
        this.db = db;
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
        this.users
            .filter(u => u.id != user.id)
            .forEach(u => {
            u.ws.send(JSON.stringify({
                action: connectionAction,
                data: {
                    user: {
                        id: user.id,
                        name: user.name
                    }
                }
            }));
        });

        // listen for actions of normal players
        const availableActions = [
            'drawCard',
            'playCard',
            'endTurn'
        ];
        const availableRoomActions = [
            'getRoomInfo',
        ];
        user.ws.on('message', (msg: string) => {
            const data: any = JSON.parse(msg);
            if (availableActions.includes(data.action)) {
                // @ts-ignore
                this.game[data.action](user, data);
            } else if (availableRoomActions.includes(data.action)){
                // @ts-ignore
                this[data.action](user, data);
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
        ];
        user.ws.on('message', (msg: string) => {
            const data: any = JSON.parse(msg);
            if (availableGameActions.includes(data.action)) {
                // @ts-ignore
                this.game[data.action](user, data);
            } else if (availableRoomActions.includes(data.action)){
                // @ts-ignore
                this[data.action](user, data);
            }
        });
    }

    leave(user: User) {
        console.log(user.id, 'left', this.id);
        this.users
            .filter(u => u != user)
            .forEach(u => {
                u.ws.send(JSON.stringify({
                    action: 'disconnected',
                    data: {
                        id: user.id,
                        name: user.name
                    }
                }));
            });
        user.timeout = setTimeout(() => {
            console.log('triggered timeout')
            this.users = this.users.filter(u => u != user); // remove this user
            // notify remaining
            this.users.forEach(u => {
                u.ws.send(JSON.stringify({
                    action: 'left',
                    data: {
                        id: user.id,
                        name: user.name
                    }
                }));
            });
            // return this.users.length;
        }, 5 * 60 * 1000);
    }

    getRoomInfo(user: User) {
        user.ws.send(JSON.stringify({
            action: 'gotRoomInfo',
            data: {
                you: { name: user.name, isOwner: user.isOwner, id: user.id },
                isLocal: false,
                selectedGame: this.selectedGame,
                state: this.state,
                users: this.getUserInformations()
            }
        }))
    }

    selectGame() {
        // ToDo add multiple games
    }

    getUserInformations(): { name: string, isOwner: boolean, id: string, disconnected: boolean }[] {
        return this.users.map(user => { return { name: user.name, isOwner: user.isOwner, id: user.id, disconnected: user.timeout !== undefined }})
    }
}