import { 
  setupDOM,
  getContainers,
  setDummyContentForContainers,
  setRequiredFieldsForSearchStationHandler, 
  setRequiredFieldsForEvaluateStationHandler, 
  setDummyDataForDisplayStations,
  setDummyDataForRenderDisplay
} from '../jest/testHelpers.js';
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

  const main = await import('../main.js');
  ({ displayStations, searchStationsHandler, evaluateStationHandler, clear, renderDisplay } = main);

  const mapModule = await import('../map.js');
  createStationMarker = mapModule.createStationMarker;
});

describe('clear', () => {
  it('should clear all elements', () => {
    const { stationsContainer, chartContainer, tableDataContainer } = getContainers();
    setDummyContentForContainers();
    clear('all');

    expect(stationsContainer.innerHTML).toBe('');
    expect(stationsContainer.style.display).toBe('none');
    expect(chartContainer.innerHTML).toBe('');
    expect(chartContainer.style.display).toBe('none');
    expect(tableDataContainer.innerHTML).toBe('');
    expect(tableDataContainer.style.display).toBe('none');
  });

  it('should clear data and charts when mode is "data"', () => {
    const { stationsContainer, chartContainer, tableDataContainer } = getContainers();
    setDummyContentForContainers();
    clear('data');

    expect(stationsContainer.innerHTML).not.toBe('');
    expect(stationsContainer.style.display).not.toBe('none');
    expect(chartContainer.innerHTML).toBe('');
    expect(chartContainer.style.display).toBe('none');
    expect(tableDataContainer.innerHTML).toBe('');
    expect(tableDataContainer.style.display).toBe('none');
  });
});

describe('searchStationsHandler', () => {
  it('should fetch stations when required fields are filled', async () => {
    setRequiredFieldsForSearchStationHandler();
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
    setRequiredFieldsForSearchStationHandler();
    backend.fetchStations.mockResolvedValue([]);
    await searchStationsHandler();
    expect(global.alert).toHaveBeenCalledWith('Es wurden keine Stationen gefunden, die den Suchkriterien entsprechen!');
  });
});

describe('evaluateStationHandler', () => {
  it('should call fetchStationData and render result', async () => {
    setRequiredFieldsForEvaluateStationHandler();

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
    // Klick nicht simuliert -> keine Station ist ausgewählt
    await evaluateStationHandler();
    expect(global.alert).toHaveBeenCalledWith('Bitte zuerst eine Station auswählen!');
  });
});

describe('displayStations & renderDisplay', () => {
  const Stations = setDummyDataForDisplayStations();

  describe('displayStations', () => {
    it('should display a table with station data', () => {
      displayStations(Stations);
      const { stationsContainer } = getContainers();
      expect(stationsContainer.innerHTML).toContain('Station1');
      expect(stationsContainer.innerHTML).toContain('Station2');
      expect(stationsContainer.style.display).toBe('block');
    });

  it('should create markers for each station', () => {
    displayStations(Stations);
    expect(createStationMarker).toHaveBeenCalledTimes(2);
  });

  it('should add click event listeners to station rows', () => {
    displayStations([Stations[0]]);
    const stationRow = document.querySelector('.station-row');
    expect(stationRow).toBeTruthy();
    stationRow.dispatchEvent(new Event('click', { bubbles: true }));
    expect(stationRow.classList.contains('selected')).toBe(true);
  });
});

describe('renderDisplay', () => {
  const dummyData = setDummyDataForRenderDisplay();

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