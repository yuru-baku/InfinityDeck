export class InfinityMarker {
    constructor(sceneEl, barcodeValue, id) {
        this.sceneElement = sceneEl;
        this.barcodeValue = barcodeValue;
        this.id = id;
        this.#addMarkerToScene();
        this.debugNumber = false;
        this.found = false;
    }

    #addMarkerToScene() {
        this.markerElement = document.createElement('a-marker');
        this.markerElement.setAttribute('type', 'barcode');
        this.markerElement.setAttribute('value', this.barcodeValue);
        this.markerElement.setAttribute('id', this.id);
        this.markerElement.InfinityMarker = this;
        this.sceneElement.appendChild(this.markerElement);

        this.#addDebugNumberToMarker();
    }

    #addDebugNumberToMarker() {
        this.textElement = document.createElement('a-entity');

        this.textElement.setAttribute('id', 'text');
        this.textElement.setAttribute('text', {
            color: 'red',
            align: 'center',
            value: this.id,
            width: '5.5'
        });
        this.textElement.object3D.position.set(0, 0.7, 0);
        this.textElement.object3D.rotation.set(-90, 0, 0);

        this.markerElement.appendChild(this.textElement);
        this.textElement.setAttribute('visible', false);
    }

    toggleDebugNumber() {
        this.debugNumber = !this.debugNumber;
        if (this.debugNumber) {
            this.textElement.setAttribute('visible', true);
        } else {
            this.textElement.setAttribute('visible', false);
        }
    }

    getMarkerPosition() {
        return this.markerElement.object3D.position;
    }
}
