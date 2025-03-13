import { jest } from '@jest/globals';

let displayStations, searchStationsHandler, evaluateStationHandler, clear;
let backend;
beforeEach(async () => {
  // Alle Module zurücksetzen
  jest.resetModules();

  // DOM vorbereiten
  document.body.innerHTML = `
    <select id="startYear"></select>
    <select id="endYear"></select>
    <input id="latitude" />
    <input id="longitude" />
    <input id="radius" />
    <input id="limit" />
    <select id="displayType"></select>
    <div id="search-results"></div>
    <div id="chart-container"></div>
    <div id="table-data"></div>
    <button id="searchButton"></button>
    <button id="evaluateButton"></button>
  `;
  global.alert = jest.fn();

  // Mocks neu registrieren
  await jest.unstable_mockModule('backend', () => ({
    fetchStations: jest.fn(),
    fetchStationData: jest.fn(),
  }));
  backend = await import('backend');

  await jest.unstable_mockModule('map', () => ({
    initializeMap: () => ({
      map: {
        closePopup: jest.fn(),
        removeLayer: jest.fn(),
        setView: jest.fn(),
      },
      userMarker: {},
      radiusCircle: {},
    }),
    createStationMarker: jest.fn(() => ({})),
    highlightMarker: jest.fn(),
    updateUserPosition: jest.fn(() => ({ userMarker: {}, radiusCircle: {} })),
  }));

  await jest.unstable_mockModule('helpers', () => ({
    validateRequiredFields: jest.fn(() => true), // immer true
    preventInputValues: jest.fn(),
    setupInputLimits: jest.fn(),
    populateYearOptions: jest.fn(),
    updateYearOptions: jest.fn(),
    createCanvas: jest.fn(() => {
      const canvas = document.createElement('canvas');
      return canvas.getContext('2d');
    }),
    generateChartDatasets: jest.fn(() => []),
    chartOptions: jest.fn(() => ({})),
    formatFloat: jest.fn(num => num.toFixed(4)),
    swapSeasonsForSouthernHemisphere: jest.fn(data => data)
  }));

  // Jetzt main.js importieren, damit alle Mocks greifen
  const main = await import('../main.js');
  ({ displayStations, searchStationsHandler, evaluateStationHandler, clear, renderDisplay } = main);
});

describe('clear', () => {
  it('should clear all', () => {
    clear('all');

    const stationsContainer = document.querySelector('#search-results');
    expect(stationsContainer.innerHTML).toBe('');
    expect(stationsContainer.style.display).toBe('none');

    const chartContainer = document.querySelector('#chart-container');
    expect(chartContainer.innerHTML).toBe(''); 
    expect(chartContainer.style.display).toBe('none');

    const tableContainer = document.querySelector('#table-data');
    expect(tableContainer.innerHTML).toBe('');
    expect(tableContainer.style.display).toBe('none');
  });

  it('should clear data and charts when mode is "data"', () => {
    clear('data');
    
    const chartContainer = document.querySelector('#chart-container');
    expect(chartContainer.innerHTML).toBe(''); 
    expect(chartContainer.style.display).toBe('none');

    const tableContainer = document.querySelector('#table-data');
    expect(tableContainer.innerHTML).toBe('');
    expect(tableContainer.style.display).toBe('none');
  });
});

describe('searchStationsHandler', () => {
  it('should fetch stations when required fields are filled', async () => {
    // Setze alle Pflichtfelder mit den gewünschten Werten, direkt vor dem Aufruf:
    document.getElementById('latitude').value = '52';
    document.getElementById('longitude').value = '13';
    document.getElementById('radius').value = '80';
    document.getElementById('limit').value = '10';
  const startYearSelect = document.getElementById('startYear');
  const endYearSelect = document.getElementById('endYear');
  startYearSelect.innerHTML = '<option value="2020">2020</option>';
  endYearSelect.innerHTML = '<option value="2024">2024</option>';
  startYearSelect.value = '2020';
  endYearSelect.value = '2024';


    // Beispiel-Daten, die vom Backend zurückgegeben werden:
    const stations = [
      {
        id: 'GME00125026',
        name: 'LANGENLIPSDORF',
        latitude: 51.9183,
        longitude: 13.0889,
        mindate: 2020,
        maxdate: 2024,
        distance: 10.94
      }
    ];
    backend.fetchStations.mockResolvedValue(stations);
  
    await searchStationsHandler();
  
    expect(backend.fetchStations).toHaveBeenCalledWith('52.0000', '13.0000', 80, 10, 2020, 2024);
    expect(global.alert).not.toHaveBeenCalled(); // Kein Alert, da Stationen gefunden wurden
  });
  
  it('should show an alert if no stations are found', async () => {
    // Setze alle Pflichtfelder ebenfalls mit den gewünschten Werten:
    document.getElementById('latitude').value = '52';
    document.getElementById('longitude').value = '13';
    document.getElementById('radius').value = '80';
    document.getElementById('limit').value = '10';
    document.getElementById('startYear').value = '2020';
    document.getElementById('endYear').value = '2024';
    
    // Beispiel-Daten aus Backend sind leer
    backend.fetchStations.mockResolvedValue([]);
  
    await searchStationsHandler();

    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
});

describe('evaluateStationHandler', () => {
  it('should call fetchStationData and render the result', async () => {
    // Beispiel-Daten, die vom Backend zurückgegeben werden:
    const stations = [
      {
        id: 'GME00125026',
        name: 'LANGENLIPSDORF',
        latitude: 51.9183,
        longitude: 13.0889,
        mindate: 2020,
        maxdate: 2024,
        distance: 10.94
      }
    ];
    backend.fetchStations.mockResolvedValue(stations);
    
    // Setze alle Pflichtfelder für die Suche:
    document.getElementById('latitude').value = '52';
    document.getElementById('longitude').value = '13';
    document.getElementById('radius').value = '80';
    document.getElementById('limit').value = '10';
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    startYearSelect.innerHTML = '<option value="2020">2020</option>';
    endYearSelect.innerHTML = '<option value="2024">2024</option>';
    startYearSelect.value = '2020';
    endYearSelect.value = '2024';
    
    await searchStationsHandler();
    
    const stationRow = document.querySelector('.station-row');
    expect(stationRow).toBeTruthy(); 

    // Simuliere den Klick auf den Auswerten-Button
    stationRow.dispatchEvent(new Event('click', { bubbles: true }));
    await evaluateStationHandler();
    expect(backend.fetchStationData).toHaveBeenCalled();
  });

  it('should show an alert if no station is selected', async () => {
    global.selectedStationId = null;
    await evaluateStationHandler();
    expect(global.alert).toHaveBeenCalledWith('Bitte zuerst eine Station auswählen!');
  });
});

describe('displayStations', () => {
  let stationsContainer;
  let createStationMarker;

  beforeEach(async () => {
    stationsContainer = document.getElementById('search-results');
    // Hole den Mock aus dem map-Modul, den main.js beim Import verwendet hat
    const mapModule = await import('map');
    createStationMarker = mapModule.createStationMarker;
  });
  
  it('should display a table with station data', () => {
    const stations = [
      { id: 'GME001', name: 'Station1', latitude: 52, longitude: 13, mindate: 2000, maxdate: 2024, distance: 1.5 },
      { id: 'GME002', name: 'Station2', latitude: 53, longitude: 14, mindate: 2010, maxdate: 2023, distance: 2.0 }
    ];

    displayStations(stations);

    expect(stationsContainer.innerHTML).toContain('Station1');
    expect(stationsContainer.innerHTML).toContain('Station2');
    expect(stationsContainer.style.display).toBe('block');
  });

  it('should create markers for each station', () => {
    const stations = [
      { id: 'GME001', name: 'Station1', latitude: 52, longitude: 13, mindate: 2000, maxdate: 2024, distance: 1.5 },
      { id: 'GME002', name: 'Station2', latitude: 53, longitude: 14, mindate: 2010, maxdate: 2023, distance: 2.0 }
    ];

    displayStations(stations);
    expect(createStationMarker).toHaveBeenCalledTimes(2);
  });

  it('should add click event listeners to station rows', () => {
    const stations = [
      { id: 'GME001', name: 'Station1', latitude: 52, longitude: 13, mindate: 2000, maxdate: 2024, distance: 1.5 }
    ];
  
    displayStations(stations);
  
    const stationRow = document.querySelector('.station-row');
    expect(stationRow).toBeTruthy();

    stationRow.dispatchEvent(new Event('click', { bubbles: true }));
    // überprüfe, ob die Zeile nach dem Klick die "selected"-Klasse hat:
    expect(stationRow.classList.contains('selected')).toBe(true);
  });
});

describe('renderDisplay', () => {
  const dummyData = [
    {
      year: 2000,
      tmax: 10,
      tmin: 5,
      spring_tmax: 11,
      spring_tmin: 6,
      summer_tmax: 15,
      summer_tmin: 10,
      fall_tmax: 12,
      fall_tmin: 8,
      winter_tmax: 9,
      winter_tmin: 4
    }
  ];

  beforeEach(() => {
    // Setze die innerHTML und Styles vor jedem Test zurück
    const chartContainer = document.getElementById('chart-container');
    const tableDataContainer = document.getElementById('table-data');
    chartContainer.innerHTML = '';
    tableDataContainer.innerHTML = '';
    chartContainer.style.display = '';
    tableDataContainer.style.display = '';
    chartContainer.style.height = '';
  });

  it('should render chart when displayType is "graphic"', () => {
    renderDisplay(dummyData, 'graphic');
    const chartContainer = document.getElementById('chart-container');
    const tableDataContainer = document.getElementById('table-data');
    
    expect(chartContainer.style.height).toBe('400px');
    expect(chartContainer.style.display).toBe('block');
    expect(tableDataContainer.style.display).toBe('none');
  });

  it('should render table when displayType is "table"', () => {
    renderDisplay(dummyData, 'table');
    const chartContainer = document.getElementById('chart-container');
    const tableDataContainer = document.getElementById('table-data');

    expect(chartContainer.style.height).toBe('0px');
    expect(chartContainer.style.display).toBe('none');
    expect(tableDataContainer.style.display).toBe('block');
    // Überprüfe, ob die Tabelle im HTML enthalten ist
    expect(tableDataContainer.innerHTML).toContain('<table>');
  });

  it('should render both chart and table when displayType is "both"', () => {
    renderDisplay(dummyData, 'both');
    const chartContainer = document.getElementById('chart-container');
    const tableDataContainer = document.getElementById('table-data');

    expect(chartContainer.style.height).toBe('400px');
    expect(chartContainer.style.display).toBe('block');
    expect(tableDataContainer.style.display).toBe('block');
    expect(tableDataContainer.innerHTML).toContain('<table>');
  });
});