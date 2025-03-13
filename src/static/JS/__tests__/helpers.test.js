import { jest } from '@jest/globals';
import { 
    validateRequiredFields,
    preventInputValues,
    setupInputLimits,
    populateYearOptions,
    updateYearOptions,
    createCanvas,
    generateChartDatasets,
    chartOptions,
    formatFloat,
    swapSeasonsForSouthernHemisphere
  } from '../helpers';
  
  global.CanvasRenderingContext2D = class CanvasRenderingContext2D {};
  HTMLCanvasElement.prototype.getContext = function () {
    return new CanvasRenderingContext2D();
  };
  

  describe('helpers.js Tests', () => {
    
    beforeEach(() => {
      // DOM zurücksetzen
      document.body.innerHTML = `
        <input id="longitude" />
        <input id="latitude" />
        <input id="radius" />
        <input id="limit" />
        <select id="startYear"></select>
        <select id="endYear"></select>
        <div id="chart-container"></div>
      `;
    });
  
    it('should validate required fields', () => {
      const longitudeInput = document.getElementById('longitude');
      const latitudeInput = document.getElementById('latitude');
      const radiusInput = document.getElementById('radius');
      const limitInput = document.getElementById('limit');
  
      longitudeInput.value = '50';
      latitudeInput.value = '10';
      radiusInput.value = '5';
      limitInput.value = '2';
  
      expect(validateRequiredFields()).toBe(true);
  
      limitInput.value = ''; 
  
      expect(validateRequiredFields()).toBe(false);
    });
  
    it('should prevent invalid input for limit and radius', () => {
      const limitInput = document.getElementById('limit');
      
      const mockEvent = (key) => {
        return { 
          key, 
          target: limitInput,
          preventDefault: jest.fn() 
        };
      };

      // Test: dass keine Buchstaben eingegeben werden dürfen
      const event = mockEvent('a');
      preventInputValues(event);
      expect(event.preventDefault).toHaveBeenCalled();
  
      // Test: dass Zahlen eingegeben werden dürfen
      const validEvent = mockEvent('1');
      preventInputValues(validEvent);
      expect(validEvent.preventDefault).not.toHaveBeenCalled();
  });
  
  it('should limit input values for longitude, latitude, limit, and radius', () => {
    // Zuerst die Event-Listener registrieren
    setupInputLimits();
  
    const longitudeInput = document.getElementById('longitude');
    const latitudeInput = document.getElementById('latitude');
    const limitInput = document.getElementById('limit');
    const radiusInput = document.getElementById('radius');
    
    // Longitudes zwischen -180 und 180
    longitudeInput.value = '200';
    longitudeInput.dispatchEvent(new Event('input'));
    let longitudeValue = Number(longitudeInput.value);
    expect(longitudeValue).toBeLessThanOrEqual(180);
  
    longitudeInput.value = '-200';
    longitudeInput.dispatchEvent(new Event('input'));
    longitudeValue = Number(longitudeInput.value);
    expect(longitudeValue).toBeGreaterThanOrEqual(-180);
  
    // Latitude zwischen -90 und 90
    latitudeInput.value = '100';
    latitudeInput.dispatchEvent(new Event('input'));
    let latitudeValue = Number(latitudeInput.value);
    expect(latitudeValue).toBeLessThanOrEqual(90);
     
    latitudeInput.value = '-100';
    latitudeInput.dispatchEvent(new Event('input'));
    latitudeValue = Number(latitudeInput.value);
    expect(latitudeValue).toBeGreaterThanOrEqual(-90);
    
    // Limit zwischen 1 und 10
    limitInput.value = '11';
    limitInput.dispatchEvent(new Event('input'));
    let limitValue = Number(limitInput.value);
    expect(limitValue).toBeLessThanOrEqual(10);
    
    limitInput.value = '0';
    limitInput.dispatchEvent(new Event('input'));
    limitValue = Number(limitInput.value);
    expect(limitValue).toBeGreaterThanOrEqual(1);
    
    // Radius zwischen 1 und 100
    radiusInput.value = '110';
    radiusInput.dispatchEvent(new Event('input'));
    let radiusValue = Number(radiusInput.value);
    expect(radiusValue).toBeLessThanOrEqual(100);
    
    radiusInput.value = '0';
    radiusInput.dispatchEvent(new Event('input'));
    radiusValue = Number(radiusInput.value);
    expect(radiusValue).toBeGreaterThanOrEqual(1);
  });
  
  
    it('should populate year options for startYear and endYear', () => {
      populateYearOptions();
      const startYearSelect = document.getElementById('startYear');
      const endYearSelect = document.getElementById('endYear');
  
      expect(startYearSelect.options.length).toBe(262); // 2024 - 1763 + 1 = 262 Optionen
      expect(endYearSelect.options.length).toBe(262);
      expect(endYearSelect.value).toBe('2024');
    });
  
    it('should disable future years for startYear and past years for endYear', () => {
      const startYearSelect = document.getElementById('startYear');
      const endYearSelect = document.getElementById('endYear');
  
      updateYearOptions(2000, startYearSelect, 'start');
      updateYearOptions(2000, endYearSelect, 'end');
      
      for (let option of startYearSelect.options) {
        if (parseInt(option.value) > 2000) {
          expect(option.disabled).toBe(true);
        } else {
          expect(option.disabled).toBe(false);
        }
      }
      
      for (let option of endYearSelect.options) {
        if (parseInt(option.value) < 2000) {
          expect(option.disabled).toBe(true);
        } else {
          expect(option.disabled).toBe(false);
        }
      }
    });

    // Test für createCanvas
    it('should create a canvas element', () => {
      const ctx = createCanvas('chart-container');
      const canvas = document.querySelector('canvas');
      
      expect(canvas).not.toBeNull();
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
    });
  
    it('should generate correct chart datasets', () => {
      const data = [
        { tmax: 20, tmin: 10, spring_tmax: null, spring_tmin: 0.0, summer_tmax: 30, summer_tmin: 20, fall_tmax: 22, fall_tmin: 12, winter_tmax: 10, winter_tmin: 0 }
      ];
      
      const datasets = generateChartDatasets(data);
      expect(datasets.length).toBe(10);
      expect(datasets[0].label).toBe('TMAX');
      expect(datasets[0].data).toEqual([20]);

      expect(datasets[2].label).toBe('Frühling TMAX');
      expect(datasets[2].data).toBeNull;

      expect(datasets[3].label).toBe('Frühling TMIN');
      expect(datasets[3].data).toEqual([0]);
    });
  
    it('should return the correct chart options', () => {
      const options = chartOptions();
      expect(options).toHaveProperty('responsive');
      expect(options.scales.x.title.text).toBe('years');
      expect(options.scales.y.title.text).toBe('°C');
    });

    it('should format float values correctly', () => {
      expect(formatFloat(10)).toBe('10.0');
      expect(formatFloat(10.5)).toBe(10.5);
      expect(formatFloat(null)).toBe('-');
      expect(formatFloat(undefined)).toBe('-');
    });
  
    it('should swap seasons for southern hemisphere', () => {
      const data = [
        { spring_tmax: 25, spring_tmin: 15, summer_tmax: 30, summer_tmin: 20, fall_tmax: 22, fall_tmin: 12, winter_tmax: 10, winter_tmin: 0 }
      ];
      
      const swappedData = swapSeasonsForSouthernHemisphere(data);
      expect(swappedData[0].spring_tmax).toBe(22);
      expect(swappedData[0].spring_tmin).toBe(12);
      expect(swappedData[0].fall_tmax).toBe(25);
      expect(swappedData[0].fall_tmin).toBe(15);
      expect(swappedData[0].summer_tmax).toBe(10);
      expect(swappedData[0].summer_tmin).toBe(0);
      expect(swappedData[0].winter_tmax).toBe(30);
      expect(swappedData[0].winter_tmin).toBe(20);
    });
  
  });
  