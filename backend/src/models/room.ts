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

    constructor(db: Db) {
        this.id = 'room_' + (Math.random() + 1).toString(36).substring(7);
        this.users = [];    // Users taking part in this game
        this.state = 'initialising';
        this.selectedGame = 'MauMau';
        this.game = new MauMau(this);
        this.db = db;
    }

    join(user: User) {
        // notify users
        this.users.forEach(u => {
            u.ws.send(JSON.stringify({
                action: 'join',
                user: {
                    id: user.id,
                    name: user.name
                }
            }));
        });
        // add user to game
        this.users.push(user);

        // make admin if first
        if (this.users.length === 1) {
            this.makeUserAdmin(user);
        }

        // listen for actions of normal players
        const availableActions = [
            'drawCard',
            'playCard',
            'endTurn'
        ];
        user.ws.on('message', (msg: string) => {
            const data: any = JSON.parse(msg);
            if (availableActions.includes(data.action)) {
                // @ts-ignore
                this.game[data.action](user, data);
            }
        });
    }

    makeUserAdmin(user: User) {
        user.isAdmin = true;
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
        console.log('leaving room');
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
        return this.users.length;
    }

    selectGame() {
        // ToDo add multiple games
    }
}