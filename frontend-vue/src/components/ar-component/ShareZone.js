import { Zone } from './Zone';

export class ShareZone extends Zone {
    constructor(marker1BarcodeValue, marker2BarcodeValue, sceneEl, name, cardBack) {
        super(marker1BarcodeValue, marker2BarcodeValue, sceneEl, name, 0xadd8e6);
        this.imageElement = document.createElement('a-plane');
        this.imageElement.setAttribute('id', 'shareZone');
        this.imageElement.setAttribute('visible', 'false');
        this.imageElement.setAttribute('src', cardBack);
        this.imageElement.object3D.position.set(0, 0, -1);

        this.imageElement.object3D.scale.set(1, 1, 1);

        this.imageElement.object3D.rotation.set(0, 0, 0);
    }

    setLastFoundCard(lastFoundCard) {
        this.lastFoundCard?.showCardImage();
        this.lastFoundCard = lastFoundCard;
        lastFoundCard.hideCardImage();
    }

    drawZone() {
        super.drawZone();
        if (!this.scene.querySelector('#shareZone')) {
            this.scene.appendChild(this.imageElement);
        }
        this.imageElement.setAttribute('visible', 'true');
        if (this.zoneEntity) {
            var zonePosition = this.zoneEntity.object3D.position;
            this.imageElement.object3D.position.set(zonePosition.x, zonePosition.y, zonePosition.z);
            var scalefac = 1;
            this.imageElement.setAttribute('geometry', {
                width: 0.64 * scalefac * Math.min(this.zoneWidth, this.zoneHeight),
                height: scalefac * Math.min(this.zoneWidth, this.zoneHeight)
            });
        }
    }

    removeZone() {
        super.removeZone();
        this.imageElement.setAttribute('visible', 'false');
    }
}
