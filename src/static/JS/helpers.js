// helpers.js
// ======================================================
// Dieses Modul enthält Hilfsfunktionen für Validierung, 
// Input-Limits, Erzeugung von Canvas-Elementen, Chart-Optionen und Zahlformatierung.
// ======================================================

/**
 * Validiert, ob alle Pflichtfelder (Länge, Breite, Radius, Limit) ausgefüllt sind.
 * @returns {boolean} true, wenn alle Felder gefüllt sind, sonst false.
 */
export const validateRequiredFields = () => {
    const requiredFields = [
      document.getElementById('longitude'),
      document.getElementById('latitude'),
      document.getElementById('radius'),
      document.getElementById('limit')
    ];
    let isValid = true;
  
    requiredFields.forEach(field => {
      if (field.value.trim() === '') {
        field.classList.add('input-error');
        isValid = false;
      } else {
        field.classList.remove('input-error');
      }
    });
  
    if (!isValid) {
      alert("Bitte füllen Sie alle Pflichtfelder korrekt aus!");
    }
    return isValid;
  };
  
  /**
   * Unterbindet unerlaubte Tasteneingaben in den Input-Feldern.
   * @param {KeyboardEvent} e - Das Tastaturereignis.
   */
  export const preventInputValues = (e) => {
    const numberRegex = /^[0-9]$/;
    const floatRegex = /^-?[0-9]*[.,]?[0-9]*$/;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
  
    // Für Limit & Radius: Erlaube nur Ziffern
    if ((e.target.id === 'limit' || e.target.id === 'radius') &&
        !numberRegex.test(e.key) &&
        !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  
    // Für Länge & Breite: Erlaube Float-Werte
    if ((e.target.id === 'longitude' || e.target.id === 'latitude') &&
        !floatRegex.test(e.target.value + e.key) &&
        !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };
  
  /**
   * Setzt Eingabe-Limits für die Felder Länge, Breite, Limit und Radius.
   * Verhindert, dass Werte außerhalb des erlaubten Bereichs eingegeben werden.
   */
  export const setupInputLimits = () => {
    const longitude = document.getElementById('longitude');
    const latitude = document.getElementById('latitude');
    const limit = document.getElementById('limit');
    const radius = document.getElementById('radius');
  
    longitude.addEventListener('input', () => {
      if (longitude.value === '-' || longitude.value === '') return;
      const val = parseFloat(longitude.value);
      if (!isNaN(val)) {
        if (val > 180) {
          longitude.value = 180;
        } else if (val < -180) {
          longitude.value = -180;
        }
      }
    });
  
    latitude.addEventListener('input', () => {
      if (latitude.value === '-' || latitude.value === '') return;
      const val = parseFloat(latitude.value);
      if (!isNaN(val)) {
        if (val > 90) {
          latitude.value = 90;
        } else if (val < -90) {
          latitude.value = -90;
        }
      }
    });
  
    limit.addEventListener('input', () => {
      const val = parseInt(limit.value);
      if (!isNaN(val)) {
        if (val > 10) {
          limit.value = 10;
        } else if (val < 1) {
          limit.value = 1;
        }
      }
    });
  
    radius.addEventListener('input', () => {
      const val = parseInt(radius.value);
      if (!isNaN(val)) {
        if (val > 100) {
          radius.value = 100;
        } else if (val < 1) {
          radius.value = 1;
        }
      }
    });
  };
  
  /**
   * Füllt die Jahr-Auswahlfelder mit Werten von 1763 bis 2024.
   */
  export const populateYearOptions = () => {
    console.log("Befülle Zeitraum-Optionen");
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    const startYear = 1763, endYear = 2024;
    startYearSelect.innerHTML = '';
    endYearSelect.innerHTML = '';
    for (let year = startYear; year <= endYear; year++) {
      const optionStart = document.createElement('option');
      optionStart.value = year;
      optionStart.textContent = year;
      startYearSelect.appendChild(optionStart);
  
      const optionEnd = document.createElement('option');
      optionEnd.value = year;
      optionEnd.textContent = year;
      endYearSelect.appendChild(optionEnd);
    }
    endYearSelect.value = 2024;
  };
  
  /**
   * Aktualisiert die Optionen der Jahr-Auswahl basierend auf einer gegebenen Auswahl.
   * @param {number} year - Das Referenzjahr.
   * @param {HTMLSelectElement} select - Das zu aktualisierende Select-Element.
   * @param {string} type - 'start' oder 'end'
   */
  export const updateYearOptions = (year, select, type) => {
    for (let option of select.options) {
      const optionYear = parseInt(option.value);
      option.disabled = (type === 'start' && optionYear > year) || (type === 'end' && optionYear < year);
    }
  };
  
  /**
   * Erstellt ein Canvas-Element in einem angegebenen Container.
   * @param {string} containerId - Die ID des Containers.
   * @returns {CanvasRenderingContext2D} Den 2D-Kontext des Canvas.
   */
  export const createCanvas = (containerId) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    return canvas.getContext('2d');
  };
  
  /**
   * Generiert Chart-Datensätze (Datasets) aus den Daten für Chart.js.
   * @param {Array} data - Array von Datenobjekten.
   * @returns {Array} Array von Dataset-Objekten.
   */
  export const generateChartDatasets = (data) => [
    { label: 'TMAX', data: data.map(entry => entry.tmax), borderColor: 'red', fill: false },
    { label: 'TMIN', data: data.map(entry => entry.tmin), borderColor: 'blue', fill: false },
    { label: 'Frühling TMAX', data: data.map(entry => entry.spring_tmax ?? null), borderColor: 'SeaGreen', fill: false, hidden: true },
    { label: 'Frühling TMIN', data: data.map(entry => entry.spring_tmin ?? null), borderColor: 'LimeGreen', fill: false, hidden: true },
    { label: 'Sommer TMAX', data: data.map(entry => entry.summer_tmax ?? null), borderColor: 'DarkOrange', fill: false, hidden: true },
    { label: 'Sommer TMIN', data: data.map(entry => entry.summer_tmin ?? null), borderColor: 'Orange', fill: false, hidden: true },
    { label: 'Herbst TMAX', data: data.map(entry => entry.fall_tmax ?? null), borderColor: 'Chocolate', fill: false, hidden: true },
    { label: 'Herbst TMIN', data: data.map(entry => entry.fall_tmin ?? null), borderColor: 'Peru', fill: false, hidden: true },
    { label: 'Winter TMAX', data: data.map(entry => entry.winter_tmax ?? null), borderColor: 'DarkViolet', fill: false, hidden: true },
    { label: 'Winter TMIN', data: data.map(entry => entry.winter_tmin ?? null), borderColor: 'Purple', fill: false, hidden: true }
  ];
  
  /**
   * Gibt die Chart-Optionen für Chart.js zurück.
   * @returns {Object} Optionen für Chart.js.
   */
  export const chartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'years' }
      },
      y: {
        title: { display: true, text: '°C' },
        ticks: { callback: value => `${value} °C` }
      }
    }
  });
  
  /**
   * Formatiert Fließkommazahlen. Gibt "-" zurück, wenn der Wert null oder undefined ist.
   * @param {*} value - Die Zahl, die formatiert werden soll.
   * @returns {string} Formatierte Zahl als String.
   */
  export const formatFloat = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
    return Number.isInteger(value) ? value.toFixed(1) : value;
  };
  
  /**
   * Tauscht die Jahreszeiten für Daten aus der Südhalbkugel.
   * @param {Array} data - Array von Datenobjekten.
   * @returns {Array} Das modifizierte Datenarray.
   */
  export const swapSeasonsForSouthernHemisphere = (data) => {
    console.log("Jahreszeiten tauschen für Südhalbkugel");
    data.forEach(entry => {
      // Tausche Frühling und Herbst
      const tempSpringTmax = entry.spring_tmax;
      const tempSpringTmin = entry.spring_tmin;
      entry.spring_tmax = entry.fall_tmax;
      entry.spring_tmin = entry.fall_tmin;
      entry.fall_tmax = tempSpringTmax;
      entry.fall_tmin = tempSpringTmin;
  
      // Tausche Sommer und Winter
      const tempSummerTmax = entry.summer_tmax;
      const tempSummerTmin = entry.summer_tmin;
      entry.summer_tmax = entry.winter_tmax;
      entry.summer_tmin = entry.winter_tmin;
      entry.winter_tmax = tempSummerTmax;
      entry.winter_tmin = tempSummerTmin;
    });
    return data;
  };
  