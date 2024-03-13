import { InfinityMarker } from './InfinityMarker';

export class CardMarker extends InfinityMarker {
    constructor(sceneEl, cardBackSrc, id) {
        super(sceneEl, id, id);

        this.markerElement.setAttribute('registerevents_card', '');
        this.cardBackSrc = cardBackSrc;
        this.isFaceUp = false;
        this.cardFaceSrc = '';
        this.#addCardImageToMarker();
    }

    #addCardImageToMarker() {
        this.imageElement = document.createElement('a-image');
        this.imageElement.setAttribute('src', this.cardBackSrc);
        this.imageElement.setAttribute('id', 'card');
        this.imageElement.setAttribute('data-state', 'back');

        this.imageElement.object3D.scale.set(6.4 / 4, 8.9 / 4, 1);
        this.imageElement.object3D.position.set(0, 0, 0);
        this.imageElement.object3D.rotation.set(-Math.PI / 2, 0, 0);
        this.markerElement.appendChild(this.imageElement);
    }

    turnCardOnBack() {
        if (this.isFaceUp) {
            this.imageElement.setAttribute('data-state', 'back');
            this.imageElement.setAttribute('src', this.cardBackSrc);
            this.isFaceUp = false;
        }
    }

    turnCardOnNewFace(faceUrl) {
        if (!this.isFaceUp) {
            this.imageElement.setAttribute('data-state', 'front');
            this.imageElement.setAttribute('src', faceUrl);
            this.isFaceUp = true;
            this.cardFaceSrc = faceUrl;
        }
    }

    turnCardCurrentFace() {
        if (this.hasFace() && !this.isFaceUp) {
            this.imageElement.setAttribute('data-state', 'front');
            this.imageElement.setAttribute('src', this.cardFaceSrc);
            this.isFaceUp = true;
        }
    }

    hasFace() {
        return this.cardFaceSrc != '';
    }

    setFaceUrl(faceUrl) {
        this.cardFaceSrc = faceUrl;
    }

    getVisibility() {
        this.imageElement.getAttribute('visible');
    }

    hideCardImage() {
        this.imageElement.setAttribute('visible', false);
        this.textElement.setAttribute('visible', false);
    }

    showCardImage() {
        if (this.debugNumber) {
            this.textElement.setAttribute('visible', true);
        }
        this.imageElement.setAttribute('visible', true);
    }
}
