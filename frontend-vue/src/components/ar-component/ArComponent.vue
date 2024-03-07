<script setup lang="js">
import '@ar-js-org/ar.js';
import { Zone } from './Zone';
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
                const marker = this.el;

                marker.addEventListener('markerFound', () => {
                    var markerId = marker.id;
                    addFoundMarker(marker, foundCardMarkers);
                    if (handZone.markerInZone(marker)) {
                        turnCard(marker);
                    }
                    console.log('Marker Found: ', markerId, 'at ', marker.object3D.position);
                });

                marker.addEventListener('markerLost', () => {
                    var markerId = marker.id;
                    removeFoundMarker(marker, foundCardMarkers);
                    console.log('Marker Lost: ', markerId);
                });
                function checkMarkerInZone() {
                    for (let foundMarker of foundCardMarkers) {
                        if (handZone.markerInZone(foundMarker)) {
                            turnCard(foundMarker);
                        } else if (isCardBack(foundMarker)) {
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
                const marker = this.el;
                var lastPosition1;
                var lastPosition2;
                marker.addEventListener('markerFound', () => {
                    var markerId = marker.id;
                    var image = marker.querySelector('#text');
                    var position = marker.object3D.position;

                    addFoundMarker(marker, foundZoneMarkers);
                    //add for loop here with zoneArray if we have multiple
                    if (
                        isMarkerIdFound(handZone.getMarker1Id(), foundZoneMarkers) &&
                        isMarkerIdFound(handZone.getMarker2Id(), foundZoneMarkers)
                    ) {
                        lastPosition1 = handZone.getZoneMarker1().object3D.position.clone();
                        lastPosition2 = handZone.getZoneMarker2().object3D.position.clone();
                        handZone.drawZone();
                    }

                    console.log('Zone Marker Found: ', markerId, 'at ', marker.object3D.position);
                });

                marker.addEventListener('markerLost', () => {
                    var markerId = marker.id;

                    //add for loop here with zoneArray if we have multiple
                    if (
                        marker.id === handZone.getMarker1Id() ||
                        marker.id === handZone.getMarker2Id()
                    ) {
                        handZone.removeZone();
                    }

                    removeFoundMarker(marker, foundZoneMarkers);
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
        var markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'pattern');
        var url = props.cardService.markerBaseUrl + 'pattern-' + k + '.patt';
        markerEl.setAttribute('url', url);
        markerEl.setAttribute('id', k);

        markerEl.setAttribute('registerevents', '');
        sceneEl.appendChild(markerEl);
        if (debug) {
            addCardNumberToMarker(markerEl, k);
        }
        addCardImageToMarker(markerEl);
    }
}

function addCardImageToMarker(markerEl) {
    var imageEl = document.createElement('a-image');
    imageEl.setAttribute('src', props.cardService.cardBack);
    imageEl.setAttribute('id', 'card');
    imageEl.setAttribute('data-state', 'back');

    imageEl.object3D.scale.set(6.4 / 4, 8.9 / 4, 1);
    imageEl.object3D.position.set(0, 0, 0);
    imageEl.object3D.rotation.set(Math.PI / 2, 0, 0);
    markerEl.appendChild(imageEl);
}

function addCardNumberToMarker(markerEl, number) {
    var textEl = document.createElement('a-entity');

    textEl.setAttribute('id', 'text');
    textEl.setAttribute('text', {
        color: 'red',
        align: 'center',
        value: number,
        width: '5.5'
    });
    textEl.object3D.position.set(0, 0.7, 0);
    textEl.object3D.rotation.set(-90, 0, 0);

    markerEl.appendChild(textEl);
}

function isCardBack(marker) {
    if (!marker) return false;
    const imageEl = marker.querySelector('#card');
    if (!imageEl) return false;
    return imageEl.getAttribute('src') === props.cardService.cardBack;
}

function turnCard(marker) {
    const imageEl = marker.querySelector('#card');
    const cardState = imageEl.getAttribute('data-state');
    if (cardState !== 'back') {
        imageEl.setAttribute('data-state', 'back');
        imageEl.setAttribute('src', props.cardService.cardBack);
    }
}

function showCard(marker) {
    const imageEl = marker.querySelector('#card');
    const cardState = imageEl.getAttribute('data-state');
    let id = marker.getAttribute('id');
    if (cardState !== 'front') {
        imageEl.setAttribute('data-state', 'front');
        props.cardService.getCardByMarker(id).then((card) => {
            imageEl.setAttribute('src', card.url);
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
            arjs="debugUIEnabled: false; sourceType: webcam; patternRatio: 0.85; trackingMethod: best;"
        >
            <a-entity id="userCamera" camera>
                <!-- <a-cursor> </a-cursor> -->
            </a-entity>
        </a-scene>
    </div>
</template>
