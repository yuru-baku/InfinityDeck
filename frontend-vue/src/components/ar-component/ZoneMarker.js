import { InfinityMarker } from './InfinityMarker';
import { Zone } from './Zone';

export class ZoneMarker extends InfinityMarker {
    constructor(sceneEl, barcodeValue, id, zone) {
        super(sceneEl, barcodeValue, id);
        this.markerElement.setAttribute('registerevents_zone', '');
        this.zone = zone;
        // var idNumber = parseInt(id.match(/\d+/)[0]);
        // // this.textElement.setAttribute('text', {
        // //     color: 'red',
        // //     align: 'center',
        // //     value: idNumber,
        // //     width: '5.5'
        // // });

        // this.markerElement.setAttribute('clicker', "");
        this.#addCardImageToMarker()
    }

    #addCardImageToMarker() {
        this.imageElement = document.createElement('a-image');
        this.imageElement.setAttribute('src', `url(/InfinityDeck/cardImages/zones/${this.zone.name}.svg)`);
        this.imageElement.setAttribute('id', 'card');

        // this.imageElement.object3D.scale.set(6.4 / 5, 8.9 / 5, 1);
        this.imageElement.object3D.position.set(0, 0, 0);
        this.imageElement.object3D.rotation.set(-Math.PI / 2, 0, 0);
        this.markerElement.appendChild(this.imageElement);
    }
}
