import { setupDOM, getContainers } from '../jest/testHelpers.js'; // Passe ggf. den Pfad an
import { jest } from '@jest/globals';

let displayStations, searchStationsHandler, evaluateStationHandler, clear, renderDisplay;
let backend;
let createStationMarker;

beforeEach(async () => {
  jest.resetModules();
  setupDOM();
  global.alert = jest.fn();

  // Mocks für backend.js
  await jest.unstable_mockModule('../backend.js', () => ({
    fetchStations: jest.fn(),
    fetchStationData: jest.fn(),
  }));
  backend = await import('../backend.js');

  // Mocks für map.js
  await jest.unstable_mockModule('../map.js', () => ({
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

  // Mocks für helpers.js
  await jest.unstable_mockModule('../helpers.js', () => ({
    validateRequiredFields: jest.fn(() => true),
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
    swapSeasonsForSouthernHemisphere: jest.fn(data => data),
  }));

  // main.js importieren (nachdem DOM zurückgesetzt wurde)
  const main = await import('../main.js');
  ({ displayStations, searchStationsHandler, evaluateStationHandler, clear, renderDisplay } = main);

  // Zusätzlichen Import von createStationMarker aus map.js
  const mapModule = await import('../map.js');
  createStationMarker = mapModule.createStationMarker;
});

describe('clear', () => {
  it('should clear all elements', () => {
    clear('all');
    const stationsContainer = document.querySelector('#search-results');
    const chartContainer = document.querySelector('#chart-container');
    const tableContainer = document.querySelector('#table-data');
    expect(stationsContainer.innerHTML).toBe('');
    expect(stationsContainer.style.display).toBe('none');
    expect(chartContainer.innerHTML).toBe('');
    expect(chartContainer.style.display).toBe('none');
    expect(tableContainer.innerHTML).toBe('');
    expect(tableContainer.style.display).toBe('none');
  });

  it('should clear data and charts when mode is "data"', () => {
    clear('data');
    const chartContainer = document.querySelector('#chart-container');
    const tableContainer = document.querySelector('#table-data');
    expect(chartContainer.innerHTML).toBe('');
    expect(chartContainer.style.display).toBe('none');
    expect(tableContainer.innerHTML).toBe('');
    expect(tableContainer.style.display).toBe('none');
  });
});

describe('searchStationsHandler', () => {
  const setRequiredFields = () => {
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
  };

  it('should fetch stations when required fields are filled', async () => {
    setRequiredFields();
    const stations = [{
      id: 'GME00125026',
      name: 'LANGENLIPSDORF',
      latitude: 51.9183,
      longitude: 13.0889,
      mindate: 2020,
      maxdate: 2024,
      distance: 10.94,
    }];
    backend.fetchStations.mockResolvedValue(stations);
    await searchStationsHandler();
    expect(backend.fetchStations).toHaveBeenCalledWith('52.0000', '13.0000', 80, 10, 2020, 2024);
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('should show an alert if no stations are found', async () => {
    setRequiredFields();
    backend.fetchStations.mockResolvedValue([]);
    await searchStationsHandler();
    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
});

describe('evaluateStationHandler', () => {
  it('should call fetchStationData and render result', async () => {
    // Setze erforderliche Felder
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

    // Simuliere vorhandene Station
    backend.fetchStations.mockResolvedValue([{
      id: 'GME00125026',
      name: 'LANGENLIPSDORF',
      latitude: 51.9183,
      longitude: 13.0889,
      mindate: 2020,
      maxdate: 2024,
      distance: 10.94,
    }]);
    await searchStationsHandler();
    const stationRow = document.querySelector('.station-row');
    expect(stationRow).toBeTruthy();

    // Simuliere Klick auf Station
    stationRow.dispatchEvent(new Event('click', { bubbles: true }));
    await evaluateStationHandler();
    expect(backend.fetchStationData).toHaveBeenCalled();
  });

  it('should alert when no station is selected', async () => {
    global.selectedStationId = null;
    await evaluateStationHandler();
    expect(global.alert).toHaveBeenCalledWith('Bitte zuerst eine Station auswählen!');
  });
});

describe('displayStations & renderDisplay', () => {
  const dummyStations = [
    { id: 'GME001', name: 'Station1', latitude: 52, longitude: 13, mindate: 2000, maxdate: 2024, distance: 1.5 },
    { id: 'GME002', name: 'Station2', latitude: 53, longitude: 14, mindate: 2010, maxdate: 2023, distance: 2.0 }
  ];

  describe('displayStations', () => {
    it('should display a table with station data', () => {
      displayStations(dummyStations);
      const { stationsContainer } = getContainers();
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
    displayStations([dummyStations[0]]);
    const stationRow = document.querySelector('.station-row');
    expect(stationRow).toBeTruthy();
    stationRow.dispatchEvent(new Event('click', { bubbles: true }));
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

  it('should render chart when displayType is "graphic"', () => {
    renderDisplay(dummyData, 'graphic');
    const { chartContainer, tableDataContainer } = getContainers();
    expect(chartContainer.style.height).toBe('400px');
    expect(chartContainer.style.display).toBe('block');
    expect(tableDataContainer.style.display).toBe('none');
  });

  it('should render table when displayType is "table"', () => {
    renderDisplay(dummyData, 'table');
    const { chartContainer, tableDataContainer } = getContainers();
    expect(chartContainer.style.height).toBe('0px');
    expect(chartContainer.style.display).toBe('none');
    expect(tableDataContainer.style.display).toBe('block');
    expect(tableDataContainer.innerHTML).toContain('<table>');
  });

  it('should render both chart and table when displayType is "both"', () => {
    renderDisplay(dummyData, 'both');
    const { chartContainer, tableDataContainer } = getContainers();
    expect(chartContainer.style.height).toBe('400px');
    expect(chartContainer.style.display).toBe('block');
    expect(tableDataContainer.style.display).toBe('block');
    expect(tableDataContainer.innerHTML).toContain('<table>');
  });
});
});