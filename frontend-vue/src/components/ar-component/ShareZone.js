import { Zone } from './Zone';

export class ShareZone extends Zone {
    constructor(marker1BarcodeValue, marker2BarcodeValue, sceneEl, name) {
        super(marker1BarcodeValue, marker2BarcodeValue, sceneEl, name, 0xadd8e6);
        this.imageElement = document.createElement('a-image');
        this.imageElement.setAttribute('id', 'shareZone');
        this.imageElement.setAttribute('visible', 'false');
        this.imageElement.object3D.rotation.set(Math.PI, 0, 0);
        this.imageElement.object3D.scale.set(1, 1, 1);
        this.imageElement.object3D.position.set(0, 0, 0);
    }
    /**
     * @param {CardMarker} card
     */
    cardInZone(card) {
        var found = super.cardInZone(card);
        if (found) {
            //alte card
            this.lastFoundCard?.showCardImage();
            //neue card
            this.lastFoundCard = card;
            card.hideCardImage();
        }
        return found;
    }

    drawZone() {
        super.drawZone();
        this.zoneEntity.appendChild(this.imageElement);
    }
}
