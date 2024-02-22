/**
 * Zonelogic
 */
function isMarkerIdFound(markerId, list) {
  return list.some((marker) => marker.id === markerId)
}

export class Zone {
  constructor(marker1Url, marker2Url, sceneEl, name, foundZoneMarkers) {
    this.scene = sceneEl
    this.name = name
    this.zoneEntity = null
    this.foundZoneMarkers = foundZoneMarkers

    this.#createZoneMarkers(marker1Url, marker2Url)
  }

  getName() {
    return this.name
  }

  getZoneMarker1() {
    return this.zoneMarker1
  }

  getZoneMarker2() {
    return this.zoneMarker1
  }

  getMarker1Id() {
    return this.zoneMarker1.getAttribute('id')
  }

  getMarker2Id() {
    return this.zoneMarker2.getAttribute('id')
  }

  #createZoneMarkers(marker1Url, marker2Url) {
    var markerEl = document.createElement('a-marker')
    markerEl.setAttribute('type', 'pattern')
    markerEl.setAttribute('url', marker1Url)
    markerEl.setAttribute('id', 'ZoneMarker_1_' + this.name)
    markerEl.setAttribute('registerevents_zone', '')

    this.scene.appendChild(markerEl)

    var textEl = document.createElement('a-entity')
    textEl.setAttribute('id', 'text')
    textEl.setAttribute('text', { color: 'red', align: 'center', value: '1', width: '5.5' })
    textEl.object3D.position.set(0, 0.0, 0)
    textEl.object3D.rotation.set(-90, 0, 0)
    markerEl.appendChild(textEl)

    var markerEl2 = document.createElement('a-marker')
    markerEl2.setAttribute('type', 'pattern')
    markerEl2.setAttribute('url', marker2Url)
    markerEl2.setAttribute('id', 'ZoneMarker_2_' + this.name)
    markerEl2.setAttribute('registerevents_zone', '')
    this.scene.appendChild(markerEl2)

    var textEl2 = document.createElement('a-entity')
    textEl2.setAttribute('id', 'text')
    textEl2.setAttribute('text', { color: 'red', align: 'center', value: '2', width: '5.5' })
    textEl2.object3D.position.set(0, 0.0, 0)
    textEl2.object3D.rotation.set(-90, 0, 0)
    markerEl2.appendChild(textEl2)

    this.zoneMarker1 = markerEl
    this.zoneMarker2 = markerEl2
  }

  drawZone() {
    if (this.zoneMarker1 && this.zoneMarker2) {
      const position1 = this.zoneMarker1.object3D.position.clone()
      const position2 = this.zoneMarker2.object3D.position.clone()

      // Get the marker widths TODO maybe calculate this
      const width1 = 1
      const width2 = 1
      const height1 = 3
      const height2 = 3

      // Adjust the positions based on the outer edges
      position1.x -= width1 / 2
      position1.z -= height1 / 2

      position2.x += width2 / 2
      position2.z += height2 / 2

      const width = Math.abs(position2.x - position1.x)
      const height = Math.abs(position2.z - position1.z)

      const midpoint = new THREE.Vector3().addVectors(position1, position2).multiplyScalar(0.5)

      var geometry = new THREE.PlaneGeometry(width, height)
      var material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      })

      this.zoneEntity = document.createElement('a-entity')
      this.zoneEntity.setAttribute('geometry', { primitive: 'plane', width: width, height: height })
      this.zoneEntity.setAttribute('material', {
        color: 0x00ff00,
        side: 'double',
        transparent: true,
        opacity: 0.5
      })

      // Set the position to the midpoint between markers
      this.zoneEntity.object3D.position.copy(midpoint)

      // Apply rotation to the zoneEntity
      const direction = new THREE.Vector3().subVectors(position2, position1)
      const angle = Math.atan2(direction.x, direction.z)
      this.zoneEntity.object3D.rotation.set(0, 0, 0) // Adjusted rotation

      this.zoneEntity.setAttribute('id', 'zoneRectangle_' + this.name)

      this.scene.appendChild(this.zoneEntity)
    }
  }

  removeZone() {
    if (this.zoneEntity) {
      this.zoneEntity.parentNode.removeChild(this.zoneEntity)
      this.zoneEntity = null
      console.log('Removed zone')
    }
  }

  getZone() {
    return this.zoneEntity
  }

  getZoneId() {
    return '#zoneRectangle_' + this.name
  }

  markerInZone(marker) {
    if (!marker) return false
    if (!this.zoneMarker1 || !this.zoneMarker2) return false

    const markerPosition = marker.object3D.position.clone()
    const zoneMarker1Position = this.zoneMarker1.object3D.position.clone()
    const zoneMarker2Position = this.zoneMarker2.object3D.position.clone()

    const minX = Math.min(zoneMarker1Position.x, zoneMarker2Position.x)
    const maxX = Math.max(zoneMarker1Position.x, zoneMarker2Position.x)
    const minZ = Math.min(zoneMarker1Position.z, zoneMarker2Position.z)
    const maxZ = Math.max(zoneMarker1Position.z, zoneMarker2Position.z)

    return (
      markerPosition.x >= minX &&
      markerPosition.x <= maxX &&
      markerPosition.z >= minZ &&
      markerPosition.z <= maxZ
    )
  }

  redrawZoneDisable() {
    this.moving = false
  }

  redrawZoneEnable() {
    this.moving = true
    this.#redrawZone()
  }

  #redrawZone() {
    if (this.moving) {
      if (
        isMarkerIdFound('ZoneMarker_1', this.foundZoneMarkers) &&
        isMarkerIdFound('ZoneMarker_2', this.foundZoneMarkers)
      ) {
        const marker1 = document.getElementById('ZoneMarker_1') // Get ZoneMarker_1
        const marker2 = document.getElementById('ZoneMarker_2') // Get ZoneMarker_1
        const currentPosition1 = marker1.object3D.position.clone()
        const currentPosition2 = marker2.object3D.position.clone()
        if (!lastPosition1.equals(currentPosition1) || !lastPosition2.equals(currentPosition2)) {
          lastPosition1.copy(currentPosition1) // Update the last position
          lastPosition2.copy(currentPosition2) // Update the last position
          removeZone()
          drawZone() // Redraw the zone whenever the position changes
        }
      }
      // Check periodically
      setTimeout(this.#redrawZone, 100) // Adjust the timing as needed
    }
  }
}
