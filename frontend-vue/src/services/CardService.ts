import { ConnectionService } from '@/services/ConnectionService';
import { CardSync } from './CardSync';
import { Zone, type Card, type UserCards } from '@/model/card';
import type { User } from '@/model/user';
import { GAME_CONFIG } from '@/model/game';

const MAX_NUM_OF_MARKERS = 50 - 4;

export class CardService {
    private conSerivce: ConnectionService;
    private cardSync: CardSync;

    public cardBack: string;
    public numberOfCards: number;
    markerMap: Map<string, Card>;
    private sharedCard: Card | undefined;
    cardCallbacks: Map<string, Function>;

    constructor(conService: ConnectionService) {
        this.conSerivce = conService;
        this.cardBack = 'url(./InfinityDeck/cardImages/french-suited-cards/card-back-blue.svg)';
        this.numberOfCards = 0;
        this.markerMap = new Map<string, Card>();
        this.cardCallbacks = new Map<string, Function>();
        this.cardSync = new CardSync(conService, this);

        // conService.onConnection(() => this.numberOfCards = conService.game.value!.deck.length);
        conService.onConnection((data) => {
            this.numberOfCards = conService.game.value!.deck.length < MAX_NUM_OF_MARKERS ? conService.game.value!.deck.length : MAX_NUM_OF_MARKERS;
            if (data.markerMap) {
                this.markerMap = new Map(Object.entries<Card>(data.markerMap));
                console.debug('recovered markerMap');
            }
        });
        conService.onCardDrawed((markerId, card) => this.registerMarker(markerId, card));
        conService.addListener('freedMarkers', (unusedMarkers: (string)[]) => {
            for (let unusedMarker of unusedMarkers) {
                let res = this.markerMap.delete(unusedMarker);
                console.log('freed', unusedMarker, res)
            }
            console.debug('Freed', unusedMarkers.length, 'markers!', this.markerMap);
        })
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
        markerId = markerId.toString();
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
        markerId = markerId.toString(); // ensure we get a string here!
        const card = this.markerMap.get(markerId);
        // marker is already known
        if (card) {
            card.found = true;
            card.lastSeen = Date.now();
            return new Promise((resolve) => resolve(card));
        }

        // unknown marker detectet
        this.conSerivce.drawNewCard(markerId, Date.now());
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
    public registerMarker(markerId: string, card: Card): void {
        markerId = markerId.toString(); // ensure we get a string here!
        // if it is a local game, update markerMap and check for waiting callbacks
        if (this.conSerivce.room.value?.isLocal) {
            if (this.markerMap.get(markerId)) {
                console.warn('Marker was already known, but was registered twice!');
            }
            card.url = this.getCardUrl(card.cardFace);
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

    public shareLocal(markerId: string): void {
        markerId = markerId.toString(); // ensure we get a string here!
        let card = this.markerMap.get(markerId);
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
