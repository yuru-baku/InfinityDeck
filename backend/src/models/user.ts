import { WebSocket } from 'ws';
import { Card, UserCards, Zone } from './card';

export class User {
    ws: WebSocket;
    id: string;
    name: string;
    isOwner: boolean;
    timeout: NodeJS.Timeout | undefined;
    markerMap: Map<string, Card>;
    private cards: Card[];
    private sharedCard?: Card;

    constructor(ws: WebSocket, id: string | undefined, name: string | undefined) {
        this.ws = ws;
        if (id) {
            this.id = id;
        } else {
            this.id = 'user_' + (Math.random() + 1).toString(36).substring(7);
        }
        if (name) {
            this.name = name;
        } else {
            this.name = 'name_' + (Math.random() + 1).toString(36).substring(7);
        }
        this.isOwner = false;
        this.markerMap = new Map();
        this.cards = [];
    }

    getShared(): Card | undefined {
        return this.sharedCard;
    }

    getCards(): UserCards {
        return { userId: this.id, cards: this.cards };
    }

    updateCards(cards: Card[]): boolean {
        const newShared: Card = cards.filter((card) => card.zone == Zone.shared)[0];
        const newisNotNull = newShared;
        const isDifferent = newShared?.cardFace != this.sharedCard?.cardFace;
        const isSharedUpdated = newisNotNull && isDifferent;

        if (isSharedUpdated) {
            this.sharedCard = newShared;
        }
        this.cards = cards;
        return isSharedUpdated;
    }





    /**
     * Returns all attributes that are visible for alle players.
     * @returns 
     */
    getPublicInformations(): { name: string; isOwner: boolean; id: string; disconnected: boolean } {
        return {
            name: this.name,
            isOwner: this.isOwner,
            id: this.id,
            disconnected: this.timeout !== undefined
        };
    }
    
    getPrivateInformations(): { name: string; isOwner: boolean; id: string; markerMap: any } {
        return {
            name: this.name,
            isOwner: this.isOwner,
            id: this.id,
            markerMap: Object.fromEntries(this.markerMap.entries())
        };
    }
}
