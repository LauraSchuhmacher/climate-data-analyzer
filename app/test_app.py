# from app import haversine
# from app import get_stations_within_radius
# #import pytest

# def test_haversine():
#     assert round(haversine(0, 0, 0, 0), 2) == 0.0
#     assert round(haversine(0, 0, 0, 1), 2) == 111.19
#     assert round(haversine(48.8566, 2.3522, 51.5074, -0.1278), 2) == 343.37


#     #Rio de Janeiro
#     assert len(get_stations_within_radius(-22.9068, -43.1729, 5000, 5)) == [{"id": "BR000047734", "latitude": -22.8751, "longitude": -43.2775, "elevation": 3.0, "state": None, "name": "RIO DE JANEIRO", "mindate": "1910-01-01", "maxdate": "2023-12-31"},
#     {"id": "BR000008220", "latitude": -23.5505, "longitude": -46.6333, "elevation": 760.0, "state": None, "name": "SAO PAULO", "mindate": "1888-01-01", "maxdate": "2023-12-31"},
#     {"id": "AR000087182", "latitude": -34.6037, "longitude": -58.3816, "elevation": 25.0, "state": None, "name": "BUENOS AIRES", "mindate": "1900-01-01", "maxdate": "2023-12-31"},
#     {"id": "CL000085185", "latitude": -33.4489, "longitude": -70.6693, "elevation": 520.0, "state": None, "name": "SANTIAGO", "mindate": "1911-01-01", "maxdate": "2023-12-31"},
#     ] 
    
#     #Null Island
#     assert len(get_stations_within_radius(0, 0, 10000,2)) == [{"id": "GH000061188", "latitude": 5.6037, "longitude": -0.1870, "elevation": 61.0, "state": None, "name": "ACCRA", "mindate": "1921-01-01", "maxdate": "2023-12-31"},
#     {"id": "NG000061189", "latitude": 6.5244, "longitude": 3.3792, "elevation": 41.0, "state": None, "name": "LAGOS", "mindate": "1912-01-01", "maxdate": "2023-12-31"},
#     {"id": "CD000061190", "latitude": -4.4419, "longitude": 15.2663, "elevation": 312.0, "state": None, "name": "KINSHASA", "mindate": "1925-01-01", "maxdate": "2023-12-31"},
#     ]

#     #Nortpole
#     assert len(get_stations_within_radius(90.0, 0, 5000, 10)) == [{"id": "SJ000060188", "latitude": 78.2232, "longitude": 15.6267, "elevation": 50.0, "state": None, "name": "LONGYEARBYEN", "mindate": "1910-01-01", "maxdate": "2023-12-31"},
#     {"id": "RU000028111", "latitude": 68.9585, "longitude": 33.0827, "elevation": 35.0, "state": None, "name": "MURMANSK", "mindate": "1885-01-01", "maxdate": "2023-12-31"},
#     ] 

#     #Southpole
#     assert len(get_stations_within_radius(-90.0, 0, 5000, 4)) == [{"id": "AQ000890000", "latitude": -89.99, "longitude": 0.00, "elevation": 2835.0, "state": None, "name": "AMUNDSEN-SCOTT", "mindate": "1957-01-01", "maxdate": "2023-12-31"},
#     {"id": "AQ000890100", "latitude": -77.8463, "longitude": 166.6683, "elevation": 34.0, "state": None, "name": "MCMURDO", "mindate": "1955-01-01", "maxdate": "2023-12-31"},
#     {"id": "AQ000890200", "latitude": -64.7743, "longitude": -64.0537, "elevation": 10.0, "state": None, "name": "PALMER STATION", "mindate": "1965-01-01", "maxdate": "2023-12-31"},
#     ]

#     assert len(get_stations_within_radius(48.0528, 8.4858, 0, 10)) == 0 #Radius 0
#     assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 0)) == 0 #Limit 0
#     assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 100000)) == 128025 #show all
    


from app import haversine, get_stations_within_radius, parse_station_data, fetch_station_data, calculate_averages
  

def test_haversine():
    assert round(haversine(0, 0, 0, 0), 2) == 0.0
    assert round(haversine(0, 0, 0, 1), 2) == 111.19
    assert round(haversine(48.8566, 2.3522, 51.5074, -0.1278), 2) == 343.56

def test_get_stations_within_radius():
#Villingen-Schwenningen
   assert get_stations_within_radius(48.0528, 8.4858, 100, 10,1985,1990) == ([{'id': 'GME00129634', 'latitude': 48.0458, 'longitude': 8.4617, 'elevation': 720.0, 'state': None, 'name': 'VILLINGEN-SCHWENNINGEN', 'mindate': 1947, 'maxdate': 2025, 'distance': 1.9532123487652326}, 
    {'id': 'GME00121330', 'latitude': 47.9431, 'longitude': 8.5056, 'elevation': 677.0, 'state': None, 'name': 'DONAUESCHINGEN', 'mindate': 1951, 'maxdate': 2004, 'distance': 12.286729467282333}, 
    {'id': 'GME00128002', 'latitude': 48.1819, 'longitude': 8.6358, 'elevation': 588.0, 'state': None, 'name': 'ROTTWEIL', 'mindate': 1957, 'maxdate': 2025, 'distance': 18.167706450006673}, 
    {'id': 'GMM00010818', 'latitude': 48.1064, 'longitude': 8.7556, 'elevation': 973.0, 'state': None, 'name': 'KLIPPENECK', 'mindate': 1947, 'maxdate': 2025, 'distance': 20.91054688910625}, 
    {'id': 'GME00129514', 'latitude': 47.9558, 'longitude': 8.7575, 'elevation': 675.0, 'state': None, 'name': 'TUTTLINGEN-MOHRINGEN', 'mindate': 1981, 'maxdate': 1990, 'distance': 22.9114635045984}, 
    {'id': 'GME00129310', 'latitude': 47.9403, 'longitude': 8.1942, 'elevation': 870.0, 'state': None, 'name': 'TITISEE-NEUSTADT-LANGENORDNACH', 'mindate': 1948, 'maxdate': 1995, 'distance': 25.045398321781075}, 
    {'id': 'GME00126898', 'latitude': 48.3156, 'longitude': 8.5742, 'elevation': 480.0, 'state': None, 'name': 'OBERNDORF/NECKAR-AISTAIG', 'mindate': 1982, 'maxdate': 2004, 'distance': 29.94793205313095}, 
    {'id': 'GME00130486', 'latitude': 48.2958, 'longitude': 8.24, 'elevation': 291.0, 'state': None, 'name': 'WOLFACH', 'mindate': 1958, 'maxdate': 2025, 'distance': 32.59305088507141}, 
    {'id': 'GME00126502', 'latitude': 47.9767, 'longitude': 8.9108, 'elevation': 793.0, 'state': None, 'name': 'NEUHAUSEN OB ECK', 'mindate': 1981, 'maxdate': 1993, 'distance': 32.7255149544775}, 
    {'id': 'GME00129034', 'latitude': 47.9878, 'longitude': 7.9475, 'elevation': 363.0, 'state': None, 'name': 'STEGEN', 'mindate': 1985, 'maxdate': 1990, 'distance': 40.68295666974966}],200)
   

def test_get_stations_within_radius():
    # Villingen-Schwenningen
    # expected_stations_villingen = [
    # {'id': 'GME00129634', 'latitude': 48.0458, 'longitude': 8.4617, 'elevation': 720.0, 'state': None, 'name': 'VILLINGEN-SCHWENNINGEN', 'mindate': 1947, 'maxdate': 2025, 'distance': 1.9532123487652326}, 
    # {'id': 'GME00121330', 'latitude': 47.9431, 'longitude': 8.5056, 'elevation': 677.0, 'state': None, 'name': 'DONAUESCHINGEN', 'mindate': 1951, 'maxdate': 2004, 'distance': 12.286729467282333}, 
    # {'id': 'GME00128002', 'latitude': 48.1819, 'longitude': 8.6358, 'elevation': 588.0, 'state': None, 'name': 'ROTTWEIL', 'mindate': 1957, 'maxdate': 2025, 'distance': 18.167706450006673}, 
    # {'id': 'GMM00010818', 'latitude': 48.1064, 'longitude': 8.7556, 'elevation': 973.0, 'state': None, 'name': 'KLIPPENECK', 'mindate': 1947, 'maxdate': 2025, 'distance': 20.91054688910625}, 
    # {'id': 'GME00129514', 'latitude': 47.9558, 'longitude': 8.7575, 'elevation': 675.0, 'state': None, 'name': 'TUTTLINGEN-MOHRINGEN', 'mindate': 1981, 'maxdate': 1990, 'distance': 22.9114635045984}, 
    # {'id': 'GME00129310', 'latitude': 47.9403, 'longitude': 8.1942, 'elevation': 870.0, 'state': None, 'name': 'TITISEE-NEUSTADT-LANGENORDNACH', 'mindate': 1948, 'maxdate': 1995, 'distance': 25.045398321781075}, 
    # {'id': 'GME00126898', 'latitude': 48.3156, 'longitude': 8.5742, 'elevation': 480.0, 'state': None, 'name': 'OBERNDORF/NECKAR-AISTAIG', 'mindate': 1982, 'maxdate': 2004, 'distance': 29.94793205313095}, 
    # {'id': 'GME00130486', 'latitude': 48.2958, 'longitude': 8.24, 'elevation': 291.0, 'state': None, 'name': 'WOLFACH', 'mindate': 1958, 'maxdate': 2025, 'distance': 32.59305088507141}, 
    # {'id': 'GME00126502', 'latitude': 47.9767, 'longitude': 8.9108, 'elevation': 793.0, 'state': None, 'name': 'NEUHAUSEN OB ECK', 'mindate': 1981, 'maxdate': 1993, 'distance': 32.7255149544775}, 
    # {'id': 'GME00129034', 'latitude': 47.9878, 'longitude': 7.9475, 'elevation': 363.0, 'state': None, 'name': 'STEGEN', 'mindate': 1985, 'maxdate': 1990, 'distance': 40.68295666974966}
    # ]
    # actual_stations_villingen, _ = get_stations_within_radius(48.0528, 8.4858, 100, 10, 1985, 1990)
    # actual_stations_villingen_relevant = ([
    #     {key: station[key] for key in ["id", "latitude", "longitude", "elevation", "state", "name", "mindate", "maxdate"]}
    #     for station in actual_stations_villingen
    # ],200)
    # assert actual_stations_villingen_relevant == expected_stations_villingen

    # # Rio de Janeiro
    # expected_stations_rio = [
    #     {"id": "BR000047734", "latitude": -22.8751, "longitude": -43.2775, "elevation": 3.0, "state": None, "name": "RIO DE JANEIRO", "mindate": 1910, "maxdate": 2023},
    #     {"id": "BR000008220", "latitude": -23.5505, "longitude": -46.6333, "elevation": 760.0, "state": None, "name": "SAO PAULO", "mindate": 1888, "maxdate": 2023},
    #     {"id": "AR000087182", "latitude": -34.6037, "longitude": -58.3816, "elevation": 25.0, "state": None, "name": "BUENOS AIRES", "mindate": 1900, "maxdate": 2023},
    #     {"id": "CL000085185", "latitude": -33.4489, "longitude": -70.6693, "elevation": 520.0, "state": None, "name": "SANTIAGO", "mindate": 1911, "maxdate": 2023},
    # ]
    # actual_stations_rio, _ = get_stations_within_radius(-22.9068, -43.1729, 5000, 5, 1900, 2023)
    # actual_stations_rio_relevant = [
    #     {key: station[key] for key in ["id", "latitude", "longitude", "elevation", "state", "name", "mindate", "maxdate"]}
    #     for station in actual_stations_rio
    # ]
    # assert actual_stations_rio_relevant == expected_stations_rio

    # # Null Island
    # expected_stations_null_island = [
    #     {"id": "GH000061188", "latitude": 5.6037, "longitude": -0.1870, "elevation": 61.0, "state": None, "name": "ACCRA", "mindate": 1921, "maxdate": 2023},
    #     {"id": "NG000061189", "latitude": 6.5244, "longitude": 3.3792, "elevation": 41.0, "state": None, "name": "LAGOS", "mindate": 1912, "maxdate": 2023},
    #     {"id": "CD000061190", "latitude": -4.4419, "longitude": 15.2663, "elevation": 312.0, "state": None, "name": "KINSHASA", "mindate": 1925, "maxdate": 2023},
    # ]
    # actual_stations_null_island, _ = get_stations_within_radius(0, 0, 10000, 2, 1900, 2023)
    # actual_stations_null_island_relevant = [
    #     {key: station[key] for key in ["id", "latitude", "longitude", "elevation", "state", "name", "mindate", "maxdate"]}
    #     for station in actual_stations_null_island
    # ]
    # assert actual_stations_null_island_relevant == expected_stations_null_island

    # # North Pole
    # expected_stations_north_pole = [
    #     {"id": "SJ000060188", "latitude": 78.2232, "longitude": 15.6267, "elevation": 50.0, "state": None, "name": "LONGYEARBYEN", "mindate": 1910, "maxdate": 2023},
    #     {"id": "RU000028111", "latitude": 68.9585, "longitude": 33.0827, "elevation": 35.0, "state": None, "name": "MURMANSK", "mindate": 1885, "maxdate": 2023},
    # ]
    # actual_stations_north_pole, _ = get_stations_within_radius(90.0, 0, 5000, 10, 1900, 2023)
    # actual_stations_north_pole_relevant = [
    #     {key: station[key] for key in ["id", "latitude", "longitude", "elevation", "state", "name", "mindate", "maxdate"]}
    #     for station in actual_stations_north_pole
    # ]
    # assert actual_stations_north_pole_relevant == expected_stations_north_pole

    # # South Pole
    # expected_stations_south_pole = [
    #     {"id": "AQ000890000", "latitude": -89.99, "longitude": 0.00, "elevation": 2835.0, "state": None, "name": "AMUNDSEN-SCOTT", "mindate": 1957, "maxdate": 2023},
    #     {"id": "AQ000890100", "latitude": -77.8463, "longitude": 166.6683, "elevation": 34.0, "state": None, "name": "MCMURDO", "mindate": 1955, "maxdate": 2023},
    #     {"id": "AQ000890200", "latitude": -64.7743, "longitude": -64.0537, "elevation": 10.0, "state": None, "name": "PALMER STATION", "mindate": 1965, "maxdate": 2023},
    # ]
    # actual_stations_south_pole, _ = get_stations_within_radius(-90.0, 0, 5000, 4, 1900, 2023)
    # actual_stations_south_pole_relevant = [
    #     {key: station[key] for key in ["id", "latitude", "longitude", "elevation", "state", "name", "mindate", "maxdate"]}
    #     for station in actual_stations_south_pole
    # ]
    #assert actual_stations_south_pole_relevant == expected_stations_south_pole

    # Edge cases
    assert len(get_stations_within_radius(48.0528, 8.4858, 0, 10, 1900, 2023)) == len(([], 200)) # Radius 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 0, 1900, 2023)) == len(([], 200)) # Limit 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 100000, 1900, 2023)) == len(([], 200)) # Show all

#def test_parse_station_data():
    #normal
    
    #leere Werte
    #keine Werte

def test_fetch_station_data():
    assert fetch_station_data("GME00120934", 2000, 2010) == 0
    
#def test_calculate_averages():
  

if __name__ == "__main__":
    test_haversine()
    test_get_stations_within_radius()
    test_fetch_station_data()

