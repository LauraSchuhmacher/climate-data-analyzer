// backend.js

// Generische Funktion, um Daten von einer URL abzurufen.
const fetchData = async (url, errorMessage) => {
    try {
      console.log(`API URL: ${url}`);
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error(errorMessage, error);
      throw error;
    }
  };
  
  export const fetchStations = (lat, lon, radius, limit, startYear, endYear) => {
    const url = `/stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`;
    return fetchData(url, "Fehler beim Abrufen der Stationsdaten:");
  };
  
  export const fetchStationData = (stationId, startYear, endYear) => {
    const url = `/station-data/${stationId}/${startYear}/${endYear}`;
    return fetchData(url, "Fehler beim Abrufen der Stationsdaten:");
  };
  