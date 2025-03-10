// main.js
// ======================================================
// Dieses Modul steuert die Geschäftslogik und UI-Aktualisierungen.
// Es importiert Funktionen aus den Modulen backend.js, helpers.js und map.js.
// ======================================================

import { fetchStations, fetchStationData } from './backend.js';
import {
  validateRequiredFields,
  preventInputValues,
  setupInputLimits,
  populateYearOptions,
  updateYearOptions,
  createCanvas,
  generateChartDatasets,
  chartOptions,
  formatFloat,
  swapSeasonsForSouthernHemisphere
} from './helpers.js';
import {
  initializeMap,
  createStationMarker,
  highlightMarker,
  updateUserPosition
} from './map.js';

// Konstanten für Icon-Pfade
const STATION_ICON_PATH = 'static/icons/station-icon.svg';
const SELECTED_ICON_PATH = 'static/icons/selected-icon.svg';

// Globale Variablen und DOM-Elemente
let startYear = 1763, endYear = 2024;
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');
startYearSelect.value = startYear;
endYearSelect.value = endYear;

let selectedStationId = null;         // Aktuell ausgewählte Stations-ID
let chartInstance = null;             // Referenz auf das aktuelle Chart (falls vorhanden)
let map, userMarker, radiusCircle;    // Leaflet-Kartenobjekte
let stationMarkers = [];              // Array mit allen erstellten Stations-Markern
let selectedMarker = null;            // Der aktuell hervorgehobene Marker
let lat = null, lon = null;           // Aktuelle Benutzerkoordinaten

// DOM-Elemente für UI-Komponenten
const searchButton = document.getElementById('searchButton');
const evaluateButton = document.getElementById('evaluateButton');
const chartContainer = document.getElementById('chart-container');
const tableDataContainer = document.getElementById('table-data');
const stationsContainer = document.getElementById('search-results');

// ======================================================
// Karteninitialisierung
// ======================================================
const { map: _map, userMarker: _userMarker, radiusCircle: _radiusCircle } = initializeMap();
map = _map;
userMarker = _userMarker;
radiusCircle = _radiusCircle;

// ======================================================
// UI-Funktionen
// ======================================================

/**
 * Erzeugt HTML für eine einzelne Tabellenzeile einer Station.
 * @param {Object} station - Station-Objekt
 * @returns {string} HTML-String für die Tabellenzeile
 */
const createStationRow = station => `
  <tr class="station-row" data-id="${station.id}">
    <td>${station.id}</td>
    <td>${station.name}</td>
    <td>${station.latitude.toFixed(4)}°</td>
    <td>${station.longitude.toFixed(4)}°</td>
    <td>${station.mindate}</td>
    <td>${station.maxdate}</td>
    <td>${station.distance.toFixed(2)} km</td>
  </tr>
`;

/**
 * Zeigt die gefundenen Stationen in einer Tabelle an und erstellt Marker auf der Karte.
 * @param {Array} stations - Array von Station-Objekten
 */
const displayStations = stations => {
  if (!stations.length) {
    alert("Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!");
    return;
  }

  // Erzeuge die Tabelle mittels Template Literal
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
          <th>Distanz</th>
        </tr>
      </thead>
      <tbody>
        ${stations.map(createStationRow).join('')}
      </tbody>
    </table>
  `;
  stationsContainer.style.display = 'block';

  // Füge Click-Eventlistener für jede Zeile hinzu, um die Station auszuwählen
  document.querySelectorAll('.station-row').forEach(row => {
    row.addEventListener('click', () => {
      clear('data');
      highlightSelectedStationAndMarker(row.getAttribute('data-id'));
    });
  });

  // Erstelle Marker für jede Station und speichere sie im Array
  stations.forEach(station => {
    const marker = createStationMarker(map, station, STATION_ICON_PATH);
    stationMarkers.push({ stationId: station.id, marker });
  });
};

/**
 * Entfernt vorhandene UI-Elemente wie Tabellen, Marker, Diagramme etc.
 * @param {string} mode - 'all' oder 'data'
 */
const clear = (mode = 'all') => {
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

/**
 * Hebt die ausgewählte Station in der Tabelle und auf der Karte hervor.
 * @param {string} stationId - ID der auszuwählenden Station
 */
const highlightSelectedStationAndMarker = stationId => {
  // Entferne 'selected'-Klasse von allen Zeilen
  document.querySelectorAll('.station-row').forEach(row => row.classList.remove('selected'));
  // Füge die 'selected'-Klasse zur ausgewählten Zeile hinzu
  const row = document.querySelector(`.station-row[data-id="${stationId}"]`);
  row.classList.add('selected');
  selectedStationId = stationId;

  // Setze ggf. den vorher ausgewählten Marker zurück
  if (selectedMarker) {
    selectedMarker.setIcon(
      L.icon({
        iconUrl: STATION_ICON_PATH,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    );
  }
  // Finde den Marker der ausgewählten Station und hebe ihn hervor
  const found = stationMarkers.find(item => item.stationId === selectedStationId);
  if (found) {
    selectedMarker = found.marker;
    highlightMarker(map, selectedMarker, STATION_ICON_PATH, SELECTED_ICON_PATH);
  }
};

/**
 * Rendert je nach ausgewähltem Anzeige-Typ (Diagramm, Tabelle oder beide) die Auswertung.
 * @param {Array} data - Array von Daten (z. B. jährliche Temperaturwerte)
 * @param {string} displayType - 'graphic', 'table' oder 'both'
 */
const renderDisplay = (data, displayType) => {
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

/**
 * Rendert ein Diagramm mit Chart.js.
 * @param {Array} data - Array der auszuwertenden Daten
 */
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

/**
 * Rendert die Auswertungstabelle.
 * @param {Array} data - Array der auszuwertenden Daten
 */
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
        ${data
          .map(
            entry => `
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
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
  tableDataContainer.innerHTML = tableHtml;
};

// ======================================================
// Handler-Funktionen für API-Aufrufe und UI-Aktualisierung
// ======================================================

/**
 * Handler für das Suchen von Stationen.
 * Liest die Eingabewerte, aktualisiert die Benutzerposition und ruft die Stationsdaten ab.
 */
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

  // Aktualisiere die Benutzerposition auf der Karte
  const updated = updateUserPosition(map, lat, lon, userMarker, radiusCircle, radius);
  userMarker = updated.userMarker;
  radiusCircle = updated.radiusCircle;
  map.setView([lat, lon], 8);

  try {
    const stations = await fetchStations(lat, lon, radius, limit, startYear, endYear);
    displayStations(stations);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Handler für die Auswertung einer ausgewählten Station.
 * Liest die Jahr-Eingaben, ruft die Stationsdaten ab und rendert die Auswertung.
 */
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
      // Bei südlichen Breiten ggf. die Jahreszeiten tauschen
      if (lat < 0) {
        data = swapSeasonsForSouthernHemisphere(data);
      }
      renderDisplay(data, displayType);
    }
  } catch (error) {
    console.error(error);
  }
};

// ======================================================
// Zentrales Event-Handling für alle UI-Elemente
// ======================================================

/**
 * Registriert Event-Listener für alle UI-Elemente.
 */
const setupEventListeners = () => {
  startYearSelect.addEventListener('change', () =>
    updateYearOptions(parseInt(startYearSelect.value), endYearSelect, 'end')
  );
  endYearSelect.addEventListener('change', () =>
    updateYearOptions(parseInt(endYearSelect.value), startYearSelect, 'start')
  );
  searchButton.addEventListener('click', searchStationsHandler);
  evaluateButton.addEventListener('click', evaluateStationHandler);
  document.addEventListener('keydown', preventInputValues);
};

// ======================================================
// Initialisierung beim Laden des DOM
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  populateYearOptions();
  setupEventListeners();
  setupInputLimits();
});
