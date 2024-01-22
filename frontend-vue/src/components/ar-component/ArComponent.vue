<script setup lang="js">
import '@ar-js-org/ar.js';


//Multi Markers WebAR-AR.js and Aframe - Playing the Archive - Connected Environment CASA-UCL

//Global Variable
var markersURLArray = [];
var markersNameArray = [];

var foundCardMarkers = [];
var foundZoneMarkers = [];
var handZone;

AFRAME.registerComponent('markers_start', {
	init: function () {
		console.log('Add markers to the scene');

		var sceneEl = document.querySelector('a-scene');
		var numberOfCards = 45
		//list of the markers
		for (var i = 0; i < numberOfCards+1; i++) {
			var url = "/markers/pattern-" + i + ".patt";
			markersURLArray.push(url);
			markersNameArray.push(i);
			//console.log(url);
		}		
		for (var k = 0; k < numberOfCards+1; k++) {
			var markerEl = document.createElement('a-marker');
			markerEl.setAttribute('type', 'pattern');
			markerEl.setAttribute('url', markersURLArray[k]);
			markerEl.setAttribute('id', markersNameArray[k]);


			markerEl.setAttribute('registerevents', '');
			sceneEl.appendChild(markerEl);
			markerEl.style.zIndex = '1'; // Adjust the value as needed

			//Adding text to each marker
			var textEl = document.createElement('a-entity');

			textEl.setAttribute('id', 'text');
			textEl.setAttribute('text', { color: 'red', align: 'center', value: markersNameArray[k], width: '5.5' });
			textEl.object3D.position.set(0, 0.7, 0);
			textEl.object3D.rotation.set(-90, 0, 0);

			markerEl.appendChild(textEl);

			var ImageEl = document.createElement('a-image');
			var imageUrl = "/cardImages/cardFront" + k + ".svg";
			ImageEl.setAttribute('src', 'url('+ imageUrl +')');
			ImageEl.setAttribute('id', 'card');

			ImageEl.object3D.position.set(0, 0.0, 0);
			ImageEl.object3D.rotation.set(-90, 0, 0);
			markerEl.appendChild(ImageEl);


		}
		handZone = new Zone("/markers/ZoneMarker1.patt", "/markers/ZoneMarker2.patt", sceneEl, "hand");
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

function isCardBack(marker) {
	if (!marker) return false;
	const imageEl = marker.querySelector('#card');
	if (!imageEl) return false;
	return imageEl.getAttribute('src') === 'url(/cardImages/cardBackBlue.svg)';
}



function turnCard(marker) {
	const imageEl = marker.querySelector('#card');
	imageEl.setAttribute('src', 'url(/cardImages/cardBackBlue.svg)');
}

function showCard(marker) {
	const imageEl = marker.querySelector('#card');
	let id = marker.getAttribute('id')
	imageEl.setAttribute('src', 'url(/cardImages/cardFront' + id + '.svg)');
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




class Zone {
	constructor(marker1Url, marker2Url, sceneEl, name) {
		this.scene = sceneEl;
		this.name = name;
		this.zoneEntity = null;

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
		return this.zoneMarker1.getAttribute('id');
	}

	getMarker2Id() {
		return this.zoneMarker2.getAttribute('id');
	}

	#createZoneMarkers(marker1Url, marker2Url) {
		var markerEl = document.createElement('a-marker');
		markerEl.setAttribute('type', 'pattern');
		markerEl.setAttribute('url', marker1Url);
		markerEl.setAttribute('id', "ZoneMarker_1_" + this.name);
		markerEl.setAttribute('registerevents_zone', '');

		this.scene.appendChild(markerEl);

		var textEl = document.createElement('a-entity');
		textEl.setAttribute('id', 'text');
		textEl.setAttribute('text', { color: 'red', align: 'center', value: "1", width: '5.5' });
		textEl.object3D.position.set(0, 0.0, 0);
		textEl.object3D.rotation.set(-90, 0, 0);
		markerEl.appendChild(textEl);


		var markerEl2 = document.createElement('a-marker');
		markerEl2.setAttribute('type', 'pattern');
		markerEl2.setAttribute('url', marker2Url);
		markerEl2.setAttribute('id', "ZoneMarker_2_" + this.name);
		markerEl2.setAttribute('registerevents_zone', '');
		this.scene.appendChild(markerEl2);

		var textEl2 = document.createElement('a-entity');
		textEl2.setAttribute('id', 'text');
		textEl2.setAttribute('text', { color: 'red', align: 'center', value: "2", width: '5.5' });
		textEl2.object3D.position.set(0, 0.0, 0);
		textEl2.object3D.rotation.set(-90, 0, 0);
		markerEl2.appendChild(textEl2);

		this.zoneMarker1 = markerEl;
		this.zoneMarker2 = markerEl2;
	}

	drawZone() {
		if (this.zoneMarker1 && this.zoneMarker2) {
			var width = Math.abs(this.zoneMarker1.object3D.position.x - this.zoneMarker2.object3D.position.x);
			var height = Math.abs(this.zoneMarker1.object3D.position.z - this.zoneMarker2.object3D.position.z);

			var geometry = new THREE.PlaneGeometry(width, height);
			var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

			this.zoneEntity = document.createElement('a-entity');
			this.zoneEntity.setAttribute('geometry', { primitive: 'plane', width: width, height: height });
			this.zoneEntity.setAttribute('material', { color: 0x00ff00, side: 'double', transparent: true, opacity: 0.5 });

			// Set the position to the midpoint between markers
			var midpoint = new THREE.Vector3();
			midpoint.addVectors(this.zoneMarker1.object3D.position, this.zoneMarker2.object3D.position);
			midpoint.divideScalar(2);
			this.zoneEntity.object3D.position.copy(midpoint);

			// Apply rotation to the zoneEntity
			var direction = new THREE.Vector3().subVectors(this.zoneMarker2.object3D.position, this.zoneMarker1.object3D.position);
			var angle = Math.atan2(direction.x, direction.z);
			this.zoneEntity.object3D.rotation.set(0, 0, 0);

			this.zoneEntity.setAttribute('id', 'zoneRectangle_' + this.name);

			this.scene.appendChild(this.zoneEntity);
		}
	}

	removeZone() {
		if (this.zoneEntity) {
			this.zoneEntity.parentNode.removeChild(this.zoneEntity);
			this.zoneEntity = null;
			console.log('Removed zone');
		}
	}

	getZone() {
		return this.zoneEntity;
	}

	getZoneId() {
		return '#zoneRectangle_' + this.name;
	}

	markerInZone(marker) {
		if (!marker) return false;
		if (!this.zoneMarker1 || !this.zoneMarker2) return false;

		const markerPosition = marker.object3D.position.clone();
		const zoneMarker1Position = this.zoneMarker1.object3D.position.clone();
		const zoneMarker2Position = this.zoneMarker2.object3D.position.clone();

		const minX = Math.min(zoneMarker1Position.x, zoneMarker2Position.x);
		const maxX = Math.max(zoneMarker1Position.x, zoneMarker2Position.x);
		const minZ = Math.min(zoneMarker1Position.z, zoneMarker2Position.z);
		const maxZ = Math.max(zoneMarker1Position.z, zoneMarker2Position.z);

		return (
			markerPosition.x >= minX &&
			markerPosition.x <= maxX &&
			markerPosition.z >= minZ &&
			markerPosition.z <= maxZ
		);
	}

	redrawZoneDisable() {
		this.moving = false;
	}

	redrawZoneEnable() {
		this.moving = true;
		this.#redrawZone()
	}

	#redrawZone() {
		if (this.moving) {
			if (isMarkerIdFound("ZoneMarker_1", foundZoneMarkers) && isMarkerIdFound("ZoneMarker_2", foundZoneMarkers)) {
				const marker1 = document.getElementById('ZoneMarker_1'); // Get ZoneMarker_1
				const marker2 = document.getElementById('ZoneMarker_2'); // Get ZoneMarker_1
				const currentPosition1 = marker1.object3D.position.clone();
				const currentPosition2 = marker2.object3D.position.clone();
				if (!lastPosition1.equals(currentPosition1) || !lastPosition2.equals(currentPosition2)) {
					lastPosition1.copy(currentPosition1); // Update the last position
					lastPosition2.copy(currentPosition2); // Update the last position
					removeZone();
					drawZone(); // Redraw the zone whenever the position changes
				}

			}
			// Check periodically
			setTimeout(this.#redrawZone, 100); // Adjust the timing as needed
		}
	}
}
</script>

<template>
    <a-scene markers_start xr-mode-ui="enabled: false" color-space="sRGB" renderer="gammaOutput: true"
            arjs='debugUIEnabled: false; sourceType: webcam; patternRatio: 0.85; trackingMethod: best;'>
        <a-entity id='userCamera' camera>
            <!-- <a-cursor> </a-cursor> -->
        </a-entity>
    </a-scene>
</template>