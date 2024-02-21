import { Room } from "./room";
import { User } from "./user";

export class MauMau {

    room: Room;
    deck: string[];
    playedCards: string[];
    drawPile: string[];
    maxUsers: number = 4;
    history: string[];
    startTime: Date|undefined;
    endTime: Date|undefined;
    turn: number;


    constructor (room: Room) {
        this.room = room;
        this.deck = [
            'clubs-1', 'clubs-2', 'clubs-3', 'clubs-4', 'clubs-5', 'clubs-6', 'clubs-7', 'clubs-8', 'clubs-9', 'clubs-jack', 'clubs-queen', 'clubs-king', 'clubs-ace',
            'diamonds-1', 'diamonds-2', 'diamonds-3', 'diamonds-4', 'diamonds-5', 'diamonds-6', 'diamonds-7', 'diamonds-8', 'diamonds-9', 'diamonds-jack', 'diamonds-queen', 'diamonds-king', 'diamonds-ace',
            'hearts-1', 'hearts-2', 'hearts-3', 'hearts-4', 'hearts-5', 'hearts-6', 'hearts-7', 'hearts-8', 'hearts-9', 'hearts-jack', 'hearts-queen', 'hearts-king', 'hearts-ace',
            'spades-1', 'spades-2', 'spades-3', 'spades-4', 'spades-5', 'spades-6', 'spades-7', 'spades-8', 'spades-9', 'spades-jack', 'spades-queen', 'spades-king', 'spades-ace',
        ]; // All cards of this deck 
        this.playedCards = [ ];
        this.drawPile = [ ];        // "Nachziehstapel"
        this.history = [ ];
        this.turn = 0;
    }

    start() {
        // check user count
        if (this.room.users.length > this.maxUsers) {
            for (let user of this.room.users) {
                user.ws.send(JSON.stringify({ error: 'Too many Users!' }));
            }
            return;
        }
        this.startTime = new Date();
        this.room.state = 'inGame';
        this.drawPile = [...this.deck]; // copy array
        this.shuffleArray(this.drawPile);
        // give users some handcards
        for (let i = 0; i < 7; i++) {
            for (let user of this.room.users) {
                user.handcards.unshift(this.drawPile.pop()!);
            }
        }
        // propagate handcards?
        for (let user of this.room.users) {
            user.ws.send(JSON.stringify({
                action: 'dealCards',
                data: {
                    handcards: user.handcards
                }
            }));
            let historyEntry = [ 'dealCards', user.id, user.handcards.join(',')].join(':');
            this.history.unshift(historyEntry);
        }
    }

    end() {
        this.endTime = new Date();

        const leaderboard: string[] = [ ];

        this.notifyUsers('end', {
            startTime: this.startTime,
            endTime: this.endTime,
            leaderboard: leaderboard
        });
        // finally persist and close
        // this.room.db.collection('MauMau-Games').insertOne({
        //     leaderboard: leaderboard,
        //     history: this.history,
        //     startTiem: this.startTime,
        //     endTime: this.endTime,
        //     users: this.room.users.map(user => { return { name: user.name, id: user.id, handcards: user.handcards }})
        // });
    }

    drawCard(user: User, data: any) {
        // check if it is the users turn
        if (this.room.users[this.turn] !== user) {
            user.ws.send(JSON.stringify({ error: 'It is not your turn!' }));
            return;
        }
        // check if we need to shuffle deck
        if (this.drawPile.length <= 0) {
            this.shuffleDrawPile();
        }
        const card = this.drawPile.pop()!;
        user.handcards.unshift(card);
        user.ws.send(JSON.stringify({
            action: 'drawCard',
            data: {
                card: card,
                markerId: data.data.markerid,
                handcards: user.handcards,
                nextActions: [ 'endTurn', 'playCard' ]
            }
        }));
        this.history.unshift(`+${user.id}:${card}`);
        // do not hand to next user now, wait if he can play now
    }

    playCard(user: User, data: any) {
        // check if it is the users turn
        if (this.room.users[this.turn] !== user) {
            user.ws.send(JSON.stringify({ error: 'It is not your turn!' }));
            return;
        }
        // check if user has this card in his hand
        const cardIndex = user.handcards.findIndex(card => card === data.card);
        if (cardIndex < 0) {
            user.ws.send(JSON.stringify({ error: 'The Server did not know you own this card. Please play another one' }));
            return;
        }
        // play card
        const playedCard = user.handcards.splice(cardIndex, 1)[0];
        this.playedCards.unshift(playedCard);
        this.history.unshift(`-${user.id}:${playedCard}`)
        // check if it was the last card
        const wasLast = user.handcards.length <= 0;
        this.notifyUsers('playCard', { card: playedCard, wasLast: wasLast });
        if (wasLast) {
            // we do not check here if he needs to pull another card he can do so if he wants to :)
            this.history.unshift(`${user.id}:finished`)
        }
        // hand to next user
        this.endTurn(user, data);
    }

    endTurn(user: User, _: any) {
        // check if it is the users turn
        if (this.room.users[this.turn] !== user) {
            user.ws.send(JSON.stringify({ error: 'It is not your turn!' }));
            return;
        }
        // just hand to next user
        this.turn = (this.turn) + 1 % this.room.users.length;
        this.room.users[this.turn].ws.send(JSON.stringify({
            action: 'yourTurn',
            data: {
                nextActions: [ 'drawCard', 'playCard' ]
            }
        }));
    }

    shuffleDrawPile() {
        this.drawPile = this.drawPile.concat(this.playedCards);
        this.drawPile = this.shuffleArray(this.drawPile);
        this.playedCards = [ ];
        // notify users
        this.notifyUsers('shuffled', { })
        this.history.unshift('shuffle');
    }

    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        } 
        return array;
    }
    notifyUsers(action: string, data: any) {
        for (let user of this.room.users) {
            user.ws.send(JSON.stringify({
                action: action,
                data: data
            }));
        }
    }
}