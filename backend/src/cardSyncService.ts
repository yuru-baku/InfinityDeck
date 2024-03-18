import { setInterval, clearInterval } from 'timers';
import { AllCards, Card } from './models/card';
import { Room } from './models/room';
import { User } from './models/user';

export class CardSyncService {
    private sharedCard?: Card;
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
        const allCards: AllCards = {
            sharedCard: this.sharedCard,
            userCards: this.room.users.map(user => user.getUserCards())
        };
        this.room.sendMessageToUsers('allCards', allCards);
    }

    stopSync(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    updateUserCards(user: User, cards: Card[]) {
        console.debug('update userCards');
        let isSharedUpdated: boolean = user.updateCards(cards); //update in user
        //update the shared card is needed
        if (isSharedUpdated) {
            this.sharedCard = user.getShared();
            console.debug('New shared card', this.sharedCard);
        }
        console.debug(this.room.users.map(user => user.getCards()));
    }

    getSharedCard(): Card | undefined {
        return this.sharedCard;
    }
}
