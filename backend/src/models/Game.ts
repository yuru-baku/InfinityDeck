import { Room, WsMessage } from './room';
import { User } from './user';

const MAX_NUM_OF_MARKERS = 50 - 4;

export abstract class Game {
    abstract deck: string[]; // All cards of this deck
    abstract label: string; // display and ID

    room: Room;
    drawPile: string[];
    maxUsers: number = 4;
    history: string[];
    startTime: Date | undefined;
    endTime: Date | undefined;

    constructor(room: Room) {
        this.room = room;
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
        
        const summary = {
                history: this.history,
                startTime: this.startTime,
                endTime: this.endTime,
                users: this.room.users.map((user) => {
                    return { name: user.name, id: user.id, handcards: user.getCards().map(card => card.cardFace) };
                })
            };

        this.room.sendMessageToUsers('end', summary);
        // finally persist and close
        try {
            this.room.db.collection(`${this.label}-Games`).insertOne(summary);
        } catch (e) {
            console.warn('Failed to persist game with reason', e);
        }
    }

    drawCard(user: User, message: WsMessage) {
        const markerId = message.data.markerId;
        let card = user.markerMap.get(markerId)
        // check if this card is already known
        if (!card) {
            // check if we need to shuffle deck
            if (this.drawPile.length <= 0) {
                this.shuffleDrawPile();
            }
            let cardFace = this.drawPile.pop()!;

            card = {
                cardFace: cardFace,
                lastSeen: message.data.lastSeen,
                found: true,
                url: undefined,
                zone: undefined
            }
            // only update my markerMap and answer me if this is not a local game
            if (this.room.isLocal) {
                for (let user of this.room.users) {
                    user.markerMap.set(markerId, card);
                }
                this.room.sendMessageToUsers('drawCard', {
                    card: card,
                    markerId: markerId
                });
            } else {
                user.markerMap.set(markerId, card);
                this.room.sendMessageToUsers('drawCard', {
                    card: card,
                    markerId: markerId
                }, [user]);
            }
        }
        
        // it might happen that we draw a card again, since we can shuffle
        this.history.unshift(`+${user.id}:${card?.cardFace}`);
        if (user.markerMap.size >= MAX_NUM_OF_MARKERS) {
            this.freeUnusedMarkers(user);
        }
    }

    shuffleDrawPile() {
        // free unused markers to get maximum amount of unused card
        if (this.room.isLocal) {
            this.freeUnusedMarkers(this.room.users[0]); // take any user
        } else {
            this.room.users.forEach(user => this.freeUnusedMarkers(user));
        }
        // find unused Cards
        // ToDo: This might be dangerous! They do not equal the unused markers!
        let usedCardFaces: string[] = this.room.users
            .map(user => user.getCards())
            .reduce((a, b) => a.concat(b))
            .map(card => card.cardFace)
            .concat(this.room.cardSync?.getSharedCard()?.cardFace || [])    // the shared card is used
            .concat(this.drawPile); // also consider cards from drawPile as used
        let unusedCardFaces: string[] = this.deck.filter(cardFace => !usedCardFaces.includes(cardFace));
        // restock drawPile
        this.drawPile = this.drawPile.concat(unusedCardFaces);
        this.drawPile = this.shuffleArray(this.drawPile);
        // notify users
        this.room.sendMessageToUsers('shuffled', {});
        this.history.unshift('shuffle');
    }

    freeUnusedMarkers(user: User) {
        let unusedMarkers = this.findUnusedMarkers(user);
        if (unusedMarkers.length < 5) {
            console.warn('Could only free', unusedMarkers, 'markers!');
        }
        let users = this.room.isLocal ? this.room.users : [user];
        for (let user of users) {
            for (let marker of unusedMarkers) {
                user.markerMap.delete(marker);
            }
        }
        this.room.sendMessageToUsers('freedMarkers', unusedMarkers, users);
    }

    private findUnusedMarkers(user: User) {
        let unusedMarkers = [];
        let timeUnused = (60 * 1000);
        // we have 46 card-markers, we want to free at least 5
        while (unusedMarkers.length < 5 && timeUnused > 100) {
            const threshhold = Date.now() - timeUnused;
            for (let [markerId, card] of user.markerMap.entries()) {
                const cardNotInCards = !user.getCards()
                    .map(card => card.cardFace)
                    .includes(card.cardFace) && user.getShared()?.cardFace != card.cardFace;
                if (cardNotInCards && card.lastSeen < threshhold) {
                    unusedMarkers.push(markerId);
                }
            }
            timeUnused /= 2;
        }
        return unusedMarkers;
    }   

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }
}
