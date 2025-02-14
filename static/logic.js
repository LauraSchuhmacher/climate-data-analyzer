/* logic.js */
console.log("Skript geladen")

const startYear = 1850;
const endYear = new Date().getFullYear();
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');

for (let year = startYear; year <= endYear; year++) {
    // Option für das Startjahr erstellen
    let startOption = document.createElement('option');
    startOption.value = year;
    startOption.textContent = year;
    startYearSelect.appendChild(startOption);

    // Option für das Endjahr erstellen
    let endOption = document.createElement('option');
    endOption.value = year;
    endOption.textContent = year;
    endYearSelect.appendChild(endOption);
}

// Optional: Aktuelles Jahr als Standardwert für Endjahr
endYearSelect.value = new Date().getFullYear();


var map;
let marker;

function toggleMap() {
    let displayType = document.getElementById('displayType').value;
    let mapDiv = document.getElementById('map');
    let lat = parseFloat(document.getElementById('latitude').value);
    let lon = parseFloat(document.getElementById('longitude').value);
    
    if (displayType === 'graphic') {
        mapDiv.style.display = 'block';
        console.log("ToggleMap wurde geladen")

        if (!map) {
            let initialLat = isNaN(lat) ? 51.1657 : lat; // Standard: Deutschland
            let initialLon = isNaN(lon) ? 10.4515 : lon;
            
            map = L.map('map').setView([initialLat, initialLon], 5); //L refers to the Leaflet library
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            console.log("Karte erstellt")

            map.on('click', function(e) {
                document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
                document.getElementById('longitude').value = e.latlng.lng.toFixed(6);

                if (marker) {
                    map.removeLayer(marker);
                }
                marker = L.marker(e.latlng).addTo(map).bindPopup("Ausgewählter Standort").openPopup();
            });
        } else {
            let newLat = isNaN(lat) ? 51.1657 : lat;
            let newLon = isNaN(lon) ? 10.4515 : lon;
            map.setView([newLat, newLon], 5);
        }
        
        if (!isNaN(lat) && !isNaN(lon)) {
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([lat, lon]).addTo(map).bindPopup("Ausgewählter Standort").openPopup();
        }
    } else {
        mapDiv.style.display = 'none';
    }
}