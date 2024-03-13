/**
 * Zonelogic
 */
import { ZoneMarker } from './ZoneMarker';

export class Zone {
    constructor(marker1BarcodeValue, marker2BarcodeValue, sceneEl, name, color = 0xff6961) {
        this.scene = sceneEl;
        this.name = name;
        this.zoneEntity = null;
        this.cardsInZone = [];
        this.moving = true;
        this.redrawTolerance = 0.2;
        this.color = color;
        this.#createZoneMarkers(marker1BarcodeValue, marker2BarcodeValue);
    }

    getName() {
        return this.name;
    }

    getZoneMarker1() {
        return this.zoneMarker1;
    }

    getZoneMarker2() {
        return this.zoneMarker1;
    }

    getMarker1Id() {
        return this.zoneMarker1.id;
    }

    getMarker2Id() {
        return this.zoneMarker2.id;
    }

    hasMarker(marker) {
        return marker === this.zoneMarker1 || marker === this.zoneMarker2;
    }

    #createZoneMarkers(marker1BarcodeValue, marker2BarcodeValue) {
        this.zoneMarker1 = new ZoneMarker(
            this.scene,
            marker1BarcodeValue,
            'ZoneMarker_1_' + this.name,
            this
        );
        this.zoneMarker2 = new ZoneMarker(
            this.scene,
            marker2BarcodeValue,
            'ZoneMarker_2_' + this.name,
            this
        );
        this.zoneMarker1.toggleDebugNumber();
        this.zoneMarker2.toggleDebugNumber();
    }

    drawZone() {
        if (this.zoneMarker1 && this.zoneMarker2) {
            if (this.zoneEntity) {
                this.zoneEntity.remove();
            }
            this.setTotalZonePosition();

            const width = Math.abs(this.maxX - this.minX);
            const height = Math.abs(this.maxY - this.minY);

            const midpoint = new THREE.Vector3(
                this.minX + width / 2,
                this.minY + height / 2, // Assuming y position is constant, adjust if necessary
                this.zoneMarker1.getMarkerPosition().z
            );

            this.zoneEntity = document.createElement('a-entity');
            this.zoneEntity.setAttribute('geometry', {
                primitive: 'plane',
                width: width,
                height: height
            });
            this.zoneEntity.setAttribute('material', {
                color: this.color,
                side: 'double',
                transparent: true,
                opacity: 0.5
            });

            // Set the position to the midpoint between markers
            this.zoneEntity.object3D.position.copy(midpoint);
            this.zoneEntity.setAttribute('id', 'zoneRectangle_' + this.name);

            this.zoneEntity.zone = this;

            this.scene.appendChild(this.zoneEntity);
        }
    }

    setTotalZonePosition() {
        const position1 = this.zoneMarker1.getMarkerPosition().clone();
        const position2 = this.zoneMarker2.getMarkerPosition().clone();

        this.minX = Math.min(position1.x, position2.x);
        this.maxX = Math.max(position1.x, position2.x);
        this.minY = Math.min(position1.y, position2.y);
        this.maxY = Math.max(position1.y, position2.y);
    }

    onclick() {
        console.log('TEST');
    }

    removeZone() {
        if (this.zoneEntity) {
            this.zoneEntity.remove();
            this.zoneEntity = null;
            console.log('Removed zone');
            this.redrawZoneDisable();
        }
    }

    refreshZone() {
        this.zoneEntity.remove();
        this.zoneEntity = null;
        this.drawZone();
    }

    getZone() {
        return this.zoneEntity;
    }

    getZoneId() {
        return '#zoneRectangle_' + this.name;
    }

    /**
     * @param {CardMarker} card
     */
    cardInZone(card) {
        if (!card) return false;
        if (!this.zoneMarker1 || !this.zoneMarker2) return false;

        const isCardInZone = this.isInZone(card.getMarkerPosition().x, card.getMarkerPosition().y);
        if (isCardInZone) {
            this.addFoundCard();
        } else {
            this.removeCardFromZoneFound();
        }

        return isCardInZone;
    }

    isInZone(x, y) {
        if (!this.zoneEntity) {
            return false;
        }
        console.log(this.minX + ', ' + this.maxX + ' Y: ' + this.minY + ', ' + this.maxY);
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }

    addFoundCard(marker) {
        if (!this.cardsInZone.includes(marker)) {
            this.cardsInZone.push(marker);
        }
    }

    removeCardFromZoneFound(marker) {
        if (this.cardsInZone.includes(marker)) {
            const index = this.cardsInZone.indexOf(marker);
            this.cardsInZone.splice(index, 1);
        }
    }

    redrawZoneDisable() {
        clearTimeout(this.redrawTimeout);
    }

    redrawZoneEnable() {
        this.lastZoneMarker1Position = new THREE.Vector3().copy(
            this.zoneMarker1.getMarkerPosition()
        );
        this.lastZoneMarker2Position = new THREE.Vector3().copy(
            this.zoneMarker2.getMarkerPosition()
        );
        this.#redrawZone();
    }

    redrawZoneToggle() {
        if (this.moving) {
            this.moving = false;
            this.redrawZoneDisable();
        } else {
            this.moving = true;
            this.redrawZoneEnable();
            this.removeZone();
            this.drawZoneIfMarkersFound();
        }
    }

    #redrawZone() {
        if (this.moving) {
            if (this.zoneMarker1.found && this.zoneMarker2.found) {
                const currentZoneMarker1Position = this.zoneMarker1.getMarkerPosition();
                const currentZoneMarker2Position = this.zoneMarker2.getMarkerPosition();
                if (
                    Math.abs(this.lastZoneMarker1Position.x - currentZoneMarker1Position.x) >
                        this.redrawTolerance ||
                    Math.abs(this.lastZoneMarker1Position.y - currentZoneMarker1Position.y) >
                        this.redrawTolerance ||
                    Math.abs(this.lastZoneMarker2Position.x - currentZoneMarker2Position.x) >
                        this.redrawTolerance ||
                    Math.abs(this.lastZoneMarker2Position.y - currentZoneMarker2Position.y) >
                        this.redrawTolerance
                ) {
                    this.lastZoneMarker1Position = new THREE.Vector3().copy(
                        currentZoneMarker1Position
                    );
                    this.lastZoneMarker2Position = new THREE.Vector3().copy(
                        currentZoneMarker2Position
                    );
                    this.refreshZone();
                }
            }
            this.redrawTimeout = setTimeout(() => this.#redrawZone(), 100);
        }
    }

    drawZoneIfMarkersFound() {
        if (this.moving) {
            if (this.zoneMarker1.found && this.zoneMarker2.found) {
                this.drawZone();
                this.redrawZoneEnable();
            }
        }
    }

    removeZoneIfMarkerLost() {
        if (this.moving) {
            if (this.zoneMarker1.found && this.zoneMarker2.found) {
                this.removeZone();
            }
        }
    }
}
