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
  
  export const setDummyContentForContainers = () => {
    const { stationsContainer, chartContainer, tableDataContainer } = getContainers();
    stationsContainer.innerHTML = '<div>Dummy Station Content</div>';
    stationsContainer.style.display = 'block';
    chartContainer.innerHTML = 'dummy chart';
    chartContainer.style.display = 'block';
    tableDataContainer.innerHTML = 'dummy table';
    tableDataContainer.style.display = 'block';
  };
  

export const setRequiredFieldsForSearchStationHandler = () => {
  document.getElementById('latitude').value = '52';
  document.getElementById('longitude').value = '13';
  document.getElementById('radius').value = '80';
  document.getElementById('limit').value = '10';
  const startYearSelect = document.getElementById('startYear');
  const endYearSelect = document.getElementById('endYear');
  startYearSelect.innerHTML = '<option value="2020">2020</option>';
  endYearSelect.innerHTML = '<option value="2024">2024</option>';
  startYearSelect.value = '2020';
  endYearSelect.value = '2024';
};

export const setRequiredFieldsForEvaluateStationHandler = () => {
document.getElementById('latitude').value = '52';
document.getElementById('longitude').value = '13';
document.getElementById('radius').value = '80';
document.getElementById('limit').value = '10';
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');
startYearSelect.innerHTML = '<option value="2020">2020</option>';
endYearSelect.innerHTML = '<option value="2024">2024</option>';
startYearSelect.value = '2020';
endYearSelect.value = '2024';
};

export const setDummyDataForDisplayStations = () => {
  return [
    { id: 'GME001', name: 'Station1', latitude: 52, longitude: 13, mindate: 2000, maxdate: 2024, distance: 1.5 },
    { id: 'GME002', name: 'Station2', latitude: 53, longitude: 14, mindate: 2010, maxdate: 2023, distance: 2.0 }
  ];
}

export const setDummyDataForRenderDisplay = () => {
  return [
    {
      year: 2000,
      tmax: 10,
      tmin: 5,
      spring_tmax: 11,
      spring_tmin: 6,
      summer_tmax: 15,
      summer_tmin: 10,
      fall_tmax: 12,
      fall_tmin: 8,
      winter_tmax: 9,
      winter_tmin: 4
    }
  ];
}