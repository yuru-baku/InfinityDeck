export class Room {
    constructor() {
        this.id = 'room_' + (Math.random() + 1).toString(36).substring(7);
        this.users = [];    // Users taking part in this game
        this.deck = [];     // All cards of this deck 
        this.playedCards = [];
        this.drawPile = []; // "Nachzeihstapel"
        this.gamestate = 'initialising';
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

        // listen for actions
        const availableActions = [];
        user.ws.on('message', (data) => {
            if (availableActions.includes(data.action)) {
                this[data.action](data);
            }
        });
    }

    leave(data, user) {
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
}