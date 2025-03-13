import { jest } from '@jest/globals';
import { initializeMap, createStationMarker, highlightMarker, updateUserPosition } from '../map.js';

describe('initializeMap', () => {
  let mockMap;

  beforeEach(() => {
    mockMap = {
      setView: jest.fn().mockReturnThis(),
      addLayer: jest.fn(),
      on: jest.fn(),
    };

    L.map = jest.fn(() => mockMap);
    L.tileLayer = jest.fn(() => ({ addTo: jest.fn() }));
    L.marker = jest.fn(() => ({ addTo: jest.fn() }));
    L.circle = jest.fn(() => ({ addTo: jest.fn() }));
  });

  it('should initialize map with correct settings', () => {
    const { map } = initializeMap();
    const initialLat = 52.5162;
    const initialLon = 13.3777;
    const initialZoom = 5;

    // Überprüfen ob Karte initialisiert wurde
    expect(L.map).toHaveBeenCalledWith('map');
    expect(mockMap.setView).toHaveBeenCalledWith([initialLat, initialLon], initialZoom);

    // Ob  TileLayer hinzugefügt wurde
    expect(L.tileLayer).toHaveBeenCalledWith(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({
        attribution: expect.any(String),
      })
    );

    // Ob User-Marker und Radius-Kreis hinzugefügt wurden
    expect(L.marker).toHaveBeenCalledWith([initialLat, initialLon]);
    expect(L.circle).toHaveBeenCalledWith([initialLat, initialLon],   expect.objectContaining({
      radius: 80000,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.2
    }));
  });

  it('should set click event listener for map', () => {
    initializeMap();
    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

describe('createStationMarker', () => {
  it('should create a station marker and bind a popup', () => {
    const mockMap = {
      addLayer: jest.fn(), 
    };
    const station = {
      latitude: 52.5162,
      longitude: 13.3777,
      name: 'Test Station',
      mindate: '2020-01-01',
      maxdate: '2025-01-01',
    };
    const iconPath = 'path/to/icon.png';
    const mockMarker = {
      bindPopup: jest.fn(),
      addTo: jest.fn().mockReturnThis(),
    };
    L.marker = jest.fn(() => mockMarker);

    const marker = createStationMarker(mockMap, station, iconPath);

    // Überprüfen ob Marker mit richtigen Parametern erstellt wurde
    expect(L.marker).toHaveBeenCalledWith([station.latitude, station.longitude], expect.objectContaining({
      icon: expect.any(Object),
    }));
    expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
    expect(marker.bindPopup).toHaveBeenCalledWith(expect.stringContaining(station.name));
    expect(marker).toBe(mockMarker);
  });
});

describe('highlightMarker', () => {
  it('should highlight a marker and update map view', () => {
    const mockMap = {
      setView: jest.fn(),
    };
    const mockMarker = {
      setIcon: jest.fn(),
      getLatLng: jest.fn().mockReturnValue({ lat: 52.5162, lng: 13.3777 }),
    };
    const normalIconPath = 'path/to/normal-icon.png';
    const selectedIconPath = 'path/to/selected-icon.png';

    // Mock für L.icon
    L.icon = jest.fn((options) => ({
      iconUrl: options.iconUrl,
      iconSize: options.iconSize || [30, 30],
      iconAnchor: options.iconAnchor || [15, 15],
      popupAnchor: options.popupAnchor || [0, -30],
    }));

    highlightMarker(mockMap, mockMarker, normalIconPath, selectedIconPath);

    expect(L.icon).toHaveBeenCalledWith(expect.objectContaining({ iconUrl: selectedIconPath }));

    expect(mockMarker.setIcon).toHaveBeenCalledWith(expect.objectContaining({ iconUrl: selectedIconPath }));

    // Überprüfen ob Karte korrekt zentriert wurde
    expect(mockMap.setView).toHaveBeenCalledWith({ lat: 52.5162, lng: 13.3777 }, 9);
  });
});

describe('updateUserPosition', () => {
  it('should update the user position and radius circle', () => {
    // Mock-Map mit den benötigten Methoden
    const mockMap = {
      removeLayer: jest.fn(),
      addLayer: jest.fn(),
    };

    const oldUserMarker = { remove: jest.fn() };
    const oldRadiusCircle = { remove: jest.fn() };
    const lat = 52.5200;
    const lon = 13.4050;
    const radius = 2; // 2 km

    // Mock für Leaflet-Methoden
    const mockUserMarker = { addTo: jest.fn() };
    const mockRadiusCircle = { addTo: jest.fn() };

    mockUserMarker.addTo.mockReturnValue(mockUserMarker);
    mockRadiusCircle.addTo.mockReturnValue(mockRadiusCircle);

    L.marker = jest.fn().mockReturnValue(mockUserMarker);
    L.circle = jest.fn().mockReturnValue(mockRadiusCircle);

    // Funktion aufrufen
    const { userMarker, radiusCircle } = updateUserPosition(mockMap, lat, lon, oldUserMarker, oldRadiusCircle, radius);

    // Überprüfen, ob alte Marker entfernt wurden
    expect(mockMap.removeLayer).toHaveBeenCalledWith(oldUserMarker);
    expect(mockMap.removeLayer).toHaveBeenCalledWith(oldRadiusCircle);

    // Überprüfen, ob neue Marker erstellt wurden
    expect(L.marker).toHaveBeenCalledWith([lat, lon]);
    expect(L.circle).toHaveBeenCalledWith([lat, lon], expect.objectContaining({ radius: 2000 }));
    
    // Überprüfen, ob die neuen Marker zur Karte hinzugefügt wurden
    expect(mockUserMarker.addTo).toHaveBeenCalledWith(mockMap);
    expect(mockRadiusCircle.addTo).toHaveBeenCalledWith(mockMap);

    // Überprüfen, ob die korrekten Marker und Kreise zurückgegeben wurden
    expect(userMarker).toBe(mockUserMarker);
    expect(radiusCircle).toBe(mockRadiusCircle);
  });
});