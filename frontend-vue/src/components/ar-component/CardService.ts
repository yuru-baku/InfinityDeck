import { ConnectionService } from '@/services/ConnectionService'

export type Card = { name: string; url: string }

export class CardService {
  private conSerivce: ConnectionService

  public cardBack: string
  public numberOfCards: number
  markerMap: Map<string, Card>
  cardCallbacks: Map<string, Function>

  constructor(conService: ConnectionService) {
    this.conSerivce = conService
    this.cardBack = 'url(/cardImages/french-suited-cards/card-back-blue.svg)'
    this.numberOfCards = 0
    this.markerMap = new Map<string, Card>()
    this.cardCallbacks = new Map<string, Function>()
    // conService.onConnection(() => this.numberOfCards = conService.game.value!.deck.length);
    conService.onConnection(() => (this.numberOfCards = 40)) // Todo: Marker Anzahl?!
    conService.onCardDrawed((markerId, cardName) => this.registerMarker(markerId, cardName))
  }

  private getCardUrl(cardName: string) {
    const basePath = '/cardImages/french-suited-cards'
    const fileType = 'svg'
    return `url(${basePath}/${cardName}.${fileType})`
  }

  /**
   * Checks if the card is known. If it is it will be returned immediately.
   * Otherwise it will be returned when the server responded.
   * @param markerId
   * @returns a promise which will be resolved as soon as the card is available
   */
  public getCardByMarker(markerId: string): Promise<Card> {
    const card = this.markerMap.get(markerId)
    // marker is already known
    if (card) {
      return new Promise((resolve) => resolve(card))
    }
    // unknown marker detectet
    this.conSerivce.drawNewCard(markerId)
    return new Promise((resolve, reject) => {
      this.cardCallbacks.set(markerId, (card: Card) => resolve(card))
      // Todo: add error handling
    })
  }

  /**
   * Registers a new marker and card combination.
   * If there is a callback waiting it will be called.
   * @param markerId
   * @param cardName
   */
  public registerMarker(markerId: string, cardName: string) {
    const card = { name: cardName, url: this.getCardUrl(cardName) }
    if (this.markerMap.get(markerId)) {
      console.warn('Marker was already known, but was registered twice!')
    }
    this.markerMap.set(markerId, card)
    const callback = this.cardCallbacks.get(markerId)
    if (callback) {
      callback(card)
    }
    // if there was no callback someone else drew this card locally
  }

  public reloadMarkerMap() {}
}
