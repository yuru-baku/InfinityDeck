import { WebSocket as Socket } from 'ws';
import { setInterval, clearInterval } from 'timers';
import { Card } from './models/card';
import { Room } from './models/room';
import { User } from './models/user';
/**
 * TODO: integrade cardSyncService
 * TODO: implement Syncing
 * TODO: stopSync when room is empty
 * TODO: gather cards
 * TODO: store cards in room
 * TODO: broadcast cards
 */
export class CardSyncService {
    private room: Room;
    private intervalId?: NodeJS.Timeout;
    private period: number;

    constructor(room: Room, period: number = 20) {
        this.intervalId = undefined;
        this.period = period;
        this.room = room;
    }

    startSync(): void {
        if (this.intervalId) {
            console.warn('CardSyncService: Tried to start multiple syncs. Action not supported.');
            return;
        }
        this.intervalId = setInterval(() => {
            console.log('Ask players what their cards are');
            this.room.sendMessageToUsers('getCards', {});
        }, this.period);
    }

    addSyncListener(): void {
        this.room.addListenerToAll('getCards', this.onGetCards);
    }

    onGetCards(user: User, data: any): void {
        console.log('User send their cards');
        console.log(data);
        console.log(this.room);
    }

    stopSync(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    onAllCards(socket: Socket, cards: Card[]): void {
        // ... Process received cards (e.g., update server-side state or propagate to other clients)
    }
}
