import { MauMau } from "./MauMau";

export class Room {
    constructor(db) {
        this.id = 'room_' + (Math.random() + 1).toString(36).substring(7);
        this.users = [];    // Users taking part in this game
        this.state = 'initialising';
        this.selectedGame = 'MauMau';
        this.game = new MauMau(this);
        this.db = db;
    }

    join(user) {
        // notify users
        this.users.forEach(u => {
            u.ws.send({
                action: 'join',
                user: {
                    id: user.id,
                    name: user.name
                }
            });
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
        user.ws.on('message', (data) => {
            if (availableActions.includes(data.action)) {
                this.game[data.action](user, data);
            }
        });
    }

    makeUserAdmin(user) {
        user.isAdmin = true;
        // listen for actions of admin
        const availableGameActions = [
            'start',
            'end',
            'shuffle'
        ];
        const availableRoomActions = [
            'selectGame',
        ];
        user.ws.on('message', (data) => {
            if (availableGameActions.includes(data.action)) {
                this.game[data.action](user, data);
            } else if (availableRoomActions.includes(data.action)){
                this[data.action](user, data);
            }
        });
    }

    leave(user) {
        console.log('leaving room');
        this.users = this.users.filter(u => u != user); // remove this user
        // notify remaining
        this.users.forEach(u => {
            u.ws.send({
                action: 'left',
                data: {
                    id: user.id,
                    name: user.name
                }
            });
        });
        return this.users.length;
    }

    selectGame() {
        // ToDo add multiple games
    }
}