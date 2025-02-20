const startYear = 1850;
const endYear = 2024;
const startYearSelect = document.getElementById('startYear');
const endYearSelect = document.getElementById('endYear');

// Funktion zum Befüllen der Optionen
function populateYearOptions() {
    // Zuerst die Select-Elemente leeren
    startYearSelect.innerHTML = '';
    endYearSelect.innerHTML = '';

    for (let year = startYear; year <= endYear; year++) {
        // Startjahr-Option erstellen
        let startOption = document.createElement('option');
        startOption.value = year;
        startOption.textContent = year;
        startYearSelect.appendChild(startOption);

        // Endjahr-Option erstellen
        let endOption = document.createElement('option');
        endOption.value = year;
        endOption.textContent = year;
        endYearSelect.appendChild(endOption);
    }
    
    // Standardwert für Endjahr auf 2024 setzen
    endYearSelect.value = 2024;
}

// Event-Listener für das Startjahr
startYearSelect.addEventListener('change', function() {
    let selectedStartYear = parseInt(startYearSelect.value);

    // Endjahr-Optionen aktualisieren, sodass nur Jahre nach dem Startjahr angezeigt werden
    for (let option of endYearSelect.options) {
        if (parseInt(option.value) < selectedStartYear) {
            option.disabled = true;  // Jahre vor dem Startjahr deaktivieren
        } else {
            option.disabled = false;  // Jahre nach dem Startjahr aktivieren
        }
    }
});

// Event-Listener für das Endjahr
endYearSelect.addEventListener('change', function() {
    let selectedEndYear = parseInt(endYearSelect.value);

    // Startjahr-Optionen aktualisieren, sodass nur Jahre vor dem Endjahr angezeigt werden
    for (let option of startYearSelect.options) {
        if (parseInt(option.value) > selectedEndYear) {
            option.disabled = true;  // Jahre nach dem Endjahr deaktivieren
        } else {
            option.disabled = false;  // Jahre vor dem Endjahr aktivieren
        }
    }
});

// Initiale Auswahlmöglichkeiten
populateYearOptions();

// Setze Standardwerte für Start- und Endjahr
startYearSelect.value = 1850;
endYearSelect.value = 2024;

// Begrenze Eingabewert von Max. Anzahl Stationen auf 10
document.getElementById('limit').addEventListener('input', function() {
    if (parseInt(this.value) > 10) {
      this.value = 10;
    }
  });


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

        const tableContainer = document.querySelector('.table-data');
        const chartContainer = document.getElementById('chart-container');

        tableContainer.innerHTML = '';
        chartContainer.innerHTML = '';

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (displayType === 'graphic') {
            renderChart(data);
            chartContainer.style.height = '400px'; // Höhe setzen, wenn das Diagramm aktiv ist
        } else {
            chartContainer.style.height = '0px'; // Höhe auf 0 setzen, wenn nur Tabelle sichtbar ist
        }

        if (displayType === 'table') {
            renderTable(data);
        }

        if (displayType === 'both') {
            renderTable(data);
            renderChart(data);
            chartContainer.style.height = '400px';
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
    
    // Standardmäßig nur TMAX & TMIN anzeigen
    const datasets = [
        { label: 'TMAX', data: data.map(entry => entry.tmax), borderColor: 'red', fill: false },
        { label: 'TMIN', data: data.map(entry => entry.tmin), borderColor: 'blue', fill: false },
        { label: 'Frühling TMAX', data: data.map(entry => entry.spring_tmax || null), borderColor: 'SeaGreen', fill: false, hidden: true },
        { label: 'Frühling TMIN', data: data.map(entry => entry.spring_tmin || null), borderColor: 'LimeGreen', fill: false, hidden: true },
        { label: 'Sommer TMAX', data: data.map(entry => entry.summer_tmax || null), borderColor: 'DarkOrange', fill: false, hidden: true },
        { label: 'Sommer TMIN', data: data.map(entry => entry.summer_tmin || null), borderColor: 'Orange', fill: false, hidden: true },
        { label: 'Herbst TMAX', data: data.map(entry => entry.fall_tmax || null), borderColor: 'Chocolate', fill: false, hidden: true },
        { label: 'Herbst TMIN', data: data.map(entry => entry.fall_tmin || null), borderColor: 'Peru', fill: false, hidden: true },
        { label: 'Winter TMAX', data: data.map(entry => entry.winter_tmax || null), borderColor: 'DarkViolet', fill: false, hidden: true },
        { label: 'Winter TMIN', data: data.map(entry => entry.winter_tmin || null), borderColor: 'Purple', fill: false, hidden: true }
    ];
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'years' // X-Achse beschriften
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '°C' // Y-Achse mit Grad Celsius beschriften
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' °C'; // Zusätzliche Anzeige von °C bei den Y-Achsenwerten
                        }
                    }
                }
            }
        }
    });
}

// zeige alle Werte mit einer Nachkommastelle an
function formatFloat(value) {
    return Number.isInteger(value) ? value.toFixed(1) : value;
}

function renderTable(data) {
    let tableHtml = `<table>
        <thead>
            <tr>
                <th>Jahr</th><th>TMAX</th><th>TMIN</th><th>Frühling TMAX</th><th>Frühling TMIN</th>
                <th>Sommer TMAX</th><th>Sommer TMIN</th><th>Herbst TMAX</th><th>Herbst TMIN</th>
                <th>Winter TMAX</th><th>Winter TMIN</th>
            </tr>
        </thead>
        <tbody>`;
    
    data.forEach(entry => {
        tableHtml += `<tr>
            <td>${entry.year}</td>
            <td>${formatFloat(entry.tmax)}</td>
            <td>${formatFloat(entry.tmin)}</td>
            <td>${entry.spring_tmax !== undefined ? formatFloat(entry.spring_tmax) : '-'}</td>
            <td>${entry.spring_tmin !== undefined ? formatFloat(entry.spring_tmin) : '-'}</td>
            <td>${entry.summer_tmax !== undefined ? formatFloat(entry.summer_tmax) : '-'}</td>
            <td>${entry.summer_tmin !== undefined ? formatFloat(entry.summer_tmin) : '-'}</td>
            <td>${entry.fall_tmax !== undefined ? formatFloat(entry.fall_tmax) : '-'}</td>
            <td>${entry.fall_tmin !== undefined ? formatFloat(entry.fall_tmin) : '-'}</td>
            <td>${entry.winter_tmax !== undefined ? formatFloat(entry.winter_tmax) : '-'}</td>
            <td>${entry.winter_tmin !== undefined ? formatFloat(entry.winter_tmin) : '-'}</td>
        </tr>`;
    });

    tableHtml += `</tbody></table>`;
    document.querySelector('.table-data').innerHTML = tableHtml;
}

function toggleMap() {
    if (!selectedStationId) return;
    let mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block';
}