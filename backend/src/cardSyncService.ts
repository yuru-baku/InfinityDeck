import { WebSocket as Socket } from 'ws';
import { setInterval, clearInterval } from 'timers';
import { AllCards, Card, UserCards } from './models/card';
import { Room } from './models/room';
import { User } from './models/user';

export class CardSyncService {
    private room: Room;
    private intervalId?: NodeJS.Timeout;
    private period: number;
    private partial = (fn: any, firstArg: any) => {
        return (...lastArgs: any) => {
            return fn(firstArg, ...lastArgs);
        };
    };

    constructor(room: Room, period: number = 20) {
        this.intervalId = undefined;
        this.period = period;
        this.room = room;
    }

    startSync(): void {
        if (this.intervalId) {
            return;
        }
        this.intervalId = setInterval(() => {
            console.debug('Ask players what their cards are');
            this.room.sendMessageToUsers('getCards', {});
        }, this.period);
    }

    addSyncListener(): void {
        const partial = (fn: any, firstArg: any) => {
            return (...lastArgs: any) => {
                return fn(firstArg, ...lastArgs);
            };
        };
        this.room.addListenerToAll('getCards', this.partial(this.onGetCards, this));
    }

    /**
     *
     * @param cardSync explicitly passsing reference to this object
     * @param user whichs users cards we received
     * @param cards the cards we received
     */
    onGetCards(cardSync: CardSyncService, user: User, cards: Card[]): void {
        console.debug('User send their cards');
        console.debug(cards);
        cardSync.updateUserCards(user, cards);
        cardSync.sendAllCards();
    }

    sendAllCards(): void {
        const allCards: AllCards = { sharedCard: this.sharedCard, userCards: this.userCards };
        this.room.sendMessageToUsers('allCards', allCards);
    }

    stopSync(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    //Controlling the user cards
    //------------------------------------------------
    //
    updateUserCards(user: User, cards: Card[]) {
        console.debug('update userCards');
        this.userCards[this.find(user)].cards = cards; //my view on the cards
        let isSharedUpdated: boolean = user.updateCards(cards); //update in user
        //update the shared card is needed
        if (isSharedUpdated) {
            this.sharedCard = user.getShared();
            console.debug('New shared card', this.sharedCard);
        }
        console.debug(this.userCards);
    }

    /**
     * Finds the userCards of a given user. May create the entry if needed
     * @param user which cards are searched
     * @returns index of the users cardss
     */
    private find(user: User): number {
        for (let i = 0; i < this.userCards.length; ++i) {
            if (this.userCards[i].userId == user.id) {
                return i;
            }
        }
        this.userCards.push({ userId: user.id, cards: [] });
        return this.userCards.length - 1;
    }

    //We have very few users. So an array is fine to use here.
    private userCards: UserCards[] = [];
    private sharedCard?: Card;
}
