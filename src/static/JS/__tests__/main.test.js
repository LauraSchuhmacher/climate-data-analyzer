import { jest } from '@jest/globals';

// Backend-Modul via unstable_mockModule mocken
let backend;
beforeAll(async () => {
  await jest.unstable_mockModule('backend', () => ({
    fetchStations: jest.fn(),
    fetchStationData: jest.fn(),
  }));
  backend = await import('backend');
});

// Map-Modul mocken, sodass initializeMap ein Kartenobjekt mit closePopup liefert
let mapModule;
beforeAll(async () => {
  await jest.unstable_mockModule('map', () => ({
    initializeMap: () => ({
      map: {
        closePopup: jest.fn(), // Diese Methode wird benötigt
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
  mapModule = await import('map');
});

let displayStations, searchStationsHandler, evaluateStationHandler, clear;

beforeEach(async () => {
  jest.resetModules(); // Modul-Cache leeren, damit main.js neu importiert wird

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

  // Importiere main.js dynamisch, nachdem der DOM gesetzt wurde
  const main = await import('../main.js');
  ({ displayStations, searchStationsHandler, evaluateStationHandler, clear } = main);
});

describe('clear', () => {
  it('should clear stations and markers', () => {
    clear('all');
    
    const stationsContainer = document.querySelector('#search-results');
    expect(stationsContainer.innerHTML).toBe('');
    expect(stationsContainer.style.display).toBe('none');
  });

  it('should clear data and charts when mode is "data"', () => {
    clear('data');
    
    const chartContainer = document.querySelector('#chart-container');
    expect(chartContainer.style.display).toBe('none');
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
        id: 'GME00129634',
        name: 'VILLINGEN-SCHWENNINGEN',
        latitude: 52,
        longitude: 13,
        mindate: 1947,
        maxdate: 2024,
        distance: 1.95
      }
    ];
    backend.fetchStations.mockResolvedValue(stations);
  
    await searchStationsHandler();
  
    // Da in searchStationsHandler die Werte per toFixed(4) umgewandelt werden,
    // erwarten wir hier "52.0000" und "13.0000" als Strings.
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
  
    backend.fetchStations.mockResolvedValue([]);
  
    await searchStationsHandler();
  
    // Da validateRequiredFields() erfüllt ist, wird aber, wenn keine Stationen zurückgegeben werden,
    // der Alert mit einer entsprechenden Nachricht aufgerufen.
    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
  
});

describe('evaluateStationHandler', () => {
  it('should call fetchStationData and render the result', async () => {
    const data = [
      { year: 2020, tmax: 30, tmin: 10, spring_tmax: 25, spring_tmin: 5, summer_tmax: 35, summer_tmin: 15, fall_tmax: 20, fall_tmin: 10, winter_tmax: 5, winter_tmin: -5 },
    ];

    backend.fetchStationData.mockResolvedValue(data);

    // Statt auf das Rendern einer Zeile zu setzen, können wir den Modulwert direkt setzen:
    global.selectedStationId = 'GME00129634';

    // Setze die Eingabewerte für die Auswertung
    document.getElementById('startYear').value = '2020';
    document.getElementById('endYear').value = '2024';
    document.getElementById('displayType').value = 'both';

    await evaluateStationHandler();

    expect(backend.fetchStationData).toHaveBeenCalled();
  });

  it('should show an alert if no station is selected', async () => {
    global.selectedStationId = null;
    await evaluateStationHandler();
    expect(global.alert).toHaveBeenCalledWith('Bitte zuerst eine Station auswählen!');
  });
});
