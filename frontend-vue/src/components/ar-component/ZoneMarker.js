import { InfinityMarker } from './InfinityMarker';
import { Zone } from './Zone';

export class ZoneMarker extends InfinityMarker {
    constructor(sceneEl, zoneMarkerUrl, id, zone) {
        super(sceneEl, zoneMarkerUrl, id);
        this.markerElement.setAttribute('registerevents_zone', '');
        this.zone = zone;
        var idNumber = parseInt(id.match(/\d+/)[0]);
        this.textElement.setAttribute('text', {
            color: 'red',
            align: 'center',
            value: idNumber,
            width: '5.5'
        });
    }
}
