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
      const longitudeInput = document.getElementById('longitude');
      const latitudeInput = document.getElementById('latitude');
      const limitInput = document.getElementById('limit');
      const radiusInput = document.getElementById('radius');
      
      // Longitudes zwischen -180 und 180
      longitudeInput.value = '100';
      const longitudeValue = Number(longitudeInput.value);
      setupInputLimits();
      expect(longitudeValue).toBeGreaterThanOrEqual(-180);
      expect(longitudeValue).toBeLessThanOrEqual(180);
 
      longitudeInput.value = '-100';
      setupInputLimits();
      expect(longitudeValue).toBeGreaterThanOrEqual(-180);
      expect(longitudeValue).toBeLessThanOrEqual(180);
 
      // Latitude zwischen -90 und 90
      latitudeInput.value = 35;
      const latitudeValue = Number(latitudeInput.value);
      setupInputLimits();
      expect(latitudeValue).toBeGreaterThanOrEqual(-90);
      expect(latitudeValue).toBeLessThanOrEqual(90);
   
      latitudeInput.value = -35;
      setupInputLimits();
      expect(latitudeValue).toBeGreaterThanOrEqual(-90);
      expect(latitudeValue).toBeLessThanOrEqual(90);
    
       // Limit zwischen 1 und 10
      limitInput.value = 5;
      const limitValue = Number(limitInput.value);
      setupInputLimits();
      expect(limitValue).toBeGreaterThanOrEqual(1);
      expect(limitValue).toBeLessThanOrEqual(10);
  
      //TODO: Elias was passiert wenn Stationenanzahl 0?
    //   limitInput.value = 0;
    //   setupInputLimits();
    //   expect(limitValue).toBe(0);
  
      // Radius zwischen 1 und 100
      radiusInput.value = 50;
      const radiusValue = Number(radiusInput.value);
      setupInputLimits();
      expect(radiusValue).toBeGreaterThanOrEqual(1);
      expect(radiusValue).toBeLessThanOrEqual(100);
      
      //TODO: Elias was passiert wenn Radius 0?
    //   radiusInput.value = 0;
    //   setupInputLimits();
    //   expect(radiusValue).toBe(0);
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

//TODO: müssen wir das testen??  
    // // Test für createCanvas
    // it('should create a canvas element', () => {
    //   const ctx = createCanvas('startYear');
    //   const canvas = document.querySelector('canvas');
      
    //   expect(canvas).not.toBeNull();
    //   expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
    // });
  
    it('should generate correct chart datasets', () => {
      const data = [
        { tmax: 20, tmin: 10, spring_tmax: 25, spring_tmin: 15, summer_tmax: 30, summer_tmin: 20, fall_tmax: 22, fall_tmin: 12, winter_tmax: 10, winter_tmin: 0 }
      ];
      
      const datasets = generateChartDatasets(data);
      expect(datasets.length).toBe(10);
      expect(datasets[0].label).toBe('TMAX');
      expect(datasets[0].data).toEqual([20]);
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
      expect(swappedData[0].fall_tmax).toBe(25);
      expect(swappedData[0].summer_tmax).toBe(10);
      expect(swappedData[0].winter_tmax).toBe(30);
    });
  
  });
  