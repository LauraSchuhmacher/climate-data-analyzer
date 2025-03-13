import { fetchStations, fetchStationData, fetchData } from '../backend.js';
import fetchMock from 'jest-fetch-mock'

describe('backend.js Tests', () => {

  beforeEach(() => {
    // Mock zurücksetzen, sodass Tets unabhängig voneinander sind
    fetchMock.enableMocks();
  });

  describe('backend.js Tests', () => {
    beforeEach(() => {
      fetchMock.resetMocks(); // Setzt Mock-Calls vor jedem Test zurück
    });

  it('should fetch data successfully from API', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' })); // Mock für fetch-Antwort

    const url = 'https://api.example.com/data';
    const errorMessage = 'Fehler beim Abrufen der Daten';

    const data = await fetchData(url, errorMessage);

    expect(fetchMock).toHaveBeenCalledWith(url); // Überprüfen ob fetch mit richtiger URL aufgerufen wurde
    expect(data).toEqual({ message: 'Success' });
  });

  it('should handle fetch failure', async () => {
    fetchMock.mockRejectOnce(new Error('Fetch failed')); // Simuliere Fehler bei fetch

    const url = 'https://api.example.com/data';
    const errorMessage = 'Fehler beim Abrufen der Daten';

    await expect(fetchData(url, errorMessage)).rejects.toThrow('Fetch failed');
  });

  it('should fetch stations data successfully', async () => {
    const lat = 50;
    const lon = 10;
    const radius = 100;
    const limit = 5;
    const startYear = 2000;
    const endYear = 2020;

    const mockResponse = { stations: ['Station 1', 'Station 2'] };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await fetchStations(lat, lon, radius, limit, startYear, endYear);

    const expectedUrl = `/stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`;

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual(mockResponse);
  });

  it('should handle failure when fetching stations data', async () => {
    const lat = 50;
    const lon = 10;
    const radius = 100;
    const limit = 5;
    const startYear = 2000;
    const endYear = 2020;

    fetchMock.mockRejectOnce(new Error('Fetch failed'));

    await expect(fetchStations(lat, lon, radius, limit, startYear, endYear))
      .rejects
      .toThrow('Fetch failed');
  });

  it('should fetch data for a station successfully', async () => {
    const stationId = '1234';
    const startYear = 2000;
    const endYear = 2020;

    const mockResponse = { stationId: '1234', data: ['data1', 'data2'] };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await fetchStationData(stationId, startYear, endYear);

    const expectedUrl = `/station-data/${stationId}/${startYear}/${endYear}`;

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual(mockResponse);
  });

  it('should handle failure when fetching station data', async () => {
    const stationId = '1234';
    const startYear = 2000;
    const endYear = 2020;

    fetchMock.mockRejectOnce(new Error('Fetch failed'));

    await expect(fetchStationData(stationId, startYear, endYear))
      .rejects
      .toThrow('Fetch failed');
  });

});
});
