<script setup lang="js">
import '@ar-js-org/ar.js';
import { Zone } from './Zone';
import { CardService } from './CardService';
import { ConnectionService } from '@/services/ConnectionService';
import { ref } from 'vue';

const props = defineProps({
  cardService: {
    type: CardService
  },
  conService: {
	type: ConnectionService
  }
});
const connected = ref(false);

//Global Variable
var markersURLArray = [];
var markersNameArray = [];

var foundCardMarkers = [];
var foundZoneMarkers = [];
var handZone;

props.conService.onConnection(() => {
	AFRAME.registerComponent('markers_start', {
		init: function () {
			console.log(`Adding ${props.cardService.numberOfCards} markers to the scene...`);

			var sceneEl = document.querySelector('a-scene');
			//list of the markers
			for (var i = 0; i < props.cardService.numberOfCards+1; i++) {
				var url = "/markers/pattern-" + i + ".patt";
				markersURLArray.push(url);
				markersNameArray.push(i);
			}		
			for (var k = 0; k < props.cardService.numberOfCards+1; k++) {
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
				textEl.setAttribute('text', { color: 'red', align: 'center', value: markersNameArray[k], width: '5.5' });
				textEl.object3D.position.set(0, 0.7, 0);
				textEl.object3D.rotation.set(-90, 0, 0);

				markerEl.appendChild(textEl);

				// Add the card Image
				var ImageEl = document.createElement('a-image');
				ImageEl.setAttribute('src', props.cardService.cardBack);
				ImageEl.setAttribute('id', 'card');

				ImageEl.object3D.position.set(0, 0.0, 0);
				ImageEl.object3D.rotation.set(-90, 0, 0);
				markerEl.appendChild(ImageEl);
			}
			handZone = new Zone("/markers/ZoneMarker1.patt", "/markers/ZoneMarker2.patt", sceneEl, "hand", foundZoneMarkers);
		}
	});

	//Detect marker found and lost
	AFRAME.registerComponent('registerevents', {
		init: function () {
			const marker = this.el;

			marker.addEventListener("markerFound", () => {
				var markerId = marker.id;
				addFoundMarker(marker, foundCardMarkers)
				if (handZone.markerInZone(marker)) {
					turnCard(marker);
				}
				console.log('Marker Found: ', markerId, 'at ', marker.object3D.position);
			});

			marker.addEventListener("markerLost", () => {
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
			};
			checkMarkerInZone();
		},

	});

	AFRAME.registerComponent('registerevents_zone', {
		init: function () {
			const marker = this.el;
			var lastPosition1;
			var lastPosition2;
			marker.addEventListener("markerFound", () => {

				var markerId = marker.id;
				var image = marker.querySelector('#text');
				var position = marker.object3D.position;

				addFoundMarker(marker, foundZoneMarkers)
				//add for loop here with zoneArray if we have multiple
				if (isMarkerIdFound(handZone.getMarker1Id(), foundZoneMarkers) && isMarkerIdFound(handZone.getMarker2Id(), foundZoneMarkers)) {
					lastPosition1 = handZone.getZoneMarker1().object3D.position.clone();
					lastPosition2 = handZone.getZoneMarker2().object3D.position.clone();
					handZone.drawZone();
				}

				console.log('Zone Marker Found: ', markerId, 'at ', marker.object3D.position);
			});

			marker.addEventListener("markerLost", () => {
				var markerId = marker.id;

				//add for loop here with zoneArray if we have multiple
				if (marker.id === handZone.getMarker1Id() || marker.id === handZone.getMarker2Id()) {
					handZone.removeZone();
				}

				removeFoundMarker(marker, foundZoneMarkers);
				console.log('Zone Marker Lost: ', markerId);
			});

			handZone.redrawZoneEnable();
		},
	});
	connected.value = true;
});


function isCardBack(marker) {
	if (!marker) return false;
	const imageEl = marker.querySelector('#card');
	if (!imageEl) return false;
	return imageEl.getAttribute('src') === props.cardService.cardBack;
}

function turnCard(marker) {
	const imageEl = marker.querySelector('#card');
	imageEl.setAttribute('src', props.cardService.cardBack);
}

function showCard(marker) {
	const imageEl = marker.querySelector('#card');
	let id = marker.getAttribute('id');
	props.cardService.getCardByMarker(id).then((card) => {
		imageEl.setAttribute('src', card.url);
	});
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
	return list.some(marker => marker.id === markerId);
}
</script>

<template>
	<div v-if="connected">
		<a-scene markers_start xr-mode-ui="enabled: false" color-space="sRGB" renderer="gammaOutput: true"
				arjs='debugUIEnabled: false; sourceType: webcam; patternRatio: 0.85; trackingMethod: best;'>
			<a-entity id='userCamera' camera>
				<!-- <a-cursor> </a-cursor> -->
			</a-entity>
		</a-scene>
	</div>
</template>