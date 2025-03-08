// backend.js
// ======================================================
// Dieses Modul enthält Funktionen zum Abrufen von Daten über die API.
// ======================================================

/**
 * Generische Funktion, um Daten von einer URL abzurufen.
 * @param {string} url - Die URL, von der die Daten abgerufen werden.
 * @param {string} errorMessage - Fehlermeldung, falls der Abruf fehlschlägt.
 * @returns {Promise<Object>} Promise, das die JSON-Daten liefert.
 */
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
  
  /**
   * Ruft die Stationsdaten basierend auf den übergebenen Parametern ab.
   * @param {number} lat - Breitengrad
   * @param {number} lon - Längengrad
   * @param {number} radius - Suchradius
   * @param {number} limit - Maximale Anzahl der Stationen
   * @param {number} startYear - Startjahr
   * @param {number} endYear - Endjahr
   * @returns {Promise<Object>} Promise, das die Stationsdaten liefert.
   */
  export const fetchStations = (lat, lon, radius, limit, startYear, endYear) => {
    const url = `/stations-within-radius/${lat}/${lon}/${radius}/${limit}/${startYear}/${endYear}`;
    return fetchData(url, "Fehler beim Abrufen der Stationsdaten:");
  };
  
  /**
   * Ruft die Daten für eine ausgewählte Station ab.
   * @param {string} stationId - ID der Station
   * @param {number} startYear - Startjahr
   * @param {number} endYear - Endjahr
   * @returns {Promise<Object>} Promise, das die Stationsdaten liefert.
   */
  export const fetchStationData = (stationId, startYear, endYear) => {
    const url = `/station-data/${stationId}/${startYear}/${endYear}`;
    return fetchData(url, "Fehler beim Abrufen der Stationsdaten:");
  };
  