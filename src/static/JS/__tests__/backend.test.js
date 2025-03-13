import { fetchStations, fetchStationData, fetchData } from '../backend.js';
import fetchMock from 'jest-fetch-mock';

describe('backend.js', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  it('fetchData: should fetch data successfully', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }));
    const url = 'https://api.example.com/data';
    const errorMessage = 'Fehler beim Abrufen der Daten';

    const data = await fetchData(url, errorMessage);

    expect(fetchMock).toHaveBeenCalledWith(url);
    expect(data).toEqual({ message: 'Success' });
  });

  it('fetchData: should handle fetch failure', async () => {
    fetchMock.mockRejectOnce(new Error('Fetch failed'));
    const url = 'https://api.example.com/data';
    const errorMessage = 'Fehler beim Abrufen der Daten';

    await expect(fetchData(url, errorMessage)).rejects.toThrow('Fetch failed');
  });

  it('fetchStations: should fetch stations data successfully', async () => {
    const lat = 50, lon = 10, radius = 100, limit = 5, startYear = 2000, endYear = 2020;
    const mockResponse = { stations: ['Station 1', 'Station 2'] };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
    const result = await fetchStations(lat, lon, radius, limit, startYear, endYear);
    const expectedUrl = `/stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`;

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual(mockResponse);
  });

  it('fetchStations: should handle failure', async () => {
    const lat = 50, lon = 10, radius = 100, limit = 5, startYear = 2000, endYear = 2020;
    fetchMock.mockRejectOnce(new Error('Fetch failed'));

    await expect(fetchStations(lat, lon, radius, limit, startYear, endYear))
      .rejects.toThrow('Fetch failed');
  });

  it('fetchStationData: should fetch station data successfully', async () => {
    const stationId = '1234', startYear = 2000, endYear = 2020;
    const mockResponse = { stationId: '1234', data: ['data1', 'data2'] };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
    const result = await fetchStationData(stationId, startYear, endYear);
    const expectedUrl = `/station-data/${stationId}/${startYear}/${endYear}`;

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual(mockResponse);
  });

  it('fetchStationData: should handle failure', async () => {
    const stationId = '1234', startYear = 2000, endYear = 2020;
    fetchMock.mockRejectOnce(new Error('Fetch failed'));

    await expect(fetchStationData(stationId, startYear, endYear))
      .rejects.toThrow('Fetch failed');
  });
});
