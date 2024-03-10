import { ConnectionService } from '@/services/ConnectionService';
import { CardSync } from './CardSync';
import { type Card, type UserCards, type Zone } from '@/model/card';
import type { User } from '@/model/user';

export class CardService {
    private conSerivce: ConnectionService;
    private cardSync: CardSync;

    public cardBack: string;
    public markerBaseUrl: string;
    public numberOfCards: number;
    markerMap: Map<string, Card>;
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
                        { cardFace: value, url: this.getCardUrl(value), zone: undefined }
                    ])
                );
                console.log('recovered markerMap');
            }
        });
        conService.onCardDrawed((markerId, cardName) => this.registerMarker(markerId, cardName));
    }

    private getCardUrl(cardName: string): string {
        const basePath = './InfintyDeck/cardImages/french-suited-cards';
        const fileType = 'svg';
        return `url(${basePath}/${cardName}.${fileType})`;
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
            return new Promise((resolve) => resolve(card));
        }
        // unknown marker detectet
        this.conSerivce.drawNewCard(markerId);
        return new Promise((resolve, reject) => {
            this.cardCallbacks.set(markerId, (card: Card) => resolve(card));
            // Todo: add error handling
        });
    }

    /**
     * Registers a new marker and card combination.
     * If there is a callback waiting it will be called.
     */
    public registerMarker(markerId: string, cardName: string) {
        // if it is a local game, update markerMap and check for waiting callbacks
        if (this.conSerivce.room.value?.isLocal) {
            if (this.markerMap.get(markerId)) {
                console.warn('Marker was already known, but was registered twice!');
            }
            const card: Card = {
                cardFace: cardName,
                url: this.getCardUrl(cardName),
                zone: undefined
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

    //Handeling the cards of other users
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
