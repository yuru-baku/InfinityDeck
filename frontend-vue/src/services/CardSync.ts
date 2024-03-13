import type { AllCards, Card, UserCards, Zone } from '@/model/card';
import { CardService } from './CardService';
import type { ConnectionService } from '@/services/ConnectionService';
import type { User } from '@/model/user';

export class CardSync {
    constructor(conService: ConnectionService, cardService: CardService) {
        this.conService = conService;
        const partial = (fn: any, firstArg: any) => {
            return (...lastArgs: any) => {
                return fn(firstArg, ...lastArgs);
            };
        };
        this.conService.addListener('getCards', partial(this.onGetCards, this));
        this.conService.addListener('allCards', partial(this.onAllCards, this));
        this.cardService = cardService;
    }

    onAllCards(cardSync: CardSync, allCards: AllCards, _conService: ConnectionService): void {
        console.debug('Backend synced the cards.', allCards);
        let cardService = cardSync.cardService;
        cardService.setUsersCards(allCards.userCards);

        allCards.userCards.forEach((userCards: UserCards) => {
            _conService.room.value?.users
                .filter((user) => user.id == userCards.userId)
                .forEach((user) => (user.cards = userCards.cards));
        });

        if (allCards.sharedCard) {
            cardService.shareGlobal(allCards.sharedCard);
        }
    }

    onGetCards(cardSync: CardSync, _data: any, conService: ConnectionService): void {
        console.debug('Backend wants to see our cards:');
        conService.sendMessage('getCards', cardSync.gatherCards());
    }

    gatherCards(): Card[] {
        return this.cardService.getMyCards();
    }

    private cardService: CardService;
    private conService: ConnectionService;
}
