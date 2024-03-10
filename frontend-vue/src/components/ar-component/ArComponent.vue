<script setup lang="js">
import '@ar-js-org/ar.js';
import { Zone } from './Zone';
import { ShareZone } from './ShareZone';

import { CardService } from '@/services/CardService';
import { CardMarker } from './CardMarker';
import { CardDisplay } from './CardDisplay';
import { ConnectionService } from '@/services/ConnectionService';
import { onUnmounted, ref } from 'vue';

const props = defineProps({
    cardService: {
        type: CardService
    },
    conService: {
        type: ConnectionService
    }
});
const connected = ref(false);

const resizeController = new AbortController();
window.addEventListener(
    'resize',
    (event) => {
        let video = document.getElementById('arjs-video');
        let canvas = document.getElementsByClassName('a-canvas');
        if (!video) return;
        let style = window.getComputedStyle(video);
        canvas
            .item(0)
            .setAttribute(
                'style',
                `width: ${style.width} !important; height: ${style.height} !important; margin-top: ${style.marginTop}; margin-left: ${style.marginLeft};`
            );
    },
    { signal: resizeController.signal }
);
AFRAME.scenes.forEach((scene) => scene.removeFullScreenStyles());
// AFRAME.AScene.removeFullScreenStyles();
/**
 * @type {CardMarker[]}
 */
var foundCardMarkers = [];
/**
 * @type {Zone}
 */
var hideZone;
/**
 * @type {Zone}
 */
var shareZone;
var debug = true;
var handDisplayEnabled = false;
/**
 * @type {CardDisplay}
 */
var handDisplay = new CardDisplay('HandDisplay');

props.conService.onConnection(() => {
    if (!AFRAME.components['markers_start']) {
        AFRAME.registerComponent('markers_start', {
            init: function () {
                var sceneEl = document.querySelector('a-scene');

                hideZone = new Zone(
                    props.cardService.markerBaseUrl + 'ZoneMarker1.patt',
                    props.cardService.markerBaseUrl + 'ZoneMarker2.patt',
                    sceneEl,
                    'hand'
                );
                shareZone = new ShareZone(
                    props.cardService.markerBaseUrl + 'shareZoneMarker1.patt',
                    props.cardService.markerBaseUrl + 'shareZoneMarker2.patt',
                    sceneEl,
                    'share'
                );

                console.log(`Adding ${props.cardService.numberOfCards} markers to the scene...`);
                generateMarkers(sceneEl);
            }
        });
    }

    //Detect marker found and lost
    if (!AFRAME.components['registerevents_card']) {
        AFRAME.registerComponent('registerevents_card', {
            init: function () {
                const card = this.el.InfinityMarker;

                this.el.addEventListener('markerFound', () => {
                    addFoundMarker(card, foundCardMarkers);
                    if (hideZone.cardInZone(card)) {
                        card.turnCardOnBack();
                    }
                    console.log('Marker Found: ', card.id, 'at ', card.getMarkerPosition());
                });

                this.el.addEventListener('markerLost', () => {
                    removeFoundMarker(card, foundCardMarkers);
                    console.log('Marker Lost: ', card.id);
                    handDisplay.removeCardFromDisplay(card);
                });

                function checkMarkerInZone() {
                    for (let foundCard of foundCardMarkers) {
                        let isInAnyZone = false;
                        if ((isInAnyZone = hideZone.cardInZone(foundCard))) {
                            card.turnCardOnBack();
                            foundCard.showCardImage();
                        }
                        if (props.cardService.markerMapContainsId(foundCard.id)) {
                            if (
                                foundCard != shareZone.lastFoundCard &&
                                (isInAnyZone = shareZone.cardInZone(foundCard))
                            ) {
                                props.cardService.share(foundCard.id);
                            }
                        }

                        if (!isInAnyZone && !foundCard.isFaceUp) {
                            showCard(foundCard);
                            foundCard.showCardImage();
                        }
                        if (isInAnyZone && handDisplayEnabled) {
                            handDisplay.removeCardFromDisplayAndShow(foundCard);
                        }
                    }
                    setTimeout(checkMarkerInZone, 100);
                }
                checkMarkerInZone();
            }
        });
    }

    if (!AFRAME.components['registerevents_zone']) {
        AFRAME.registerComponent('registerevents_zone', {
            init: function () {
                const zoneMarker = this.el.InfinityMarker;
                this.el.addEventListener('markerFound', () => {
                    zoneMarker.found = true;
                    //add for loop here with zoneArray if we have multiple
                    drawZonesIfMarkersFound();
                    console.log(
                        'Zone Marker Found: ',
                        zoneMarker.id,
                        'at ',
                        zoneMarker.getMarkerPosition()
                    );
                });

                this.el.addEventListener('markerLost', () => {
                    //add for loop here with zoneArray if we have multiple
                    removeZonesIfMarkerLost(zoneMarker);
                    console.log('Zone Marker Lost: ', zoneMarker.id);
                    zoneMarker.found = false;
                });
            }
        });
    }
    connected.value = true;
});

function drawZonesIfMarkersFound() {
    if (hideZone.zoneMarker1.found && hideZone.zoneMarker2.found) {
        hideZone.drawZone();
        hideZone.redrawZoneEnable();
    }
    if (shareZone.zoneMarker1.found && shareZone.zoneMarker2.found) {
        shareZone.drawZone();
        shareZone.redrawZoneEnable();
    }
}

function removeZonesIfMarkerLost(zoneMarker) {
    if (hideZone.hasMarker(zoneMarker)) {
        hideZone.removeZone();
    }
    if (shareZone.hasMarker(zoneMarker)) {
        shareZone.removeZone();
    }
}

function generateMarkers(sceneEl) {
    for (var k = 0; k < props.cardService.numberOfCards + 1; k++) {
        var markerUrl = props.cardService.markerBaseUrl + 'pattern-' + k + '.patt';
        var cardBackSrc = props.cardService.cardBack;
        var card = new CardMarker(sceneEl, markerUrl, cardBackSrc, k);
        if (debug) {
            card.toggleDebugNumber();
        }
    }
}

/**
 * @param {CardMarker} card
 */
function showCard(card) {
    if (!card.isFaceUp) {
        card.turnCardCurrentFace();
        if (handDisplayEnabled) {
            handDisplay.addCardToDisplayAndHide(card);
        }
    }
}

//TODO check if this is better than showCard for us
/**
 * @param {CardMarker} marker
 */
function showCardSyncOnlyIfNew(marker) {
    if (marker.hasFace()) {
        marker.turnCardCurrentFace();
    } else {
        showCard();
    }
}

function addFoundMarker(marker, markerList) {
    if (!markerList.includes(marker)) {
        markerList.push(marker);

        props.cardService.getCardByMarkerId(marker.id).then((face) => {
            marker.setFaceUrl(face.url);
        });
        console.log('Added marker:', marker.id, 'to found markers list');
    }
}

function removeFoundMarker(marker, markerList) {
    props.cardService.lostCard(marker.id);
    const index = markerList.indexOf(marker);
    if (index !== -1) {
        markerList.splice(index, 1);
        console.log('Removed marker:', marker.id, 'from found markers list');
    }
}

// is called to remove all remainings of AFRAME as far as possible
onUnmounted(() => {
    // stop resizing and reset
    resizeController.abort();

    // remove VideoEl
    let videoEl = document.getElementById('arjs-video');
    if (videoEl) {
        videoEl.remove();
    }

    // remove custom components
    const componentsToRemove = ['markers_start', 'registerevents_card', 'registerevents_zone'];
    for (let component of componentsToRemove) {
        delete AFRAME.components[component];
    }

    console.log('finished unmount');
    location.reload();
});
</script>

<template>
    <div v-if="connected">
        <a-scene
            markers_start
            xr-mode-ui="enabled: false"
            color-space="sRGB"
            renderer="gammaOutput: true"
            arjs="debugUIEnabled: false; sourceType: webcam; patternRatio: 0.85; trackingMethod: best; sourceWidth: 1280; sourceHeight: 720;"
        >
            <a-entity id="userCamera" camera> </a-entity>
        </a-scene>
    </div>
</template>
