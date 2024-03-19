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
//Buttons
const toggleHand = () => {
    handDisplay.toggleDisplay();
    console.log('toggled hand');
};
const setHandSpacing = (spacing) => {
    if (spacing.value) {
        handDisplay.setSpacing(spacing.value / 100);
    } else {
        handDisplay.setSpacing(0.2);
    }
    console.log('hand spacing set to ', spacing, '%');
};
const setCardSize = (size) => {
    var baseScaleX = 6.4 / 5;
    var baseScaleY = 8.9 / 5;
    if (size.value) {
        for (const card of cardmarkers) {
            card.imageElement.object3D.scale.set(
                baseScaleX * (size.value / 100),
                baseScaleY * (size.value / 100),
                1
            );
        }
    } else {
        for (const card of cardmarkers) {
            card.imageElement.object3D.scale.set(baseScaleX, baseScaleY, 1);
        }
    }

    console.log('set card size to ', size, '%');
};
defineExpose({
    toggleHand,
    setHandSpacing,
    setCardSize
});

//start

AFRAME.scenes.forEach((scene) => scene.removeFullScreenStyles());
/**
 * @type {CardMarker[]}
 */
var foundCardMarkers = [];
/**
 * @type {CardMarker[]}
 */
var cardmarkers = [];
/**
 * @type {Zone}
 */
var hideZone;
/**
 * @type {Zone}
 */
var shareZone;
var debug = true;
/**
 * @type {CardDisplay}
 */
var handDisplay = new CardDisplay('HandDisplay');

props.conService.onConnection(() => {
    if (!AFRAME.components['markers_start']) {
        AFRAME.registerComponent('markers_start', {
            init: function () {
                var sceneEl = document.querySelector('a-scene');

                hideZone = new Zone(124, 125, sceneEl, 'hide');
                shareZone = new ShareZone(126, 127, sceneEl, 'share', props.cardService.cardBack);

                console.log(`Adding ${props.cardService.numberOfCards} markers to the scene...`);
                document.querySelector('a-scene').addEventListener('click', (event) => {
                    let x = (event.clientX / window.innerWidth) * 4 - 2;
                    let y = 3 - (event.clientY / window.innerHeight) * 6;
                    if (shareZone.isInZone(x, y)) {
                        shareZone.redrawZoneToggle();
                    }
                    if (hideZone.isInZone(x, y)) {
                        hideZone.redrawZoneToggle();
                    }
                });
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
                        if (hideZone.cardInZone(foundCard)) {
                            foundCard.showCardImage();
                            card.turnCardOnBack();
                        } else if (props.cardService.markerMapContainsId(foundCard.id)) {
                            if (shareZone.cardInZone(foundCard)) {
                                foundCard.hideCardImage();
                                if (foundCard != shareZone.lastFoundCard) {
                                    shareZone.setLastFoundCard(foundCard);
                                    props.cardService.shareLocal(foundCard.id);
                                }
                            }
                        }

                        let isInAnyZone =
                            hideZone.cardsInZone.includes(foundCard) ||
                            shareZone.cardsInZone.includes(foundCard);
                        if (!isInAnyZone) {
                            showCard(foundCard);
                        } else {
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
                console.log('INIT Zone Events');
                const zoneMarker = this.el.InfinityMarker;
                this.el.addEventListener('markerFound', () => {
                    zoneMarker.found = true;
                    //add for loop here with zoneArray if we have multiple
                    hideZone.drawZoneIfMarkersFound();
                    shareZone.drawZoneIfMarkersFound();
                    console.log(
                        'Zone Marker Found: ',
                        zoneMarker.id,
                        'at ',
                        zoneMarker.getMarkerPosition()
                    );
                });

                this.el.addEventListener('markerLost', () => {
                    //add for loop here with zoneArray if we have multiple
                    hideZone.removeZoneIfMarkerLost();
                    shareZone.removeZoneIfMarkerLost();

                    console.log('Zone Marker Lost: ', zoneMarker.id);
                    zoneMarker.found = false;
                });
            }
        });
    }
    AFRAME.registerComponent('warnOnClick', {
        init: function () {
            this.el.addEventListener('click', (evnt) => {
                console.warn('I was clicked!\n Help!');
            });
        }
    });
    connected.value = true;
});

function generateMarkers(sceneEl) {
    for (var k = 0; k < props.cardService.numberOfCards + 1; k++) {
        var cardBackSrc = props.cardService.cardBack;
        var card = new CardMarker(sceneEl, cardBackSrc, k.toString());
        if (debug) {
            card.toggleDebugNumber();
        }
        cardmarkers.push(card);
    }
}

/**
 * @param {CardMarker} card
 */
function showCard(card) {
    if (!card.isFaceUp) {
        card.turnCardCurrentFace();
        card.showCardImage();
    }
    handDisplay.addCardToDisplayAndHide(card);
}

//TODO check if this is better than showCard for us
/**
 * @param {CardMarker} card
 */
function showCardSyncOnlyIfNew(card) {
    if (card.hasFace()) {
        card.turnCardCurrentFace();
    } else {
        showCard(card);
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
            arjs="sourceType: webcam; detectionMode: mono_and_matrix; matrixCodeType: 5x5_BCH_22_7_7; debugUIEnabled: false; sourceWidth:1920; sourceHeight:1080;"
            cursor="rayOrigin: mouse"
        >
            <a-camera id="userCamera"> </a-camera>
        </a-scene>
    </div>
</template>
