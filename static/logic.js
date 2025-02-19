console.log("Skript erweitert");

const startYear = 1850;
const endYear = new Date().getFullYear();
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');

for (let year = startYear; year <= endYear; year++) {
    let startOption = document.createElement('option');
    startOption.value = year;
    startOption.textContent = year;
    startYearSelect.appendChild(startOption);

    let endOption = document.createElement('option');
    endOption.value = year;
    endOption.textContent = year;
    endYearSelect.appendChild(endOption);
}

endYearSelect.value = new Date().getFullYear();

let selectedStationId = null;
let chartInstance = null;

// Event-Listener für Stationssuche
async function searchStations() {
    const latitude = parseFloat(document.getElementById('latitude').value).toFixed(2);
    const longitude = parseFloat(document.getElementById('longitude').value).toFixed(2);
    const radius = document.getElementById('radius').value;
    const limit = document.getElementById('limit').value;

    try {
        const response = await fetch(`/stations-within-radius/${latitude}/${longitude}/${radius}/${limit}`);
        const stations = await response.json();
        displayStations(stations);
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
    }
}

document.querySelector('.button').addEventListener('click', searchStations);

function displayStations(stations) {
    let tableHtml = `<table><thead><tr><th>ID</th><th>Name</th><th>Breite</th><th>Länge</th><th>Mindate</th><th>Maxdate</th></tr></thead><tbody>`;
    stations.forEach(station => {
        tableHtml += `<tr class="station-row" data-id="${station.id}"><td>${station.id}</td><td>${station.name}</td><td>${station.latitude}</td><td>${station.longitude}</td><td>${station.mindate}</td><td>${station.maxdate}</td></tr>`;
    });
    tableHtml += `</tbody></table>`;
    document.querySelector('.search-results').innerHTML = tableHtml;
    document.querySelectorAll('.station-row').forEach(row => {
        row.addEventListener('click', function () {
            document.querySelectorAll('.station-row').forEach(r => r.classList.remove('selected'));
            this.classList.add('selected');
            selectedStationId = this.getAttribute('data-id');
        });
    });
}

document.getElementById('evaluateButton').addEventListener('click', async () => {
    if (!selectedStationId) {
        alert("Bitte zuerst eine Station auswählen!");
        return;
    }

    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    const displayType = document.getElementById('displayType').value;

    try {
        const response = await fetch(`/station-data/${selectedStationId}/${startYear}/${endYear}`);
        const data = await response.json();

        if (displayType === 'graphic') {
            renderChart(data);
            toggleMap();
            document.querySelector('.table-data').innerHTML = '';
        }
        if (displayType === 'table') {
            renderTable(data);
            chartInstance.destroy();
            legendContainer.innerHTML = ''; // Container leeren
        }
        if (displayType === 'both') {
            renderTable(data);
            renderChart(data);
            toggleMap();
        }
    } catch (error) {
        console.error("Fehler beim Abrufen der Stationsdaten:", error);
    }
});

function renderChart(data) {
    // Leere den Container und erstelle ein neues Canvas
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = ''; // Container leeren
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'chart';
    chartContainer.appendChild(newCanvas);
    
    const ctx = newCanvas.getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const labels = data.map(entry => entry.year);
    const tmax = data.map(entry => entry.tmax);
    const tmin = data.map(entry => entry.tmin);
    
    // Immer alle Werte anzeigen
    const datasets = [
        { label: 'TMAX', data: tmax, borderColor: 'red', fill: false },
        { label: 'TMIN', data: tmin, borderColor: 'blue', fill: false },
        { label: 'Frühling TMAX', data: data.map(entry => entry.spring_tmax || null), borderColor: 'SeaGreen', fill: false },
        { label: 'Frühling TMIN', data: data.map(entry => entry.spring_tmin || null), borderColor: 'LimeGreen', fill: false },
        { label: 'Sommer TMAX', data: data.map(entry => entry.summer_tmax || null), borderColor: 'DarkOrange', fill: false },
        { label: 'Sommer TMIN', data: data.map(entry => entry.summer_tmin || null), borderColor: 'Orange', fill: false },
        { label: 'Herbst TMAX', data: data.map(entry => entry.fall_tmax || null), borderColor: 'Chocolate', fill: false },
        { label: 'Herbst TMIN', data: data.map(entry => entry.fall_tmin || null), borderColor: 'Peru', fill: false },
        { label: 'Winter TMAX', data: data.map(entry => entry.winter_tmax || null), borderColor: 'DarkViolet', fill: false },
        { label: 'Winter TMIN', data: data.map(entry => entry.winter_tmin || null), borderColor: 'Purple', fill: false }
    ];
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Erstelle die benutzerdefinierte Legende
    createCustomLegend(chartInstance);
}

function createCustomLegend(chart) {
    const legendContainer = document.getElementById('custom-legend');
    legendContainer.innerHTML = ''; // Container leeren

    chart.data.datasets.forEach((dataset, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = 'dataset-' + index;

        checkbox.addEventListener('change', function() {
            const meta = chart.getDatasetMeta(index);
            meta.hidden = !this.checked;
            chart.update();
        });

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.style.color = dataset.borderColor;
        label.textContent = dataset.label;

        const container = document.createElement('div');
        container.appendChild(checkbox);
        container.appendChild(label);
        legendContainer.appendChild(container);
    });
}


function renderTable(data) {
    let tableHtml = `<table><thead><tr><th>Jahr</th><th>TMAX</th><th>TMIN</th><th>Frühling TMAX</th><th>Frühling TMIN</th><th>Sommer TMAX</th><th>Sommer TMIN</th><th>Herbst TMAX</th><th>Herbst TMIN</th><th>Winter TMAX</th><th>Winter TMIN</th></tr></thead><tbody>`;
    data.forEach(entry => {
        tableHtml += `<tr><td>${entry.year}</td><td>${entry.tmax}</td><td>${entry.tmin}</td><td>${entry.spring_tmax || '-'} </td><td>${entry.spring_tmin || '-'}</td><td>${entry.summer_tmax || '-'}</td><td>${entry.summer_tmin || '-'}</td><td>${entry.fall_tmax || '-'}</td><td>${entry.fall_tmin || '-'}</td><td>${entry.winter_tmax || '-'}</td><td>${entry.winter_tmin || '-'}</td></tr>`;
    });
    tableHtml += `</tbody></table>`;
    document.querySelector('.table-data').innerHTML = tableHtml;
}

function toggleMap() {
    if (!selectedStationId) return;
    let mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block';
}