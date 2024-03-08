<script setup lang="js">
import '@ar-js-org/ar.js';
import { Zone } from './Zone';
import { CardMarker } from './CardMarker';
import { CardService } from './CardService';
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

var foundCardMarkers = [];
var foundZoneMarkers = [];
var handZone;
var debug = true;

props.conService.onConnection(() => {
    if (!AFRAME.components['markers_start']) {
        AFRAME.registerComponent('markers_start', {
            init: function () {
                var sceneEl = document.querySelector('a-scene');

                console.log(`Adding ${props.cardService.numberOfCards} markers to the scene...`);
                generateMarkers(sceneEl);

                handZone = new Zone(
                    props.cardService.markerBaseUrl + 'ZoneMarker1.patt',
                    props.cardService.markerBaseUrl + 'ZoneMarker2.patt',
                    sceneEl,
                    'hand',
                    foundZoneMarkers
                );
            }
        });
    }

    //Detect marker found and lost
    if (!AFRAME.components['registerevents']) {
        AFRAME.registerComponent('registerevents', {
            init: function () {
                const marker = this.el.cardMarker;

                this.el.addEventListener('markerFound', () => {
                    addFoundMarker(marker, foundCardMarkers);
                    if (handZone.markerInZone(marker)) {
                        marker.turnCardOnBack();
                    }
                    console.log('Marker Found: ', marker.id, 'at ', marker.getMarkerPosition());
                });

                this.el.addEventListener('markerLost', () => {
                    removeFoundMarker(marker, foundCardMarkers);
                    console.log('Marker Lost: ', marker.id);
                });
                function checkMarkerInZone() {
                    for (let foundMarker of foundCardMarkers) {
                        if (handZone.markerInZone(foundMarker)) {
                            marker.turnCardOnBack();
                        } else if (!foundMarker.isFaceUp) {
                            showCard(foundMarker);
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
                const zoneMarker = this.el;
                zoneMarker.addEventListener('markerFound', () => {
                    var markerId = zoneMarker.id;

                    addFoundMarker(zoneMarker, foundZoneMarkers);
                    //add for loop here with zoneArray if we have multiple
                    if (
                        isMarkerIdFound(handZone.getMarker1Id(), foundZoneMarkers) &&
                        isMarkerIdFound(handZone.getMarker2Id(), foundZoneMarkers)
                    ) {
                        handZone.drawZone();
                    }

                    console.log(
                        'Zone Marker Found: ',
                        markerId,
                        'at ',
                        zoneMarker.object3D.position
                    );
                });

                zoneMarker.addEventListener('markerLost', () => {
                    var markerId = zoneMarker.id;

                    //add for loop here with zoneArray if we have multiple
                    if (
                        zoneMarker.id === handZone.getMarker1Id() ||
                        zoneMarker.id === handZone.getMarker2Id()
                    ) {
                        handZone.removeZone();
                    }

                    removeFoundMarker(zoneMarker, foundZoneMarkers);
                    console.log('Zone Marker Lost: ', markerId);
                });

                handZone.redrawZoneEnable();
            }
        });
    }
    connected.value = true;
});

function generateMarkers(sceneEl) {
    for (var k = 0; k < props.cardService.numberOfCards + 1; k++) {
        var markerUrl = props.cardService.markerBaseUrl + 'pattern-' + k + '.patt';
        var cardBackSrc = props.cardService.cardBack;
        new CardMarker(sceneEl, markerUrl, cardBackSrc, k);
    }
}

/**
 * @param {CardMarker} marker
 */
function showCard(marker) {
    if (!marker.isFaceUp) {
        props.cardService.getCardByMarker(marker.id).then((card) => {
            marker.turnCardOnFace(card.url);
        });
    }
}

function addFoundMarker(marker, markerList) {
    if (!markerList.includes(marker)) {
        markerList.push(marker);
        console.log('Added marker:', marker.id, 'to found markers list');
    }
}

function removeFoundMarker(marker, markerList) {
    const index = markerList.indexOf(marker);
    if (index !== -1) {
        markerList.splice(index, 1);
        console.log('Removed marker:', marker.id, 'from found markers list');
    }
}

function isMarkerIdFound(markerId, list) {
    return list.some((marker) => marker.id === markerId);
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
    const componentsToRemove = ['markers_start', 'registerevents', 'registerevents_zone'];
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
            <a-entity id="userCamera" camera>
                <!-- <a-cursor> </a-cursor> -->
            </a-entity>
        </a-scene>
    </div>
</template>
