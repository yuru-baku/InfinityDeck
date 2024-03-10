import { Zone } from './Zone';

export class ShareZone extends Zone {
    constructor(marker1Url, marker2Url, sceneEl, name) {
        super(marker1Url, marker2Url, sceneEl, name, 0xadd8e6);
    }
    /**
     * @param {CardMarker} card
     */
    cardInZone(card) {
        var found = super.cardInZone(card);
        if (found) {
            this.lastFoundCard = card;
        }
        return found;
    }
}
