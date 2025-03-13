// jest.setup.js
import { jest } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';

// Konsolenausgaben unterdrücken (optional)
jest.spyOn(console, 'error').mockImplementation(() => {});

// Fetch-Mock aktivieren
fetchMock.enableMocks();
global.fetch = fetchMock;

// Global alert mocken
global.alert = jest.fn();

// Hilfsfunktion für Fake-Marker
const createFakeMarker = () => ({
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn(),
  setIcon: jest.fn(),
  getLatLng: jest.fn(() => ({ lat: 0, lng: 0 }))
});

// Globales Leaflet-Mock
global.L = {
  map: jest.fn(() => {
    const fakeMap = {
      setView: jest.fn().mockReturnThis(),
      on: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getLatLng: jest.fn(() => ({ lat: 0, lng: 0 }))
    };
    return fakeMap;
  }),
  tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
  marker: jest.fn(() => createFakeMarker()),
  circle: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis()
  })),
  icon: jest.fn(options => options),
  popup: jest.fn(() => ({
    setLatLng: jest.fn(),
    setContent: jest.fn(),
    openOn: jest.fn()
  }))
};

// Dummy-Mock für Chart.js
global.Chart = class {
  constructor(ctx, config) {}
  destroy() {}
};
