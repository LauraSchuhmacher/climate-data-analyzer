import { jest } from '@jest/globals';
import { initializeMap, createStationMarker, highlightMarker, updateUserPosition } from '../map.js';

describe('map.js', () => {
  // Alle Mocks vor jedem Test zurücksetzen
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeMap', () => {
    it('should initialize map with correct settings and set click event listener', () => {
      const { map } = initializeMap();
      const initialLat = 52.5162;
      const initialLon = 13.3777;
      const initialZoom = 5;

      expect(L.map).toHaveBeenCalledWith('map');
      expect(map.setView).toHaveBeenCalledWith([initialLat, initialLon], initialZoom);
      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({ attribution: expect.any(String) })
      );
      expect(L.marker).toHaveBeenCalledWith([initialLat, initialLon]);
      expect(L.circle).toHaveBeenCalledWith(
        [initialLat, initialLon],
        expect.objectContaining({
          radius: 80000,
          color: 'blue',
          fillColor: 'blue',
          fillOpacity: 0.2,
        })
      );
      expect(map.on).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('createStationMarker', () => {
    it('should create a station marker and bind a popup', () => {
      const fakeMap = {};
      const station = {
        latitude: 52.5162,
        longitude: 13.3777,
        name: 'Test Station',
        mindate: '2020-01-01',
        maxdate: '2025-01-01',
      };
      const iconPath = 'path/to/icon.png';

      const marker = createStationMarker(fakeMap, station, iconPath);

      expect(L.marker).toHaveBeenCalledWith(
        [station.latitude, station.longitude],
        expect.objectContaining({ icon: expect.any(Object) })
      );
      expect(marker.addTo).toHaveBeenCalledWith(fakeMap);
      expect(marker.bindPopup).toHaveBeenCalledWith(expect.stringContaining(station.name));
    });
  });

  describe('highlightMarker', () => {
    it('should highlight a marker and update map view', () => {
      const fakeMap = { setView: jest.fn() };
      const fakeMarker = {
        setIcon: jest.fn(),
        getLatLng: jest.fn().mockReturnValue({ lat: 52.5162, lng: 13.3777 }),
      };
      const normalIconPath = 'path/to/normal-icon.png';
      const selectedIconPath = 'path/to/selected-icon.png';

      highlightMarker(fakeMap, fakeMarker, normalIconPath, selectedIconPath);

      expect(L.icon).toHaveBeenCalledWith(expect.objectContaining({ iconUrl: selectedIconPath }));
      expect(fakeMarker.setIcon).toHaveBeenCalledWith(expect.objectContaining({ iconUrl: selectedIconPath }));
      expect(fakeMap.setView).toHaveBeenCalledWith({ lat: 52.5162, lng: 13.3777 }, 9);
    });
  });

  describe('updateUserPosition', () => {
    it('should update the user position and radius circle', () => {
      const fakeMap = { removeLayer: jest.fn(), addLayer: jest.fn() };
      const oldUserMarker = { remove: jest.fn() };
      const oldRadiusCircle = { remove: jest.fn() };
      const lat = 52.5200;
      const lon = 13.4050;
      const radius = 2;

      const { userMarker, radiusCircle } = updateUserPosition(
        fakeMap,
        lat,
        lon,
        oldUserMarker,
        oldRadiusCircle,
        radius
      );

      expect(fakeMap.removeLayer).toHaveBeenCalledWith(oldUserMarker);
      expect(fakeMap.removeLayer).toHaveBeenCalledWith(oldRadiusCircle);
      expect(L.marker).toHaveBeenCalledWith([lat, lon]);
      expect(L.circle).toHaveBeenCalledWith(
        [lat, lon],
        expect.objectContaining({ radius: radius * 1000 })
      );
      expect(userMarker.addTo).toHaveBeenCalledWith(fakeMap);
      expect(radiusCircle.addTo).toHaveBeenCalledWith(fakeMap);
    });
  });
});