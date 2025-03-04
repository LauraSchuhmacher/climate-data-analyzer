from app import haversine
from app import get_stations_within_radius
#import pytest

def test_haversine():
    assert round(haversine(0, 0, 0, 0), 2) == 0.0
    assert round(haversine(0, 0, 0, 1), 2) == 111.19
    assert round(haversine(48.8566, 2.3522, 51.5074, -0.1278), 2) == 343.37

def test_get_stations_within_radius():
    #Villingen-Schwenningen
    assert get_stations_within_radius(48.0528, 8.4858, 10000, 10) == [{"id": "GM000010000", "latitude": 47.4211, "longitude": 10.9854, "elevation": 2960.0, "state": None, "name": "ZUGSPITZE", "mindate": "1901-01-01", "maxdate": "2023-12-31"},
    {"id": "GM000004000", "latitude": 48.1391, "longitude": 11.5802, "elevation": 520.0, "state": None, "name": "MUENCHEN", "mindate": "1879-01-01", "maxdate": "2023-12-31"},
    {"id": "GM000002195", "latitude": 48.833, "longitude": 9.2, "elevation": 259.0, "state": None, "name": "STUTTGART", "mindate": "1878-01-01", "maxdate": "2023-12-31"},
    {"id": "GM000002600", "latitude": 50.033, "longitude": 8.57, "elevation": 112.0, "state": None, "name": "FRANKFURT", "mindate": "1876-01-01", "maxdate": "2023-12-31"},
    {"id": "FR000007150", "latitude": 48.8566, "longitude": 2.3522, "elevation": 75.0, "state": None, "name": "PARIS", "mindate": "1873-01-01", "maxdate": "2023-12-31"},
    {"id": "IT000016036", "latitude": 41.9028, "longitude": 12.4964, "elevation": 37.0, "state": None, "name": "ROMA", "mindate": "1871-01-01", "maxdate": "2023-12-31"},
    {"id": "ES000082055", "latitude": 40.4168, "longitude": -3.7038, "elevation": 667.0, "state": None, "name": "MADRID", "mindate": "1853-01-01", "maxdate": "2023-12-31"},
    {"id": "RU000028279", "latitude": 55.7558, "longitude": 37.6173, "elevation": 156.0, "state": None, "name": "MOSKAU", "mindate": "1879-01-01", "maxdate": "2023-12-31"},
    {"id": "EG000062100", "latitude": 30.0444, "longitude": 31.2357, "elevation": 23.0, "state": None, "name": "KAIRO", "mindate": "1901-01-01", "maxdate": "2023-12-31"},
    ]

    #Rio de Janeiro
    assert len(get_stations_within_radius(-22.9068, -43.1729, 5000, 5)) == [{"id": "BR000047734", "latitude": -22.8751, "longitude": -43.2775, "elevation": 3.0, "state": None, "name": "RIO DE JANEIRO", "mindate": "1910-01-01", "maxdate": "2023-12-31"},
    {"id": "BR000008220", "latitude": -23.5505, "longitude": -46.6333, "elevation": 760.0, "state": None, "name": "SAO PAULO", "mindate": "1888-01-01", "maxdate": "2023-12-31"},
    {"id": "AR000087182", "latitude": -34.6037, "longitude": -58.3816, "elevation": 25.0, "state": None, "name": "BUENOS AIRES", "mindate": "1900-01-01", "maxdate": "2023-12-31"},
    {"id": "CL000085185", "latitude": -33.4489, "longitude": -70.6693, "elevation": 520.0, "state": None, "name": "SANTIAGO", "mindate": "1911-01-01", "maxdate": "2023-12-31"},
    ] 
    
    #Null Island
    assert len(get_stations_within_radius(0, 0, 10000,2)) == [{"id": "GH000061188", "latitude": 5.6037, "longitude": -0.1870, "elevation": 61.0, "state": None, "name": "ACCRA", "mindate": "1921-01-01", "maxdate": "2023-12-31"},
    {"id": "NG000061189", "latitude": 6.5244, "longitude": 3.3792, "elevation": 41.0, "state": None, "name": "LAGOS", "mindate": "1912-01-01", "maxdate": "2023-12-31"},
    {"id": "CD000061190", "latitude": -4.4419, "longitude": 15.2663, "elevation": 312.0, "state": None, "name": "KINSHASA", "mindate": "1925-01-01", "maxdate": "2023-12-31"},
    ]

    #Nortpole
    assert len(get_stations_within_radius(90.0, 0, 5000, 10)) == [{"id": "SJ000060188", "latitude": 78.2232, "longitude": 15.6267, "elevation": 50.0, "state": None, "name": "LONGYEARBYEN", "mindate": "1910-01-01", "maxdate": "2023-12-31"},
    {"id": "RU000028111", "latitude": 68.9585, "longitude": 33.0827, "elevation": 35.0, "state": None, "name": "MURMANSK", "mindate": "1885-01-01", "maxdate": "2023-12-31"},
    ] 

    #Southpole
    assert len(get_stations_within_radius(-90.0, 0, 5000, 4)) == [{"id": "AQ000890000", "latitude": -89.99, "longitude": 0.00, "elevation": 2835.0, "state": None, "name": "AMUNDSEN-SCOTT", "mindate": "1957-01-01", "maxdate": "2023-12-31"},
    {"id": "AQ000890100", "latitude": -77.8463, "longitude": 166.6683, "elevation": 34.0, "state": None, "name": "MCMURDO", "mindate": "1955-01-01", "maxdate": "2023-12-31"},
    {"id": "AQ000890200", "latitude": -64.7743, "longitude": -64.0537, "elevation": 10.0, "state": None, "name": "PALMER STATION", "mindate": "1965-01-01", "maxdate": "2023-12-31"},
    ]

    assert len(get_stations_within_radius(48.0528, 8.4858, 0, 10)) == 0 #Radius 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 0)) == 0 #Limit 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 100000)) == 128025 #show all
    
    

