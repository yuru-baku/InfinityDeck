import { Room, WsMessage } from './room';
import { User } from './user';
import { CardSyncService } from '../cardSyncService';

export class MauMau {
    room: Room;
    deck: string[];
    playedCards: string[];
    drawPile: string[];
    maxUsers: number = 4;
    history: string[];
    startTime: Date | undefined;
    endTime: Date | undefined;
    private cardSync?: CardSyncService;
    constructor(room: Room) {
        this.room = room;
        this.deck = [
            'clubs-2',
            'clubs-3',
            'clubs-4',
            'clubs-5',
            'clubs-6',
            'clubs-7',
            'clubs-8',
            'clubs-9',
            'clubs-10',
            'clubs-jack',
            'clubs-queen',
            'clubs-king',
            'clubs-ace',
            'diamonds-2',
            'diamonds-3',
            'diamonds-4',
            'diamonds-5',
            'diamonds-6',
            'diamonds-7',
            'diamonds-8',
            'diamonds-9',
            'diamonds-10',
            'diamonds-jack',
            'diamonds-queen',
            'diamonds-king',
            'diamonds-ace',
            'hearts-2',
            'hearts-3',
            'hearts-4',
            'hearts-5',
            'hearts-6',
            'hearts-7',
            'hearts-8',
            'hearts-9',
            'hearts-10',
            'hearts-jack',
            'hearts-queen',
            'hearts-king',
            'hearts-ace',
            'spades-2',
            'spades-3',
            'spades-4',
            'spades-5',
            'spades-6',
            'spades-7',
            'spades-8',
            'spades-9',
            'spades-10',
            'spades-jack',
            'spades-queen',
            'spades-king',
            'spades-ace'
        ]; // All cards of this deck
        this.playedCards = [];
        this.drawPile = []; // "Nachziehstapel"
        this.history = [];
        //this.cardSync = new CardSyncService(room, 1000);
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
        this.room.sendMessageToUsers('dealCards', {});
        let historyEntry = 'dealCards';
        this.history.unshift(historyEntry);

        //note these listers persist for the lifetime of the websockets
        //we might need to remove these listeners if we want to enable
        this.cardSync = new CardSyncService(this.room, 1000);
        this.cardSync.addSyncListener();
        this.cardSync.startSync();
    }

    end() {
        if (this.room.state !== 'inGame') {
            return;
        }
        this.room.state = 'finished';
        this.endTime = new Date();

        const leaderboard: string[] = [];

        this.cardSync?.stopSync();

        this.room.sendMessageToUsers('end', {
            startTime: this.startTime,
            endTime: this.endTime,
            leaderboard: leaderboard
        });
        // finally persist and close
        this.room.db.collection('MauMau-Games').insertOne({
            leaderboard: leaderboard,
            history: this.history,
            startTiem: this.startTime,
            endTime: this.endTime,
            users: this.room.users.map((user) => {
                return { name: user.name, id: user.id, handcards: [] };
            })
        });
    }

    drawCard(user: User, message: WsMessage) {
        const markerId = message.data.markerId;
        let card = user.markerMap.get(markerId);
        // check if this card is already known
        if (!card) {
            // check if we need to shuffle deck
            if (this.drawPile.length <= 0) {
                this.shuffleDrawPile();
            }
            card = this.drawPile.pop()!;
            this.room.addDataToMarker(markerId, card, user);
        }
        this.room.sendMessageToUsers('drawCard', { card: card, markerId: markerId });
        // it might happen that we draw a card again, since we can shuffle
        this.history.unshift(`+${user.id}:${card}`);
    }

    playCard(user: User, message: WsMessage) {
        // check if user has this card in his hand
        let card = message.data.card;
        this.playedCards.push(card);
        this.room.sendMessageToUsers('playedCard', { card: card });
        this.history.unshift(`-${user.id}:${card}`);
    }

    shuffleDrawPile() {
        this.drawPile = this.drawPile.concat(this.playedCards);
        this.drawPile = this.shuffleArray(this.drawPile);
        this.playedCards = [];
        // notify users
        this.room.sendMessageToUsers('shuffled', {});
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
}
