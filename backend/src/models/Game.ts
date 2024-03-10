import { Room, WsMessage } from './room';
import { User } from './user';

export abstract class Game {
    abstract deck: string[]; // All cards of this deck
    abstract label: string; // display and ID

    room: Room;
    playedCards: string[];
    drawPile: string[];
    maxUsers: number = 4;
    history: string[];
    startTime: Date | undefined;
    endTime: Date | undefined;

    constructor(room: Room) {
        this.room = room;
        this.playedCards = [];
        this.drawPile = []; // "Nachziehstapel"
        this.history = [];
    }

    start() {
        console.log('Start Game');
        // check user count
        if (this.room.users.length > this.maxUsers) {
            for (let user of this.room.users) {
                user.ws.send(JSON.stringify({ error: 'Too many Users!' }));
            }
            return;
        }
        this.startTime = new Date();
        this.room.setState('inGame');
        this.drawPile = [...this.deck]; // copy array
        this.shuffleArray(this.drawPile);
        this.room.sendMessageToUsers('dealCards', {});
        let historyEntry = 'dealCards';
        this.history.unshift(historyEntry);
    }

    end() {
        if (this.room.getState() !== 'inGame') {
            return;
        }
        console.log('End Game');
        this.room.setState('finished');
        this.endTime = new Date();

        const leaderboard: string[] = [];

        this.room.sendMessageToUsers('end', {
            startTime: this.startTime,
            endTime: this.endTime,
            leaderboard: leaderboard
        });
        // finally persist and close
        this.room.db.collection(`${this.label}-Games`).insertOne({
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
