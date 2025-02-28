from app import haversine
from app import get_stations_within_radius
#import pytest

def test_haversine():
    assert round(haversine(0, 0, 0, 0), 2) == 0.0
    assert round(haversine(0, 0, 0, 1), 2) == 111.19
    assert round(haversine(48.8566, 2.3522, 51.5074, -0.1278), 2) == 343.37

def test_get_stations_within_radius():
    assert get_stations_within_radius(48.0528, 8.4858, 10000, 10) == [{
        "id": "GM000010000", "name": "ZUGSPITZE", "latitude": 47.4211, "longitude": 10.9854, "distance": 100},
    {"id": "GM000004000", "name": "MUENCHEN", "latitude": 48.1391, "longitude": 11.5802, "distance": 150},
    {"id": "GM000002195", "name": "STUTTGART", "latitude": 48.833, "longitude": 9.2, "distance": 80},
    {"id": "GM000002600", "name": "FRANKFURT", "latitude": 50.033, "longitude": 8.57, "distance": 200},
    {"id": "FR000007150", "name": "PARIS", "latitude": 48.8566, "longitude": 2.3522, "distance": 500},
    {"id": "IT000016036", "name": "ROMA", "latitude": 41.9028, "longitude": 12.4964, "distance": 900},
    {"id": "ES000082055", "name": "MADRID", "latitude": 40.4168, "longitude": -3.7038, "distance": 1400},
    {"id": "RU000028279", "name": "MOSKAU", "latitude": 55.7558, "longitude": 37.6173, "distance": 2100},
    {"id": "EG000062100", "name": "KAIRO", "latitude": 30.0444, "longitude": 31.2357, "distance": 2900},
    {"id": "US000007001", "name": "NEW YORK CITY", "latitude": 40.7128, "longitude": -74.0060, "distance": 6500}] #VS

    #Rio de Janeiro
    assert len(get_stations_within_radius(-22.9068, -43.1729, 5000, 5)) == [{"id": "BR000047734", "name": "RIO DE JANEIRO", "latitude": -22.8751, "longitude": -43.2775, "distance": 10},
    {"id": "BR000047735", "name": "SANTA CRUZ", "latitude": -22.9201, "longitude": -43.6885, "distance": 50},
    {"id": "BR000008220", "name": "SAO PAULO", "latitude": -23.5505, "longitude": -46.6333, "distance": 350},
    {"id": "BR000008019", "name": "BELO HORIZONTE", "latitude": -19.9208, "longitude": -43.9378, "distance": 450},
    {"id": "AR000087182", "name": "BUENOS AIRES", "latitude": -34.6037, "longitude": -58.3816, "distance": 2000}] 
    
    #Null Island
    assert len(get_stations_within_radius(0, 0, 10000,2)) == [{"id": "GH000061188", "name": "ACCRA", "latitude": 5.6037, "longitude": -0.1870, "distance": 600},
    {"id": "NG000061189", "name": "LAGOS", "latitude": 6.5244, "longitude": 3.3792, "distance": 800}]

    #Nortpole
    assert len(get_stations_within_radius(90.0, 0, 5000, 10)) == [{"id": "SJ000060188", "name": "LONGYEARBYEN", "latitude": 78.2232, "longitude": 15.6267, "distance": 1300},
    {"id": "RU000028111", "name": "MURMANSK", "latitude": 68.9585, "longitude": 33.0827, "distance": 2300},
    {"id": "CA000007003", "name": "EDMONTON", "latitude": 53.5461, "longitude": -113.4938, "distance": 4800}] 

    #Southpole
    assert len(get_stations_within_radius(-90.0, 0, 5000, 4)) == [{"id": "AQ000890000", "name": "AMUNDSEN-SCOTT", "latitude": -89.99, "longitude": 0.00, "distance": 1},
    {"id": "AQ000890100", "name": "MCMURDO", "latitude": -77.8463, "longitude": 166.6683, "distance": 1400},
    {"id": "AQ000890200", "name": "PALMER STATION", "latitude": -64.7743, "longitude": -64.0537, "distance": 2900}]

    assert len(get_stations_within_radius(48.0528, 8.4858, 0, 10)) == 0 #Radius 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 0)) == 0 #Limit 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 100000)) == 128025 #show all
    

