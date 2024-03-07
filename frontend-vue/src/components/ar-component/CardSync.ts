import type { Card, Zone } from '@/model/card.ts';
import { CardService } from './CardService';
import type { ConnectionService } from '@/services/ConnectionService';
import type { User } from '@/model/user';

export class CardSync {
    constructor(conService: ConnectionService, cardService: CardService) {
        this.conService = conService;
        this.conService.addListener('getCards', this.onGetCards);

        this.cardService = cardService;
    }

    onGetCards() {
        //console.log("sync:", this.conService);
        //console.log("Backend wants to see our cards");
        let card: Card = { markerId: '189', cardFace: 'Queen', zone: 0 };
        let con = this;
        con.sendMessage('getCards', { data: 'blub' });
    }

    /*
    public found(marker: string): Card {
        this.cardService.drawCard();
    }

    public lost(marker: string): Card { }
    public setShared(marker: string): Card { }
    public setPrivate(marker: string): Card { }
    */
    private cardService: CardService;
    private conService: ConnectionService;
    private user: User;
}
