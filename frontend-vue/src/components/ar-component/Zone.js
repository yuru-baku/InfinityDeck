/**
 * Zonelogic
 */
import { ZoneMarker } from './ZoneMarker';

export class Zone {
    constructor(marker1Url, marker2Url, sceneEl, name) {
        this.scene = sceneEl;
        this.name = name;
        this.zoneEntity = null;
        this.cardsInZone = [];
        this.moving = false;
        this.redrawTolerance = 0.2;
        this.#createZoneMarkers(marker1Url, marker2Url);
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

    #createZoneMarkers(marker1Url, marker2Url) {
        this.zoneMarker1 = new ZoneMarker(
            this.scene,
            marker1Url,
            'ZoneMarker_1_' + this.name,
            this
        );
        this.zoneMarker2 = new ZoneMarker(
            this.scene,
            marker2Url,
            'ZoneMarker_2_' + this.name,
            this
        );
        this.zoneMarker1.toggleDebugNumber();
        this.zoneMarker2.toggleDebugNumber();
    }

    drawZone() {
        if (this.zoneMarker1 && this.zoneMarker2) {
            const position1 = this.zoneMarker1.getMarkerPosition().clone();
            const position2 = this.zoneMarker2.getMarkerPosition().clone();

            // Get the marker widths TODO maybe calculate this
            const width1 = 1;
            const width2 = 1;
            const height1 = 3;
            const height2 = 3;

            // Adjust the positions based on the outer edges
            position1.x -= width1 / 2;
            position1.z -= height1 / 2;

            position2.x += width2 / 2;
            position2.z += height2 / 2;

            const width = Math.abs(position2.x - position1.x);
            const height = Math.abs(position2.z - position1.z);

            const midpoint = new THREE.Vector3()
                .addVectors(position1, position2)
                .multiplyScalar(0.5);

            this.zoneEntity = document.createElement('a-entity');
            this.zoneEntity.setAttribute('geometry', {
                primitive: 'plane',
                width: width,
                height: height
            });
            this.zoneEntity.setAttribute('material', {
                color: 0x00ff00,
                side: 'double',
                transparent: true,
                opacity: 0.5
            });

            // Set the position to the midpoint between markers
            this.zoneEntity.object3D.position.copy(midpoint);
            this.zoneEntity.setAttribute('id', 'zoneRectangle_' + this.name);

            this.scene.appendChild(this.zoneEntity);
        }
    }

    removeZone() {
        if (this.zoneEntity) {
            this.zoneEntity.parentNode.removeChild(this.zoneEntity);
            this.zoneEntity = null;
            console.log('Removed zone');
            this.redrawZoneDisable();
        }
    }

    refreshZone() {
        this.zoneEntity.parentNode.removeChild(this.zoneEntity);
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

        const minX = Math.min(
            this.zoneMarker1.getMarkerPosition().x,
            this.zoneMarker2.getMarkerPosition().x
        );
        const maxX = Math.max(
            this.zoneMarker1.getMarkerPosition().x,
            this.zoneMarker2.getMarkerPosition().x
        );
        const minY = Math.min(
            this.zoneMarker1.getMarkerPosition().y,
            this.zoneMarker2.getMarkerPosition().y
        );
        const maxY = Math.max(
            this.zoneMarker1.getMarkerPosition().y,
            this.zoneMarker2.getMarkerPosition().y
        );

        var isCardInZone =
            card.getMarkerPosition().x >= minX &&
            card.getMarkerPosition().x <= maxX &&
            card.getMarkerPosition().y >= minY &&
            card.getMarkerPosition().y <= maxY;

        if (isCardInZone) {
            this.addFoundCard();
        } else {
            this.removeCardFromZoneFound();
        }

        return isCardInZone;
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
        this.moving = false;
        clearTimeout(this.redrawTimeout);
    }

    redrawZoneEnable() {
        if (!this.moving) {
            this.moving = true;
            this.lastZoneMarker1Position = new THREE.Vector3().copy(
                this.zoneMarker1.getMarkerPosition()
            );
            this.lastZoneMarker2Position = new THREE.Vector3().copy(
                this.zoneMarker2.getMarkerPosition()
            );
            this.#redrawZone();
        }
    }

    checkIfMarkerFound() {}

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
}
