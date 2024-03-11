import { ConnectionService } from '@/services/ConnectionService';
import { CardSync } from './CardSync';
import { Zone, type Card, type UserCards } from '@/model/card';
import type { User } from '@/model/user';
import { GAME_CONFIG } from '@/model/game';

export class CardService {
    private conSerivce: ConnectionService;
    private cardSync: CardSync;

    public cardBack: string;
    public markerBaseUrl: string;
    public numberOfCards: number;
    markerMap: Map<string, Card>;
    private sharedCard: Card | undefined;
    cardCallbacks: Map<string, Function>;

    constructor(conService: ConnectionService) {
        this.conSerivce = conService;
        this.cardBack = 'url(./InfintyDeck/cardImages/french-suited-cards/card-back-blue.svg)';
        this.markerBaseUrl = './InfintyDeck/markers/';
        this.numberOfCards = 0;
        this.markerMap = new Map<string, Card>();
        this.cardCallbacks = new Map<string, Function>();
        this.cardSync = new CardSync(conService, this);

        // conService.onConnection(() => this.numberOfCards = conService.game.value!.deck.length);
        conService.onConnection((data) => {
            this.numberOfCards = 40; // Todo: Marker Anzahl?!
            if (data.markerMap) {
                this.markerMap = new Map(
                    Object.entries<string>(data.markerMap).map(([key, value]): [string, Card] => [
                        key,
                        {
                            cardFace: value,
                            url: this.getCardUrl(value),
                            zone: undefined,
                            found: true
                        }
                    ])
                );
                console.log('recovered markerMap');
            }
        });
        conService.onCardDrawed((markerId, cardName) => this.registerMarker(markerId, cardName));
    }

    private getCardUrl(cardName: string): string {
        if (!this.conSerivce.room.value?.selectedGame) {
            return this.cardBack;
        }
        const basePath = GAME_CONFIG[this.conSerivce.room.value?.selectedGame].basePath;
        const fileType = 'svg';
        return `url(${basePath}/${cardName}.${fileType})`;
    }

    public lostCard(markerId: string): void {
        let card = this.markerMap.get(markerId);
        if (card) {
            card.found = false;
        }
    }
    /**
     * Checks if the card is known. If it is it will be returned immediately.
     * Otherwise it will be returned when the server responded.
     * @param markerId
     * @returns a promise which will be resolved as soon as the card is available
     */
    public getCardByMarkerId(markerId: string): Promise<Card> {
        const card = this.markerMap.get(markerId);
        // marker is already known
        if (card) {
            card.found = true;
            return new Promise((resolve) => resolve(card));
        }

        // unknown marker detectet
        this.conSerivce.drawNewCard(markerId);
        return new Promise((resolve, reject) => {
            this.cardCallbacks.set(markerId, (card: Card) => resolve(card));
            // Todo: add error handling
        });
    }

    public markerMapContainsId(markerId: string) {
        return this.markerMap.has(markerId);
    }

    /**
     * Registers a new marker and card combination.
     * If there is a callback waiting it will be called.
     */
    public registerMarker(markerId: string, cardName: string): void {
        // if it is a local game, update markerMap and check for waiting callbacks
        if (this.conSerivce.room.value?.isLocal) {
            if (this.markerMap.get(markerId)) {
                console.warn('Marker was already known, but was registered twice!');
            }
            const card: Card = {
                cardFace: cardName,
                url: this.getCardUrl(cardName),
                zone: Zone.private,
                found: true
            };
            this.markerMap.set(markerId, card);
            const callback = this.cardCallbacks.get(markerId);
            // if there was no callback someone else drew this card locally
            if (callback) {
                callback(card);
            }
        } else {
            // ToDo: What are we doing with not local games?
            console.warn('This is not a local Game!');
        }
    }

    public reloadMarkerMap() {
        throw new Error('Method not implemented.');
    }

    public shareLocal(id: string): void {
        let card = this.markerMap.get(id);
        if (card) {
            if (card != this.sharedCard) {
                if (this.sharedCard) {
                    this.sharedCard.zone = Zone.private;
                }
                card.zone = Zone.shared;
                this.sharedCard = card;
            }
            if (this.sharedCard) {
                this.setShareZone(this.sharedCard);
            }
        }
    }

    //TODO: avoid update conflicts here I currently just update the HTML
    public shareGlobal(card: Card): void {
        this.setShareZone(card);
    }

    private setShareZone(card: Card): void {
        let shareZone = document.getElementById('shareZone');
        shareZone?.setAttribute('src', card.url);
        shareZone?.setAttribute('visible', 'true');
    }

    //
    //Handeling the cards of other users
    //-----------------------------------------------------------------------------------

    getMyCards(): Card[] {
        return Array.from(this.markerMap.values()).filter((card) => card.found);
    }

    getAllUserCards(): UserCards[] {
        return this.userCards;
    }

    getUserCards(user: User): Card[] {
        return this.userCards.filter((usercard) => usercard.userId == user.id)[0].cards;
    }

    /**
     * Sets the cards for all users.
     * These cards are used to render the cards of other players
     * @param cards
     */
    setUsersCards(cards: UserCards[]) {
        this.userCards = cards;
    }
    private userCards: UserCards[] = [];
}
