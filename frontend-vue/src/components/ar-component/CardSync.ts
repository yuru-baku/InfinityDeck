import type { Card } from '@/model/card.ts';
import type { User } from '@/model/user.ts';
import type { CardService } from './CardService';
import type { ConnectionService } from '@/services/ConnectionService';

export class CardSync {
    constructor();
    public found(marker: string): Card {
        this.cardService.drawCard();
    }
    public lost(marker: string): Card {}
    public setShared(marker: string): Card {}
    public setPrivate(marker: string): Card {}

    private cardService: CardService;
    private conService: ConnectionService;
    private user: User;
}
