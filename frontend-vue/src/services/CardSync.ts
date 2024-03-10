import type { Card, UserCards, Zone } from '@/model/card';
import { CardService } from './CardService';
import type { ConnectionService } from '@/services/ConnectionService';

export class CardSync {
    constructor(conService: ConnectionService, cardService: CardService) {
        this.conService = conService;
        const partial = (fn: any, firstArg: any) => {
            return (...lastArgs: any) => {
                return fn(firstArg, ...lastArgs);
            };
        };
        this.conService.addListener('getCards', partial(this.onGetCards, this));
        this.conService.addListener('allCards', partial(this.onBroadcastCards, this));

        this.cardService = cardService;
    }

    onBroadcastCards(cardSync: CardSync, allCards: UserCards[], _conService: ConnectionService) {
        console.debug('Backend synced the cards.', allCards);
        cardSync.cardService.setUsersCards(allCards);
    }

    onGetCards(cardSync: CardSync, _data: any, conService: ConnectionService) {
        console.debug('Backend wants to see our cards:');
        conService.sendMessage('getCards', cardSync.gatherCards());
    }

    gatherCards(): Card[] {
        return this.cardService.getMyCards();
    }

    private cardService: CardService;
    private conService: ConnectionService;
}
