import { CardMarker } from './CardMarker';

export class CardDisplay {
    /**
     * Creates an instance of CardDisplay.
     * @param {string} name - The name of the display.
     * @param {number} [centerX=0] - The starting x-coordinate.
     * @param {number} [startY=-0.5] - The starting y-coordinate.
     * @param {Object} [scale={ x: 0.5, y: 0.5, z: 1 }] - The scale of the image elements.
     * @param {number} [cardSpacing=0.4] - The spacing between cards.
     */
    constructor(
        name,
        centerX = 0,
        startY = -0.5,
        scale = { x: 0.5, y: 0.5, z: 1 },
        cardSpacing = 0.4
    ) {
        /**
         * An array of numbers.
         * @type {CardMarker[]}
         */
        this.markersDisplayed = [];
        this.imageElements = [];
        this.visible = false;
        this.centerX = centerX;
        this.startY = startY;
        this.name = name;
        this.scale = scale;
        this.cardSpacing = cardSpacing;
        this.enabled = true;
    }

    /**
     * @param {CardMarker} marker
     */
    addCardToDisplay(card) {
        if (!this.markersDisplayed.includes(card)) {
            this.markersDisplayed.push(card);
            if (this.enabled) {
                this.refreshDisplay();
            }
        }
    }

    /**
     * @param {CardMarker} marker
     */
    removeCardFromDisplay(card) {
        if (this.markersDisplayed.includes(card)) {
            const index = this.markersDisplayed.indexOf(card);
            this.markersDisplayed.splice(index, 1);
            if (this.enabled) {
                this.refreshDisplay();
            }
        }
    }

    /**
     * @param {CardMarker} marker
     */
    addCardToDisplayAndHide(card) {
        card.hideCardImage();
        this.addCardToDisplay(card);
    }
    /**
     * @param {CardMarker} marker
     */
    removeCardFromDisplayAndShow(card) {
        card.showCardImage();
        this.removeCardFromDisplay();
    }

    removeDisplay() {
        if (this.visible || this.imageElements.length > 0) {
            this.visible = false;
            this.imageElements.forEach((image, index) => {
                this.imageElements.splice(index, 1);
                image.remove();
            });
        }
    }

    refreshDisplay() {
        this.removeDisplay();
        this.markersDisplayed.forEach((card, index) => {
            var startX = this.centerX - (this.cardSpacing * this.markersDisplayed.length) / 2;
            var position = {
                x: startX + this.cardSpacing * index,
                y: this.startY,
                z: -2
            };
            this.#generateImageElement(card, position);
            this.visible = true;
        });
    }

    /**
     * @param {CardMarker} marker
     * @param {Object} position - The position of the image element.
     * @param {number} position.x - The x-coordinate.
     * @param {number} position.y - The y-coordinate.
     * @param {number} position.z - The z-coordinate.
     * @private
     */
    #generateImageElement(card, position) {
        const newImageEl = document.createElement('a-image');

        newImageEl.setAttribute('src', card.cardFaceSrc);
        newImageEl.setAttribute('id', this.name);
        newImageEl.object3D.scale.set(this.scale.x, this.scale.y, this.scale.z);
        newImageEl.object3D.rotation.set(0, 0, 0);
        newImageEl.object3D.position.set(position.x, position.y, position.z);

        card.sceneElement.appendChild(newImageEl);
        newImageEl.display = this;
        this.imageElements.push(newImageEl);
    }
}
