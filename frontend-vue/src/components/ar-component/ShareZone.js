import { Zone } from './Zone';

export class ShareZone extends Zone {
    constructor(marker1Url, marker2Url, sceneEl, name) {
        super(marker1Url, marker2Url, sceneEl, name, 0xadd8e6);
        this.imageElement = document.createElement('a-image');
        this.imageElement.setAttribute('id', 'shareZone');
        this.imageElement.setAttribute('visible', 'false');
        this.imageElement.object3D.scale.set(6.4 / 4, 8.9 / 4, 1);
        this.imageElement.object3D.position.set(0, 0, 0);
        this.zoneEntity.appendChild(this.imageElement);
    }
    /**
     * @param {CardMarker} card
     */
    cardInZone(card) {
        var found = super.cardInZone(card);
        if (found) {
            //alte card
            this.lastFoundCard.showCardImage();
            //neue card
            this.lastFoundCard = card;
            card.hideCardImage();
        }
        return found;
    }
}
