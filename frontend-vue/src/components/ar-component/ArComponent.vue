<script setup lang="js">
import '@ar-js-org/ar.js';
import { Zone } from './Zone';
import { CardService } from './CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { onUnmounted, ref } from 'vue';
import { Card } from '@/model/card';

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
console.log(AFRAME);
AFRAME.scenes.forEach((scene) => scene.removeFullScreenStyles());
// AFRAME.AScene.removeFullScreenStyles();

//Global Variables
var markersURLArray = [];
var markersNameArray = [];

var foundCardMarkers = [];
var foundZoneMarkers = [];
var handZone;

props.conService.onConnection(() => {
    if (!AFRAME.components['markers_start']) {
        AFRAME.registerComponent('markers_start', {
            init: function () {
                console.log(`Adding ${props.cardService.numberOfCards} markers to the scene...`);

                var sceneEl = document.querySelector('a-scene');
                //list of the markers
                for (var i = 0; i < props.cardService.numberOfCards + 1; ++i) {
                    var url = './markers/pattern-' + i + '.patt';
                    markersURLArray.push(url);
                    markersNameArray.push(i);
                }
                for (var k = 0; k < props.cardService.numberOfCards + 1; ++k) {
                    var markerEl = document.createElement('a-marker');
                    markerEl.setAttribute('type', 'pattern');
                    markerEl.setAttribute('url', markersURLArray[k]);
                    markerEl.setAttribute('id', markersNameArray[k]);

                    markerEl.setAttribute('registerevents', '');
                    sceneEl.appendChild(markerEl);
                    markerEl.style.zIndex = '1'; // Adjust the value as needed

                    // Add text to each marker
                    var textEl = document.createElement('a-entity');

                    textEl.setAttribute('id', 'text');
                    textEl.setAttribute('text', {
                        color: 'red',
                        align: 'center',
                        value: markersNameArray[k],
                        width: '5.5'
                    });
                    textEl.object3D.position.set(0, 0.7, 0);
                    textEl.object3D.rotation.set(-90, 0, 0);

                    markerEl.appendChild(textEl);

                    // Add the card Image
                    var imageEl = document.createElement('a-image');
                    imageEl.setAttribute('src', props.cardService.cardBack);
                    imageEl.setAttribute('id', 'card');
                    imageEl.setAttribute('data-state', 'back');

                    imageEl.object3D.scale.set(6.4 / 4, 8.9 / 4, 1);
                    imageEl.object3D.position.set(0, 0, 0);
                    imageEl.object3D.rotation.set(Math.PI / 2, 0, 0);
                    markerEl.appendChild(imageEl);
                }
                handZone = new Zone(
                    './markers/ZoneMarker1.patt',
                    './markers/ZoneMarker2.patt',
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
                    const markerId = marker.id;
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
                            showFaceOfCard(foundMarker);
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
                marker.addEventListener('markerFound', () => {
                    var markerId = marker.id;
                    addFoundMarker(marker);
                    tryDrawingHandzone(foundZoneMarkers);
                    console.log('Zone Marker Found: ', markerId, 'at ', marker.object3D.position);
                });

                marker.addEventListener('markerLost', () => {
                    const markerId = marker.id;
                    const isZoneMarker =
                        markerId === handZone.getMarker1Id() ||
                        markerId === handZone.getMarker2Id();
                    //add for loop here with zoneArray if we have multiple
                    if (isZoneMarker) {
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

function tryDrawingHandzone() {
    let zoneMarkers = [handzone.getZoneMarker1(), handZone.getZoneMarker2()];
    let isPresent = (id) => isMarkerIdFound(id, foundZoneMarkers);
    if (zoneMarkers.reduce((acc, id) => acc && isPresent(id), true)) {
        handZone.drawZone();
    }
}

function isCardBack(marker) {
    return marker?.querySelector('#card')?.getAttribute('src') === props.cardService.cardBack;
}

function turnCard(marker) {
    const cardState = imageEl.getAttribute('data-state');
    if (cardState === 'front') {
        const imageEl = marker.querySelector('#card');
        imageEl.setAttribute('data-state', 'back');
        imageEl.setAttribute('src', props.cardService.cardBack);
    } else {
        showFaceOfCard(marker);
    }
}

function showFaceOfCard(marker) {
    const cardState = imageEl.getAttribute('data-state');
    if (cardState !== 'front') {
        const imageEl = marker.querySelector('#card');
        imageEl.setAttribute('data-state', 'front');
        let id = marker.getAttribute('id');
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

    console.log('finished umount');
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
            <a-entity id="userCamera" camera> </a-entity>
        </a-scene>
    </div>
</template>
