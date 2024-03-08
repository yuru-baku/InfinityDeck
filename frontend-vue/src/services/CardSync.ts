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
        console.log('Backend synced the cards.', allCards);
        cardSync.cardService.setUsersCards(allCards);
    }

    onGetCards(cardSync: CardSync, _data: any, conService: ConnectionService) {
        console.log('Backend wants to see our cards:');
        conService.sendMessage('getCards', cardSync.gatherCards());
    }

    gatherCards(): Card[] {
        console.log('I am gathering ya cards!');
        return [];
    }

    private cardService: CardService;
    private conService: ConnectionService;
}
