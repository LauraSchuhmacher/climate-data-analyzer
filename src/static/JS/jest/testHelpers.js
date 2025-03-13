// Hilfsfunktionen für Tests

export const setupDOM = () => {
    document.body.innerHTML = `
      <select id="startYear"></select>
      <select id="endYear"></select>
      <input id="latitude" />
      <input id="longitude" />
      <input id="radius" />
      <input id="limit" />
      <select id="displayType"></select>
      <div id="search-results"></div>
      <div id="chart-container"></div>
      <div id="table-data"></div>
      <button id="searchButton"></button>
      <button id="evaluateButton"></button>
    `;
  };
  
  export const getContainers = () => ({
    stationsContainer: document.getElementById('search-results'),
    chartContainer: document.getElementById('chart-container'),
    tableDataContainer: document.getElementById('table-data')
  });
  