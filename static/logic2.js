let startYear = 1850, endYear = 2024;
const [startYearSelect, endYearSelect] = [document.getElementById('startYear'), document.getElementById('endYear')];
[startYearSelect.value, endYearSelect.value] = [startYear, endYear];

let selectedStationId = null, chartInstance = null, map, userMarker, radiusCircle;
let stationCircles = [], selectedMarker = null, stationMarkers = [];
const searchButton = document.getElementById('searchButton'), 
      evaluateButton = document.getElementById('evaluateButton'),
      radius = document.getElementById('radius').value,
      limit = document.getElementById('limit').value,
      chartContainer = document.getElementById('chart-container'),
      tableDataContainer = document.getElementById('table-data');

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ist geladen");
    initializeMap();
    populateYearOptions();
    setupEventListeners();
    setupInputLimits();
});


function initializeMap(){
    const initialLat = 52.5162; 
    const initialLon = 13.3777;
    const initialZoom = 5;

    map = L.map('map').setView([initialLat, initialLon], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialer Marker
    userMarker = L.marker([initialLat, initialLon]).addTo(map);
    radiusCircle = L.circle([initialLat, initialLon], { radius: 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map); // Initialer Radius
}

// Jahr-Optionen füllen
function populateYearOptions() {
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
    startYearSelect.addEventListener('change', handleStartYearChange);
    endYearSelect.addEventListener('change', handleEndYearChange);
    searchButton.addEventListener('click', searchStations);
    evaluateButton.addEventListener('click', evaluateStation);
}

// Input-Limit für Anzahl Stationen
function setupInputLimits() {
    const limit = document.getElementById('limit');
    limit.addEventListener('input', () => {
        if (parseInt(limit.value) > 10) {
            limit.value = 10;
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
    console.log("searchStations");
    selectedStationId = null;
    const latInput = latitude.value;
    const lonInput = longitude.value;

    // Hole den Radiuswert direkt aus dem Eingabefeld
    const radius = parseInt(document.getElementById('radius').value);
    const limit = parseInt(document.getElementById('limit').value); // Holen des Limit-Werts

    if (latInput === "" || lonInput === "") {
        alert("Bitte geben Sie Längen- & Breitengrad an!");
        return;
    }

    const lat = parseFloat(latInput).toFixed(4);
    const lon = parseFloat(lonInput).toFixed(4);

    // Lösche bestehende Markierungen, Diagramme und Tabellen
    clearChartAndTable();

    // Lösche alle bestehenden Stationen-Markierungen auf der Karte
    removeExistingStationMarkers();

    // Setze die Karte auf die Benutzerposition
    map.setView([lat, lon], 8);
    updateUserLocation(lat, lon, radius);

    // Verstecke chart und table-container nach der Suche
    chartContainer.style.display = 'none';
    tableDataContainer.style.display = 'none';

    try {
        // Hole die Stationen vom Server mit dem korrekt ausgelesenen Radius
        const response = await fetch(`/stations-within-radius/${lat}/${lon}/${radius}/${limit}`);
        const stations = await response.json();

        // Begrenze die Anzahl der Stationen, die angezeigt werden (entsprechend dem Limit)
        if (stations && stations.length > 0) {
            const limitedStations = stations.slice(0, limit); // Nur die ersten `limit` Stationen anzeigen
            displayStations(limitedStations); // Anzeige der neuen Stationen auf der Karte und in der Tabelle
        } else {
            alert("Keine Stationen in diesem Radius gefunden!");
        }
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
    }
}

// Funktion zum Entfernen der bestehenden Stationen-Markierungen
function removeExistingStationMarkers() {
    // Entferne alle Stationen Markierungen von der Karte
    stationMarkers.forEach(station => {
        map.removeLayer(station.marker);
    });

    // Leere die Liste der Stationen
    stationMarkers = [];
}

// Benutzer-Location aktualisieren
function updateUserLocation(lat, lon, radius) {
    if (userMarker) map.removeLayer(userMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);

    // Erstelle neue Marker und Kreis
    userMarker = L.marker([lat, lon]).addTo(map);
    radiusCircle = L.circle([lat, lon], { radius: radius * 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);

    // Entferne alte Stationen-Markierungen von der Karte
    stationMarkers.forEach(station => {
        map.removeLayer(station.marker);
    });

    // Leere das Stationen-Array
    stationMarkers = [];
}

function displayStations(stations) {
    let tableHtml = `<table><thead><tr><th>ID</th><th>Name</th><th>Breite</th><th>Länge</th><th>Mindate</th><th>Maxdate</th></tr></thead><tbody>`;
    
    stations.forEach(station => {
        tableHtml += `<tr class="station-row" data-id="${station.id}">
        <td>${station.id}</td>
        <td>${station.name}</td>
        <td>${station.latitude}</td>
        <td>${station.longitude}</td>
        <td>${station.mindate}</td>
        <td>${station.maxdate}</td>
    </tr>`;
    });

    tableHtml += `</tbody></table>`;
    document.querySelector('.search-results').innerHTML = tableHtml;

    document.querySelectorAll('.station-row').forEach(row => {
        row.addEventListener('click', () => {
            selectStation(row.getAttribute('data-id'));
        });
    });

    // Füge neue Stationen als Marker hinzu
    stations.forEach(station => {
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
}

function clearChartAndTable() {
    console.log("clearChartAndTable");

    // Überprüfen, ob chartContainer existiert
    if (chartContainer) {
        // Zerstöre das Diagramm, falls vorhanden
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        // Lösche den Inhalt des Diagramm-Containers
        chartContainer.innerHTML = '';
    }

    // Lösche die bestehende Tabelle
    if (tableDataContainer) {
        tableDataContainer.innerHTML = '';
    }

    // Entferne alle Stationen Markierungen von der Karte
    stationMarkers.forEach(station => {
        map.removeLayer(station.marker);
    });

    // Leere die Liste der Stationen
    stationMarkers = [];
}

// Station auswählen
function selectStation(stationId) {
    document.querySelectorAll('.station-row').forEach(row => row.classList.remove('selected'));
    const row = document.querySelector(`.station-row[data-id="${stationId}"]`);
    row.classList.add('selected');
    selectedStationId = stationId;
    highlightSelectedMarker();
}

// Marker hervorheben
function highlightSelectedMarker() {
    if (selectedMarker) {
        selectedMarker.setIcon(L.icon({
            iconUrl: 'static/icons/station-icon.svg',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
    }

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
    if (!selectedStationId) {
        alert("Bitte zuerst eine Station auswählen!");
        return;
    }

    startYear = startYearSelect.value;
    endYear = endYearSelect.value;
    const displayType = document.getElementById('displayType').value;

    try {
        const response = await fetch(`/station-data/${selectedStationId}/${startYear}/${endYear}`);
        const data = await response.json();
        if (data && data.length > 0) {
            renderDisplay(data, displayType);  // Diese Funktion stellt das Diagramm und die Tabelle dar

            // Anzeigen der Container basierend auf dem gewählten Anzeigetyp
            if (displayType === 'graphic' || displayType === 'both') {
                chartContainer.style.display = 'block';
            } else {
                chartContainer.style.display = 'none';
            }

            if (displayType === 'table' || displayType === 'both') {
                tableDataContainer.style.display = 'block';
            } else {
                tableDataContainer.style.display = 'none';
            }

        } else {
            alert("Keine Daten für die ausgewählte Station im angegebenen Zeitraum!");
        }
    } catch (error) {
        console.error("Fehler beim Abrufen der Stationsdaten:", error);
    }
}

// Darstellung von Tabelle und/oder Grafik
function renderDisplay(data, displayType) {
    // Zuerst den Container leeren
    tableDataContainer.innerHTML = '';
    chartContainer.innerHTML = '';

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // Grafik rendern, wenn gewünscht
    if (displayType === 'graphic' || displayType === 'both') {
        renderChart(data);  // Diese Funktion rendert das Diagramm
        chartContainer.style.height = '400px';  // Stelle sicher, dass die Höhe des Diagramms korrekt gesetzt wird
    } else {
        chartContainer.style.height = '0px';  // Verstecke den Container, wenn nicht angezeigt
    }

    // Tabelle rendern, wenn gewünscht
    if (displayType === 'table' || displayType === 'both') {
        renderTable(data);  // Diese Funktion rendert die Tabelle
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