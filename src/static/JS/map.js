// map.js
// ======================================================
// Dieses Modul kapselt alle Funktionen, die mit der Leaflet-Karte zusammenhängen:
// - Initialisierung der Karte, User-Marker und Radius-Kreis
// - Erzeugung von Stations-Markern
// - Hervorheben eines ausgewählten Markers
// - Aktualisierung des Benutzerstandorts
// ======================================================

/**
 * Initialisiert die Leaflet-Karte, fügt einen Standard-Kachel-Layer, 
 * einen User-Marker sowie einen Radius-Kreis hinzu und registriert ein Klick-Event.
 * @returns {Object} Enthält die Karte (map), den User-Marker (userMarker) und den Radius-Kreis (radiusCircle).
 */
export const initializeMap = () => {
    const initialLat = 52.5162;
    const initialLon = 13.3777;
    const initialZoom = 5;
    const initialRadius = 80;
    const map = L.map('map').setView([initialLat, initialLon], initialZoom);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  
    const userMarker = L.marker([initialLat, initialLon]).addTo(map);
    const radiusCircle = L.circle([initialLat, initialLon], {
      radius: initialRadius * 1000,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.2
    }).addTo(map);
  
    // Klick-Event: Zeigt ein Popup mit den Koordinaten an.
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(
          `<b>Koordinaten:</b><br>Latitude: ${lat.toFixed(4)}<br>Longitude: ${lng.toFixed(4)}`
        )
        .openOn(map);
    });
  
    return { map, userMarker, radiusCircle };
  };
  
  /**
   * Erzeugt einen Marker für eine Station.
   * @param {Object} map - Die Leaflet-Karte.
   * @param {Object} station - Das Station-Objekt mit latitude, longitude, name, etc.
   * @param {string} iconPath - Pfad zum Icon (z.B. für einen normalen Marker).
   * @returns {L.Marker} Der erstellte Marker.
   */
  export const createStationMarker = (map, station, iconPath) => {
    const icon = L.icon({
      iconUrl: iconPath,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const marker = L.marker([station.latitude, station.longitude], { icon }).addTo(map);
    marker.bindPopup(`
      <b>${station.name}</b><br>
      Latitude: ${station.latitude}<br>
      Longitude: ${station.longitude}<br>
      Mindate: ${station.mindate}<br>
      Maxdate: ${station.maxdate}
    `);
    return marker;
  };
  
  /**
   * Hebt einen ausgewählten Marker hervor, indem er ein anderes Icon setzt
   * und die Karte auf diesen Marker zentriert.
   * @param {Object} map - Die Leaflet-Karte.
   * @param {L.Marker} marker - Der Marker, der hervorgehoben werden soll.
   * @param {string} normalIconPath - Pfad zum normalen Icon.
   * @param {string} selectedIconPath - Pfad zum hervorgehobenen Icon.
   */
  export const highlightMarker = (map, marker, normalIconPath, selectedIconPath) => {
    // Setze den Marker zuerst auf den normalen Icon, falls er zuvor ausgewählt war.
    marker.setIcon(
      L.icon({
        iconUrl: normalIconPath,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    );
    // Setze den Marker dann auf den "selected" Icon.
    marker.setIcon(
      L.icon({
        iconUrl: selectedIconPath,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -30]
      })
    );
    map.setView(marker.getLatLng(), 9);
  };
  
  /**
   * Aktualisiert den Benutzerstandort (Marker und Radius-Kreis) auf der Karte.
   * Entfernt die alten Objekte und fügt neue hinzu.
   * @param {Object} map - Die Leaflet-Karte.
   * @param {number} lat - Breitengrad.
   * @param {number} lon - Längengrad.
   * @param {L.Marker} oldUserMarker - Der aktuelle User-Marker (wird entfernt).
   * @param {L.Circle} oldRadiusCircle - Der aktuelle Radius-Kreis (wird entfernt).
   * @param {number} radius - Radius in Kilometern.
   * @returns {Object} Enthält den neuen User-Marker und den neuen Radius-Kreis.
   */
  export const updateUserPosition = (map, lat, lon, oldUserMarker, oldRadiusCircle, radius) => {
    if (oldUserMarker) {
      map.removeLayer(oldUserMarker);
    }
    if (oldRadiusCircle) {
      map.removeLayer(oldRadiusCircle);
    }
    const newUserMarker = L.marker([lat, lon]).addTo(map);
    const newRadiusCircle = L.circle([lat, lon], {
      radius: radius * 1000,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.2
    }).addTo(map);
    return { userMarker: newUserMarker, radiusCircle: newRadiusCircle };
  };
  