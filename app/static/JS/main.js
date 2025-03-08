// main.js
import { fetchStations, fetchStationData } from './backend.js';
import { 
  validateRequiredFields, preventInputValues, setupInputLimits, 
  populateYearOptions, updateYearOptions, createCanvas, generateChartDatasets, 
  chartOptions, formatFloat, swapSeasonsForSouthernHemisphere 
} from './helpers.js';

// Konstanten für Icon-Pfade
const STATION_ICON_PATH = 'static/icons/station-icon.svg';
const SELECTED_ICON_PATH = 'static/icons/selected-icon.svg';

// Globale Variablen und DOM-Elemente
let startYear = 1763, endYear = 2024;
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');
startYearSelect.value = startYear;
endYearSelect.value = endYear;

let selectedStationId = null, chartInstance = null, map, userMarker, radiusCircle;
let stationMarkers = [], selectedMarker = null;
let lat = null, lon = null;
const searchButton = document.getElementById('searchButton');
const evaluateButton = document.getElementById('evaluateButton');
const chartContainer = document.getElementById('chart-container');
const tableDataContainer = document.getElementById('table-data');
const stationsContainer = document.getElementById('search-results');

// Initialisiert die Karte
const initializeMap = () => {
  console.log("Initialisiere Karte");
  const initialLat = 52.5162; 
  const initialLon = 13.3777;
  const initialZoom = 5;

  map = L.map('map').setView([initialLat, initialLon], initialZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Erster Marker und Kreis
  userMarker = L.marker([initialLat, initialLon]).addTo(map);
  radiusCircle = L.circle([initialLat, initialLon], { radius: 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);

  // Klick-Event: Popup mit Koordinaten
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`<b>Koordinaten:</b><br>Latitude: ${lat.toFixed(4)}<br>Longitude: ${lng.toFixed(4)}`)
      .openOn(map);
  });
};

// Erzeugt einen Marker für eine Station
const createStationMarker = station => {
  const icon = L.icon({
    iconUrl: STATION_ICON_PATH,
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

// Erzeugt HTML für eine Tabellenzeile einer Station
const createStationRow = station => `
  <tr class="station-row" data-id="${station.id}">
    <td>${station.id}</td>
    <td>${station.name}</td>
    <td>${station.latitude}</td>
    <td>${station.longitude}</td>
    <td>${station.mindate}</td>
    <td>${station.maxdate}</td>
  </tr>
`;

// Zeigt die gefundenen Stationen in der Tabelle an und erstellt Marker.
const displayStations = stations => {
  console.log("Stationen anzeigen");
  if (!stations.length) {
    alert("Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!");
    return;
  }

  stationsContainer.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Breite</th>
          <th>Länge</th>
          <th>Mindate</th>
          <th>Maxdate</th>
        </tr>
      </thead>
      <tbody>
        ${stations.map(createStationRow).join('')}
      </tbody>
    </table>
  `;
  stationsContainer.style.display = 'block';

  document.querySelectorAll('.station-row').forEach(row => {
    row.addEventListener('click', () => {
      clear('data');
      highlightSelectedStationAndMarker(row.getAttribute('data-id'));
    });
  });

  // Erstelle Marker für jede Station
  stations.forEach(station => {
    const marker = createStationMarker(station);
    stationMarkers.push({ stationId: station.id, marker });
  });
};

// Löscht vorhandene UI-Elemente
const clear = (mode = 'all') => {
  console.log(`Lösche bestehende Daten mit Modus: ${mode}`);
  if (mode === 'all') {
    stationsContainer.innerHTML = '';
    stationsContainer.style.display = 'none';
    if (userMarker) map.removeLayer(userMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);
    stationMarkers.forEach(item => {
      map.removeLayer(item.marker);
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
};

// Hebt die ausgewählte Station in Tabelle und Karte hervor.
const highlightSelectedStationAndMarker = stationId => {
  document.querySelectorAll('.station-row').forEach(row => row.classList.remove('selected'));
  const row = document.querySelector(`.station-row[data-id="${stationId}"]`);
  row.classList.add('selected');
  selectedStationId = stationId;
  console.log(`selectedStationId: ${selectedStationId}`);

  if (selectedMarker) {
    selectedMarker.setIcon(L.icon({
      iconUrl: STATION_ICON_PATH,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }));
  }
  const found = stationMarkers.find(item => item.stationId === selectedStationId);
  if (found) {
    selectedMarker = found.marker;
    selectedMarker.setIcon(L.icon({
      iconUrl: SELECTED_ICON_PATH,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -30]
    }));
    map.setView(selectedMarker.getLatLng(), 9);
  }
};

// Rendert Diagramm und/oder Tabelle basierend auf dem Anzeige-Typ.
const renderDisplay = (data, displayType) => {
  console.log("Auswertung anzeigen");
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
};

// Rendert das Diagramm mit Chart.js.
const renderChart = data => {
  const ctx = createCanvas('chart-container');
  const labels = data.map(entry => entry.year);
  const datasets = generateChartDatasets(data);
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: chartOptions()
  });
};

// Rendert die Auswertungstabelle.
const renderTable = data => {
  const tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Jahr</th>
          <th>TMAX</th>
          <th>TMIN</th>
          <th>Frühling TMAX</th>
          <th>Frühling TMIN</th>
          <th>Sommer TMAX</th>
          <th>Sommer TMIN</th>
          <th>Herbst TMAX</th>
          <th>Herbst TMIN</th>
          <th>Winter TMAX</th>
          <th>Winter TMIN</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(entry => `
          <tr>
            <td>${entry.year}</td>
            <td>${formatFloat(entry.tmax)}</td>
            <td>${formatFloat(entry.tmin)}</td>
            <td>${formatFloat(entry.spring_tmax)}</td>
            <td>${formatFloat(entry.spring_tmin)}</td>
            <td>${formatFloat(entry.summer_tmax)}</td>
            <td>${formatFloat(entry.summer_tmin)}</td>
            <td>${formatFloat(entry.fall_tmax)}</td>
            <td>${formatFloat(entry.fall_tmin)}</td>
            <td>${formatFloat(entry.winter_tmax)}</td>
            <td>${formatFloat(entry.winter_tmin)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  tableDataContainer.innerHTML = tableHtml;
};

// Handler für das Suchen von Stationen.
const searchStationsHandler = async () => {
  selectedStationId = null;
  lat = parseFloat(document.getElementById('latitude').value).toFixed(4);
  lon = parseFloat(document.getElementById('longitude').value).toFixed(4);
  startYear = parseInt(document.getElementById('startYear').value);
  endYear = parseInt(document.getElementById('endYear').value);
  const radius = parseInt(document.getElementById('radius').value);
  const limit = parseInt(document.getElementById('limit').value);

  clear('all');
  if (!validateRequiredFields()) return;

  // Aktualisiere die Benutzerposition auf der Karte.
  map.setView([lat, lon], 8);
  userMarker = L.marker([lat, lon]).addTo(map);
  radiusCircle = L.circle([lat, lon], { radius: radius * 1000, color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);

  try {
    const stations = await fetchStations(lat, lon, radius, limit, startYear, endYear);
    displayStations(stations);
  } catch (error) {
    console.error(error);
  }
};

// Handler für die Auswertung einer ausgewählten Station.
const evaluateStationHandler = async () => {
  if (!selectedStationId) {
    alert("Bitte zuerst eine Station auswählen!");
    return;
  }
  startYear = document.getElementById('startYear').value;
  endYear = document.getElementById('endYear').value;
  const displayType = document.getElementById('displayType').value;
  try {
    let data = await fetchStationData(selectedStationId, startYear, endYear);
    if (data && data.length > 0) {
      if (lat < 0) {
        data = swapSeasonsForSouthernHemisphere(data);
      }
      renderDisplay(data, displayType);
    }
  } catch (error) {
    console.error(error);
  }
};

// Setzt Event-Listener und initialisiert die Anwendung.
const setupEventListeners = () => {
  console.log("Setup Event-Listeners");
  startYearSelect.addEventListener('change', () => {
    updateYearOptions(parseInt(startYearSelect.value), endYearSelect, 'end');
  });
  endYearSelect.addEventListener('change', () => {
    updateYearOptions(parseInt(endYearSelect.value), startYearSelect, 'start');
  });
  searchButton.addEventListener('click', searchStationsHandler);
  evaluateButton.addEventListener('click', evaluateStationHandler);
  document.addEventListener('keydown', preventInputValues);
};

// Initialisierung, sobald der DOM geladen ist.
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM ist geladen");
  initializeMap();
  populateYearOptions();
  setupEventListeners();
  setupInputLimits();
});
