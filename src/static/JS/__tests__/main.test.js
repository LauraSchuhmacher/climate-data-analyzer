import { jest } from '@jest/globals';
import { displayStations, searchStationsHandler, clear } from '../main';
import { fetchStations, fetchStationData } from '../backend.js';

jest.mock('../backend.js', () => ({
  fetchStations: jest.fn(),
  fetchStationData: jest.fn(),
}));

beforeEach(() => {
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

  document.getElementById = jest.fn((id) => {
    if (id === 'startYear') return { value: '1763' };
    if (id === 'endYear') return { value: '2024' };
    if (id === 'latitude') return { value: '48.0458' };
    if (id === 'longitude') return { value: '8.4617' };
    if (id === 'radius') return { value: '100' };
    if (id === 'limit') return { value: '10' };
    if (id === 'searchButton') return {};
    if (id === 'evaluateButton') return {};
    return null;
  });

  global.alert = jest.fn();
});

describe('displayStations', () => {
  it('should render a table with stations', () => {
    const stations = [
      { id: 'GME00129634', name: 'VILLINGEN-SCHWENNINGEN', latitude: 48.0458, longitude: 8.4617, mindate: 1947, maxdate: 2024, distance: 1.9532123487652326 },
    ];

    displayStations(stations);

    // Überprüfen ob Tabelle korrekt erstellt wurde
    const table = document.querySelector('#search-results table');
    expect(table).not.toBeNull();
    expect(table.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('should show an alert when no stations are found', () => {
    const stations = [];
    displayStations(stations);
    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
});

describe('clear', () => {
  it('should clear stations and markers', () => {
    clear('all');
    
    // Überprüfen ob Stationscontainer und Marker gelöscht wurden
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
    const stations = [
      { id: 'GME00129634', name: 'VILLINGEN-SCHWENNINGEN', latitude: 48.0458, longitude: 8.4617, mindate: 1947, maxdate: 2024, distance: 1.9532123487652326 },
    ];

    fetchStations.mockResolvedValue(stations);

    await searchStationsHandler();

    expect(fetchStations).toHaveBeenCalledWith('48.0458', '8.4617', 100, 10, 1763, 2024);

    expect(global.alert).not.toHaveBeenCalled(); // Kein Alert, da es Stationen gibt
  });

  it('should show an alert if no stations are found', async () => {
    fetchStations.mockResolvedValue([]);

    await searchStationsHandler();

    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
});

describe('evaluateStationHandler', () => {
  it('should call fetchStationData and render the result', async () => {
    const data = [
      { year: 2020, tmax: 30, tmin: 10, spring_tmax: 25, spring_tmin: 5, summer_tmax: 35, summer_tmin: 15, fall_tmax: 20, fall_tmin: 10, winter_tmax: 5, winter_tmin: -5 },
    ];

    fetchStationData.mockResolvedValue(data);

    // Simuliere Stationauswahl und Buttonklick
    document.getElementById('startYear').value = '2020';
    document.getElementById('endYear').value = '2024';
    document.getElementById('displayType').value = 'both';

    await evaluateStationHandler();

    expect(fetchStationData).toHaveBeenCalled();
  });

  it('should show an alert if no station is selected', async () => {
    await evaluateStationHandler();

    expect(global.alert).toHaveBeenCalledWith('Bitte zuerst eine Station auswählen!');
  });
});
