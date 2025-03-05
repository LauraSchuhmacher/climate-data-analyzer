// Variablen initialisieren
let startYear = 1763, endYear = 2024;
const [startYearSelect, endYearSelect] = [document.getElementById('startYear'), document.getElementById('endYear')];
[startYearSelect.value, endYearSelect.value] = [startYear, endYear];

let selectedStationId = null, chartInstance = null, map, userMarker, radiusCircle;
let stationCircles = [], selectedMarker = null, stationMarkers = [];
let lat = null, lon = null;
const searchButton = document.getElementById('searchButton'), 
      evaluateButton = document.getElementById('evaluateButton'),
      chartContainer = document.getElementById('chart-container'),
      tableDataContainer = document.getElementById('table-data');
      stationsContainer = document.getElementById('search-results');

// Setup
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ist geladen");
    initializeMap();
    populateYearOptions();
    setupEventListeners();
    setupInputLimits();
});

// Initialisiere Map
function initializeMap(){
    console.log("Initialisiere Karte");
    const initialLat = 52.5162; 
    const initialLon = 13.3777;
    const initialZoom = 5;

    map = L.map('map').setView([initialLat, initialLon], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialer Marker
    userMarker = L.marker([initialLat, initialLon]).addTo(map);
    radiusCircle = L.circle([initialLat, initialLon], { radius: 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);

    // Klick-Event für Koordinaten-Popup
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        L.popup()
            .setLatLng(e.latlng)
            .setContent(`<b>Koordinaten:</b><br>Latitude: ${lat.toFixed(4)}<br>Longitude: ${lng.toFixed(4)}`)
            .openOn(map);
    });
}

// Jahr-Optionen füllen
function populateYearOptions() {
    console.log("Befülle Zeitraum-Optionen");
    [startYearSelect, endYearSelect].forEach(select => {
        select.innerHTML = '';
        for (let year = startYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    });
    endYearSelect.value = 2024;
}

// Event-Listener Setup
function setupEventListeners() {
    console.log("Setup Event-Listeners");
    startYearSelect.addEventListener('change', handleStartYearChange);
    endYearSelect.addEventListener('change', handleEndYearChange);
    searchButton.addEventListener('click', searchStations);
    evaluateButton.addEventListener('click', evaluateStation);
    document.addEventListener('keydown', preventInputValues);
}

// leere Pflichtfelder unterbinden
function validateRequiredFields() {
    const requiredFields = [document.getElementById('longitude'), document.getElementById('latitude'), document.getElementById('radius'), document.getElementById('limit')];
    let isValid = true;

    requiredFields.forEach(field => {
        if (field.value.trim() === '') {
            field.classList.add('input-error');
            isValid = false;
        } else {
            field.classList.remove('input-error');
        }
    });

    if (!isValid) {
        alert("Bitte füllen Sie alle Pflichtfelder aus!");
    }

    return isValid;
}

// Whitelisting für Eingaben
function preventInputValues(e) {
    const numberRegex = /^[0-9]$/;
    const floatRegex = /^[0-9.,-]$/;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];

    // Für Limit & Radius nur ganze Zahlen erlauben
    if ((e.target.id === 'limit' || e.target.id === 'radius') && 
        !numberRegex.test(e.key) && 
        !allowedKeys.includes(e.key)) {
        e.preventDefault();
    }

    // Für Längen- & Breitengrad Float-Werte erlauben
    if ((e.target.id === 'longitude' || e.target.id === 'latitude') && 
        !floatRegex.test(e.key) && 
        !allowedKeys.includes(e.key)) {
        e.preventDefault();
    }

    // Verbiete e, E, "+", "'", '"' für alle Eingaben
    if (['e', 'E', '+', "'", '"'].includes(e.key)) {
        e.preventDefault();
    }
}


// Input-Limit für Anzahl Stationen & Suchradius
function setupInputLimits() {
    longitude.addEventListener('input', () => {
        if (parseInt(longitude.value) > 180) {
            longitude.value = 180;
        } 
        if (parseInt(longitude.value) < -180) {
            longitude.value = -180;
        }
    });

    latitude.addEventListener('input', () => {
        if (parseInt(latitude.value) > 90) {
            latitude.value = 90;
        } 
        if (parseInt(latitude.value) < -90) {
            latitude.value = -90;
        }
    });

    limit.addEventListener('input', () => {
        if (parseInt(limit.value) > 10) {
            limit.value = 10;
        } 
        if (parseInt(limit.value) < 1) {
            limit.value = 1;
        }
    });

    radius.addEventListener('input', () => {
        if (parseInt(radius.value) > 100) {
            radius.value = 100;
        } 
        if (parseInt(radius.value) < 1) {
            radius.value = 1;
        }
    });
}


// Startjahr Auswahl 
function handleStartYearChange() {
    const selectedStartYear = parseInt(startYearSelect.value);
    updateYearOptions(selectedStartYear, endYearSelect, 'end');
}

// Endjahr Auswahl
function handleEndYearChange() {
    const selectedEndYear = parseInt(endYearSelect.value);
    updateYearOptions(selectedEndYear, startYearSelect, 'start');
}

// Jahr-Optionen aktualisieren
function updateYearOptions(year, select, type) {
    for (let option of select.options) {
        const optionYear = parseInt(option.value);
        option.disabled = (type === 'start' && optionYear > year) || (type === 'end' && optionYear < year);
    }
}

// Stationen suchen
async function searchStations() {
    console.log("Stationen suchen");
    selectedStationId = null;
    lat = parseFloat(latitude.value).toFixed(4);
    lon = parseFloat(longitude.value).toFixed(4);
    startYear = parseInt(startYearSelect.value);
    endYear = parseInt(endYearSelect.value);
    const radius = parseInt(document.getElementById('radius').value);
    const limit = parseInt(document.getElementById('limit').value);

    clear('all');
    if (!validateRequiredFields()) {
        return; // Stoppt die Funktion, wenn Pflichtfelder leer sind
    }

    // Benutzer-Location aktualisieren
    map.setView([lat, lon], 8);
    userMarker = L.marker([lat, lon]).addTo(map);
    radiusCircle = L.circle([lat, lon], { radius: radius * 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);

    try {
        console.log(`API URL: /stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`);
        const response = await fetch(`/stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`);
        const stations = await response.json();

        displayStations(stations);
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
    }
}

function displayStations(stations) {
    console.log("Stationen anzeigen");
    if (stations.length === 0) {
        alert("Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!");
    }
    let tableHtml = `<table><thead><tr><th>ID</th><th>Name</th><th>Breite</th><th>Länge</th><th>Mindate</th><th>Maxdate</th></tr></thead><tbody>`;
    
    stations.forEach(station => {
        // Erstellen der Tabellenzeile
        tableHtml += `<tr class="station-row" data-id="${station.id}">
            <td>${station.id}</td>
            <td>${station.name}</td>
            <td>${station.latitude}</td>
            <td>${station.longitude}</td>
            <td>${station.mindate}</td>
            <td>${station.maxdate}</td>
        </tr>`;

        // Erstellen des Markers
        const stationIcon = L.icon({
            iconUrl: 'static/icons/station-icon.svg',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const stationMarker = L.marker([station.latitude, station.longitude], {
            icon: stationIcon
        }).addTo(map);

        // Füge Popup hinzu
        stationMarker.bindPopup(`
            <b>${station.name}</b><br>
            Latitude: ${station.latitude}<br>
            Longitude: ${station.longitude}<br>
            Mindate: ${station.mindate}<br>
            Maxdate: ${station.maxdate}
        `);

        // Füge Marker zur stationMarkers Liste hinzu
        stationMarkers.push({ stationId: station.id, marker: stationMarker });
    });

    tableHtml += `</tbody></table>`;
    stationsContainer.innerHTML = tableHtml;
    stationsContainer.style.display = 'block';

    // Event Listener für Zeilen
    document.querySelectorAll('.station-row').forEach(row => {
        row.addEventListener('click', () => {
            clear('data');
            highlightselectedStationAndMarker(row.getAttribute('data-id'));
        });
    });
}

// Löscht bestehendes Diagramm, Tabelle, Stationsliste & Markierungen auf der Karte - sofern gewünscht
function clear(mode = 'all') {
    console.log(`Lösche bestehende Daten mit Modus: ${mode}`);

    if (mode === 'all') {
        if (stationsContainer) {
            stationsContainer.innerHTML = '';
            stationsContainer.style.display = 'none';
        }
        if (userMarker) map.removeLayer(userMarker);
        if (radiusCircle) map.removeLayer(radiusCircle);

        stationMarkers.forEach(station => {
            map.removeLayer(station.marker);
        });
        stationMarkers = [];
    }

    if (mode === 'all' || mode === 'data') {
        map.closePopup();
        if (chartContainer) {
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            chartContainer.style.display = 'none';
        }

        if (tableDataContainer) {
            tableDataContainer.innerHTML = '';
            tableDataContainer.style.display = 'none';
        }
    }
}


function highlightselectedStationAndMarker(stationId){
    // geklickte Station in Tabelle hervorheben
    document.querySelectorAll('.station-row').forEach(row => row.classList.remove('selected'));
    const row = document.querySelector(`.station-row[data-id="${stationId}"]`);
    row.classList.add('selected');
    selectedStationId = stationId;
    console.log(`selectedStationId: ${selectedStationId}`);

    // bereits hervorgehobene Station zurücksetzen
    if (selectedMarker) {
        selectedMarker.setIcon(L.icon({
            iconUrl: 'static/icons/station-icon.svg',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
    }

    // neu ausgewählte Station hervorheben
    const selectedStation = stationMarkers.find(item => item.stationId === selectedStationId);
    if (selectedStation) {
        selectedMarker = selectedStation.marker;
        selectedMarker.setIcon(L.icon({
            iconUrl: 'static/icons/selected-icon.svg',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -30]
        }));
        map.setView(selectedMarker.getLatLng(), 9);
    }
}

// Stationen auswerten (Tabelle und Grafik anzeigen)
async function evaluateStation() {
    console.log("Station auswerten");

    if (!selectedStationId) {
        alert("Bitte zuerst eine Station auswählen!");
        return;
    }

    startYear = startYearSelect.value;
    endYear = endYearSelect.value;
    const displayType = document.getElementById('displayType').value;

    try {
        console.log(`API URL: /station-data/${selectedStationId}/${startYear}/${endYear}`);
        const response = await fetch(`/station-data/${selectedStationId}/${startYear}/${endYear}`);
        let data = await response.json();

        if (data && data.length > 0) {
            // Wenn Station in Südhalbkugel, tausche die Jahreszeiten
            if (lat < 0) {
                data = swapSeasonsForSouthernHemisphere(data);
            }
            
            //Diagramm & Tabelle darstellen
            renderDisplay(data, displayType);
        }
    } catch (error) {
        console.error("Fehler beim Abrufen der Stationsdaten:", error);
    }
}

// Funktion zum Tauschen der Jahreszeiten für die Südhalbkugel
function swapSeasonsForSouthernHemisphere(data) {
    console.log("Jahreszeiten tauschen für Südhalbkugel");
    data.forEach(entry => {
            console.log("Vor Tausch:", entry);
            
            // Tausche Frühling (spring) mit Herbst (fall)
            let tempSpringTmax = entry.spring_tmax;
            let tempSpringTmin = entry.spring_tmin;
            entry.spring_tmax = entry.fall_tmax;
            entry.spring_tmin = entry.fall_tmin;
            entry.fall_tmax = tempSpringTmax;
            entry.fall_tmin = tempSpringTmin;

            // Tausche Winter (winter) mit Sommer (summer)
            let tempSummerTmax = entry.summer_tmax;
            let tempSummerTmin = entry.summer_tmin;
            entry.summer_tmax = entry.winter_tmax;
            entry.summer_tmin = entry.winter_tmin;
            entry.winter_tmax = tempSummerTmax;
            entry.winter_tmin = tempSummerTmin;

            console.log("Nach Tausch:", entry);
    });
    return data;
}

// Darstellung von Tabelle und/oder Grafik
function renderDisplay(data, displayType) {
    console.log("Auswertung anzeigen");
    // Anzeigen der Container basierend auf dem gewählten Anzeigetyp
    if (displayType === 'graphic' || displayType === 'both') {
        renderChart(data);
        chartContainer.style.height = '400px';
        chartContainer.style.display = 'block';
    } else {
        chartContainer.style.height = '0px';
        chartContainer.style.display = 'none';
    }

    if (displayType === 'table' || displayType === 'both') {
        renderTable(data);
        tableDataContainer.style.display = 'block';
    } else {
        tableDataContainer.style.display = 'none'; 
    }
}

// Grafik rendern
function renderChart(data) {
    const ctx = createCanvas('chart-container');
    const labels = data.map(entry => entry.year);

    const datasets = generateChartDatasets(data);
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: chartOptions()
    });
}

// Canvas erstellen
function createCanvas(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    return canvas.getContext('2d');
}

// Chart-Datensätze generieren
function generateChartDatasets(data) {
    return [
        { label: 'TMAX', data: data.map(entry => entry.tmax), borderColor: 'red', fill: false },
        { label: 'TMIN', data: data.map(entry => entry.tmin), borderColor: 'blue', fill: false },
        { label: 'Frühling TMAX', data: data.map(entry => entry.spring_tmax || null), borderColor: 'SeaGreen', fill: false, hidden: true },
        { label: 'Frühling TMIN', data: data.map(entry => entry.spring_tmin || null), borderColor: 'LimeGreen', fill: false, hidden: true },
        { label: 'Sommer TMAX', data: data.map(entry => entry.summer_tmax || null), borderColor: 'DarkOrange', fill: false, hidden: true },
        { label: 'Sommer TMIN', data: data.map(entry => entry.summer_tmin || null), borderColor: 'Orange', fill: false, hidden: true },
        { label: 'Herbst TMAX', data: data.map(entry => entry.fall_tmax || null), borderColor: 'Chocolate', fill: false, hidden: true },
        { label: 'Herbst TMIN', data: data.map(entry => entry.fall_tmin || null), borderColor: 'Peru', fill: false, hidden: true },
        { label: 'Winter TMAX', data: data.map(entry => entry.winter_tmax || null), borderColor: 'DarkViolet', fill: false, hidden: true },
        { label: 'Winter TMIN', data: data.map(entry => entry.winter_tmin || null), borderColor: 'Purple', fill: false, hidden: true }
    ];
}

// Chart-Optionen
function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'years' }
            },
            y: {
                title: { display: true, text: '°C' },
                ticks: { callback: value => `${value} °C` }
            }
        }
    };
}

// Tabelle rendern
function renderTable(data) {
    let tableHtml = `<table><thead><tr><th>Jahr</th><th>TMAX</th><th>TMIN</th><th>Frühling TMAX</th><th>Frühling TMIN</th>
        <th>Sommer TMAX</th><th>Sommer TMIN</th><th>Herbst TMAX</th><th>Herbst TMIN</th><th>Winter TMAX</th><th>Winter TMIN</th></tr></thead><tbody>`;

    data.forEach(entry => {
        tableHtml += `<tr><td>${entry.year}</td>
        <td>${formatFloat(entry.tmax)}</td>
        <td>${formatFloat(entry.tmin)}</td>
        <td>${formatFloat(entry.spring_tmax)}</td>
        <td>${formatFloat(entry.spring_tmin)}</td>
        <td>${formatFloat(entry.summer_tmax)}</td>
        <td>${formatFloat(entry.summer_tmin)}</td>
        <td>${formatFloat(entry.fall_tmax)}</td>
        <td>${formatFloat(entry.fall_tmin)}</td>
        <td>${formatFloat(entry.winter_tmax)}</td>
        <td>${formatFloat(entry.winter_tmin)}</td></tr>`;
    });

    tableHtml += `</tbody></table>`;
    tableDataContainer.innerHTML = tableHtml;
}

// Fließkommazahlen formatieren
function formatFloat(value) {
    // Wenn der Wert null oder undefined ist, gebe "-"
    if (value === null || value === undefined) {
        return '-';
    }
    // Wenn der Wert eine ganze Zahl ist, formatiere auf eine Dezimalstelle
    return Number.isInteger(value) ? value.toFixed(1) : value;
}