import { WebSocket as Socket, WebSocketServer as Server } from 'ws';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'timers';
import { Card } from './models/card';

export class CardSyncService {
    private io: Server;
    private intervalId?: NodeJS.Timeout;
    private period: number;

    constructor(io: Server, period: number = 20) {
        this.io = io;
        this.intervalId = undefined;
        this.period = period;
    }

    startSync(): void {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => {
                this.io.emit("getCards");
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
