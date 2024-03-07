export class CardMarker {
    constructor(sceneEl, markerUrl, cardBackSrc, id) {
        this.sceneElement = sceneEl;
        this.markerUrl = markerUrl;
        this.id = id;
        this.debugNumber = false;
        this.cardBackSrc = cardBackSrc;
        this.isFaceUp = false;

        this.#addMarkerToScene();
    }

    #addMarkerToScene() {
        this.markerElement = document.createElement('a-marker');
        this.markerElement.setAttribute('type', 'pattern');
        this.markerElement.setAttribute('url', this.markerUrl);
        this.markerElement.setAttribute('id', this.id);
        this.markerElement.setAttribute('registerevents', '');
        this.markerElement.cardMarker = this;
        this.sceneElement.appendChild(this.markerElement);

        this.#addCardImageToMarker();
        this.#addDebugNumberToMarker();
    }

    toggleDebugNumber() {
        this.debugNumber = !this.debugNumber;
        if (this.debugNumber) {
            this.textElement.setAttribute('visible', true);
        } else {
            this.textElement.setAttribute('visible', false);
        }
    }

    #addCardImageToMarker() {
        this.imageElement = document.createElement('a-image');
        this.imageElement.setAttribute('src', this.cardBackSrc);
        this.imageElement.setAttribute('id', 'card');
        this.imageElement.setAttribute('data-state', 'back');

        this.imageElement.object3D.scale.set(6.4 / 4, 8.9 / 4, 1);
        this.imageElement.object3D.position.set(0, 0, 0);
        this.imageElement.object3D.rotation.set(Math.PI / 2, 0, 0);
        this.markerElement.appendChild(this.imageElement);
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

    turnCardOnBack() {
        if (this.isFaceUp) {
            this.imageElement.setAttribute('data-state', 'back');
            this.imageElement.setAttribute('src', this.cardBackSrc);
        }
    }

    turnCardOnFace(faceUrl) {
        if (!this.isFaceUp) {
            this.imageElement.setAttribute('data-state', 'front');
            this.imageElement.setAttribute('src', faceUrl);
        }
    }

    getMarkerPosition() {
        return this.markerElement.object3D.position;
    }
}
