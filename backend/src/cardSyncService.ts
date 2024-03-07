import { WebSocket as Socket, WebSocketServer as Server } from 'ws';
import { setInterval, clearInterval } from 'timers';
import { Card } from './models/card';
import { Room } from './models/room';

/**
 * TODO: integrade cardSyncService
 * TODO: implement Syncing
 * TODO: stopSync when room is empty
 * TODO: gather cards
 * TODO: store cards in room
 * TODO: broadcast cards
 */
export class CardSyncService {
    private io: Server;
    private room: Room;
    private intervalId?: NodeJS.Timeout;
    private period: number;

    constructor(io: Server, room: Room, period: number = 20) {
        this.io = io;
        this.intervalId = undefined;
        this.period = period;
        this.room = room;
    }

    startSync(): void {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => {
                this.room.sendMessageToUsers('getCards', {});
            }, this.period);
        }
    }

    stopSync(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    onGetCards(socket: Socket, handleCards: (cards: Card[]) => void): void {
        // ... Implement logic to handle "getCards" message
        // Potentially:
        // - Fetch cards from database or other source
        // - Call handleCards function with retrieved cards
    }

    onAllCards(socket: Socket, cards: Card[]): void {
        // ... Process received cards (e.g., update server-side state or propagate to other clients)
    }
}
