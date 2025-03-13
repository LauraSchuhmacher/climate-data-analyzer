import { jest } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';

jest.spyOn(console, 'error').mockImplementation(() => {});

fetchMock.enableMocks();
global.fetch = fetchMock;

global.alert = jest.fn();

global.L = {
  map: jest.fn(() => {
    const fakeMap = {};
    fakeMap.setView = jest.fn().mockReturnValue(fakeMap);
    fakeMap.on = jest.fn();
    fakeMap.addLayer = jest.fn();
    fakeMap.removeLayer = jest.fn();
    fakeMap.getLatLng = jest.fn(() => ({ lat: 0, lng: 0 }));
    return fakeMap;
  }),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => {
    const fakeMarker = {};
    fakeMarker.addTo = jest.fn().mockReturnValue(fakeMarker);
    fakeMarker.bindPopup = jest.fn();
    fakeMarker.setIcon = jest.fn();
    fakeMarker.getLatLng = jest.fn(() => ({ lat: 0, lng: 0 }));
    return fakeMarker;
  }),
  circle: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  icon: jest.fn(() => ({})),
  popup: jest.fn(() => ({
    setLatLng: jest.fn(),
    setContent: jest.fn(),
    openOn: jest.fn(),
  })),
};
