//Multi Markers WebAR-AR.js and Aframe - Playing the Archive - Connected Environment CASA-UCL

//Global Variable
var markersURLArray=[];
var markersNameArray=[];

var foundCardMarkers  =  [];
var foundZoneMarkers = [];

AFRAME.registerComponent('markers_start',{
	init:function(){
		console.log('Add markers to the scene');

		var sceneEl = document.querySelector('a-scene');
		
		//list of the markers
		for(var i=1; i<17; i++)
		{
			var url="resources/markers/pattern-Individual_Blocks-"+i+".patt";
			markersURLArray.push(url);
			markersNameArray.push('Marker_'+i);
			//console.log(url);
		}

		for(var k=0; k<16; k++)
		{
			var markerEl = document.createElement('a-marker');
			markerEl.setAttribute('type','pattern');
			markerEl.setAttribute('url',markersURLArray[k]);
			markerEl.setAttribute('id',markersNameArray[k]);

			markerEl.setAttribute('registerevents','');
			sceneEl.appendChild(markerEl);

			//Adding text to each marker
			var textEl = document.createElement('a-entity');
			
			textEl.setAttribute('id','text');
			textEl.setAttribute('text',{color: 'red', align: 'center', value:markersNameArray[k], width: '5.5'});
			textEl.object3D.position.set(0, 0.7, 0);
			textEl.object3D.rotation.set(-90, 0, 0);

			markerEl.appendChild(textEl);
		}
		createZoneMarkers(sceneEl);
	}
});

function createZoneMarkers(scene){
	var markerEl = document.createElement('a-marker');
	markerEl.setAttribute('type','pattern');
	markerEl.setAttribute('url',"resources/markers/ZoneMarker1.patt");
	markerEl.setAttribute('id',"ZoneMarker_1");
	markerEl.setAttribute('registerevents_zone','');

	scene.appendChild(markerEl);

	var textEl = document.createElement('a-entity');	
	textEl.setAttribute('id','text');
	textEl.setAttribute('text',{color: 'red', align: 'center', value:"1", width: '5.5'});
	textEl.object3D.position.set(0, 0.0, 0);
	textEl.object3D.rotation.set(-90, 0, 0);
	markerEl.appendChild(textEl);


	var markerEl2 = document.createElement('a-marker');
	markerEl2.setAttribute('type','pattern');
	markerEl2.setAttribute('url',"resources/markers/ZoneMarker2.patt");
	markerEl2.setAttribute('id',"ZoneMarker_2");
	markerEl2.setAttribute('registerevents_zone','');
	scene.appendChild(markerEl2);

	var textEl2 = document.createElement('a-entity');
	textEl2.setAttribute('id','text');
	textEl2.setAttribute('text',{color: 'red', align: 'center', value:"2", width: '5.5'});
	textEl2.object3D.position.set(0, 0.0, 0);
	textEl2.object3D.rotation.set(-90, 0, 0);
	markerEl2.appendChild(textEl2);
}


//Detect marker found and lost
AFRAME.registerComponent('registerevents', {
		init: function () {
			const marker = this.el;

			marker.addEventListener("markerFound", ()=> {
				
				var markerId = marker.id;
				var image = marker.querySelector('#text');
				var position = marker.object3D.position;

				addFoundMarker(marker, foundCardMarkers)

				
				if (position.x < 0 && image) {
					//this attribute can be replaced by a cardback
    				image.setAttribute('text', { color: 'green', align: 'center', value: marker.id, width: '5.5' });
				} else {
					image.setAttribute('text', { color: 'red', align: 'center', value: marker.id, width: '5.5' });
				}
				console.log('Marker Found: ', markerId, 'at ', marker.object3D.position);
			});

			marker.addEventListener("markerLost",() =>{
				var markerId = marker.id;
				removeFoundMarker(marker, foundCardMarkers);
				console.log('Marker Lost: ', markerId);
			});
		},
	});

AFRAME.registerComponent('registerevents_zone', {
	init: function () {
		const marker = this.el;
		var lastPosition1; 
		var lastPosition2; 
		marker.addEventListener("markerFound", ()=> {
			
			var markerId = marker.id;
			var image = marker.querySelector('#text');
			var position = marker.object3D.position;

			addFoundMarker(marker, foundZoneMarkers)

			if(isMarkerIdFound("ZoneMarker_1", foundZoneMarkers) && isMarkerIdFound("ZoneMarker_2", foundZoneMarkers)){
				lastPosition1 = document.getElementById('ZoneMarker_1').object3D.position.clone();
				lastPosition2 = document.getElementById('ZoneMarker_2').object3D.position.clone();
				drawZone();
			}
		
			console.log('Zone Marker Found: ', markerId, 'at ', marker.object3D.position);
		});

		marker.addEventListener("markerLost",() =>{
			var markerId = marker.id;

			if (marker.id === 'ZoneMarker_1' || marker.id === 'ZoneMarker_2') {
				removeZone();
			}	

			removeFoundMarker(marker, foundZoneMarkers);
			console.log('Zone Marker Lost: ', markerId);
		});

		function checkMarkerPosition() {	
			if (isMarkerIdFound("ZoneMarker_1", foundZoneMarkers) && isMarkerIdFound("ZoneMarker_2", foundZoneMarkers)) {
				const marker1 = document.getElementById('ZoneMarker_1'); // Get ZoneMarker_1
				const marker2 = document.getElementById('ZoneMarker_2'); // Get ZoneMarker_1
				const currentPosition1 = marker1.object3D.position.clone();
				const currentPosition2 = marker2.object3D.position.clone();

				if (!lastPosition1.equals(currentPosition1) || !lastPosition2.equals(currentPosition2) ) {
					lastPosition1.copy(currentPosition1); // Update the last position
					lastPosition2.copy(currentPosition2); // Update the last position
					removeZone();
					drawZone(); // Redraw the zone whenever the position changes
				} 

			}
			// Check periodically
			setTimeout(checkMarkerPosition, 100); // Adjust the timing as needed
		};
		checkMarkerPosition();


	},
});


function drawZone() {
    var sceneEl = document.querySelector('a-scene');
    var marker1 = document.getElementById('ZoneMarker_1');
    var marker2 = document.getElementById('ZoneMarker_2');

    if (marker1 && marker2) {
        var width = Math.abs(marker1.object3D.position.x - marker2.object3D.position.x);
        var height = Math.abs(marker1.object3D.position.z - marker2.object3D.position.z);

        var geometry = new THREE.PlaneGeometry(width, height);
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

        var zoneEntity = document.createElement('a-entity');
        zoneEntity.setAttribute('geometry', { primitive: 'plane', width: width, height: height });
        zoneEntity.setAttribute('material', { color: 0x00ff00, side: 'double', transparent: true, opacity: 0.5 });

        // Set the position to the midpoint between markers
        var midpoint = new THREE.Vector3();
        midpoint.addVectors(marker1.object3D.position, marker2.object3D.position);
        midpoint.divideScalar(2);
        zoneEntity.object3D.position.copy(midpoint);

        // Apply rotation to the zoneEntity
        var direction = new THREE.Vector3().subVectors(marker2.object3D.position, marker1.object3D.position);
        var angle = Math.atan2(direction.x, direction.z);
        zoneEntity.object3D.rotation.set(0, 0, 0);

        zoneEntity.setAttribute('id', 'zoneRectangle'); // Set an ID for easy access

        sceneEl.appendChild(zoneEntity); // Append the zoneEntity to the scene
    }
}

function removeZone() {
    var sceneEl = document.querySelector('a-scene');
    var existingZone = sceneEl.querySelector('#zoneRectangle'); // Find the plane by ID

    if (existingZone) {
        existingZone.parentNode.removeChild(existingZone);
        console.log('Removed zone');
    }
}





function markerInZone(){

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

function isMarkerIdFound(markerId, list){
	return list.some(marker => marker.id === markerId);
}