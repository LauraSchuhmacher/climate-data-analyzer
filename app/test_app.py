from app import haversine, get_stations_within_radius, parse_station_data, fetch_station_data, calculate_averages
  
def test_haversine():
    assert round(haversine(0, 0, 0, 0), 2) == 0.0
    assert round(haversine(0, 0, 0, 1), 2) == 111.19
    assert round(haversine(48.8566, 2.3522, 51.5074, -0.1278), 2) == 343.56

def test_get_stations_within_radius():
    # Test: Stationen im Umkreis von Villingen-Schwenningen und korrektem Jahr
    result  = get_stations_within_radius(48.0528, 8.4858, 100, 10, 1990, 2024)
    expected_stations = ([
        {"id": "GME00129634", "latitude": 48.0458, "longitude": 8.4617, "elevation": 720.0, "state": None, "name": "VILLINGEN-SCHWENNINGEN", "mindate": 1947, "maxdate": 2025, "distance": 1.9532123487652326}, 
        {"id": "GME00128002", "latitude": 48.1819, "longitude": 8.6358, "elevation": 588.0, "state": None, "name": "ROTTWEIL", "mindate": 1957, "maxdate": 2025, "distance": 18.167706450006673}, 
        {"id": "GMM00010818", "latitude": 48.1064, "longitude": 8.7556, "elevation": 973.0, "state": None, "name": "KLIPPENECK", "mindate": 1947, "maxdate": 2025, "distance": 20.91054688910625}, 
        {"id": "GME00121714", "latitude": 48.2019, "longitude": 8.1094, "elevation": 440.0, "state": None, "name": "ELZACH-FISNACHT", "mindate": 1987, "maxdate": 2025, "distance": 32.485527925551835}, 
        {"id": "GME00130486", "latitude": 48.2958, "longitude": 8.24, "elevation": 291.0, "state": None, "name": "WOLFACH", "mindate": 1958, "maxdate": 2025, "distance": 32.59305088507141}, 
        {"id": "GME00132346", "latitude": 47.9631, "longitude": 7.9989, "elevation": 445.0, "state": None, "name": "BUCHENBACH", "mindate": 1990, "maxdate": 2025, "distance": 37.56979583004074}, 
        {"id": "GME00120934", "latitude": 47.8756, "longitude": 8.0044, "elevation": 1490.0, "state": None, "name": "FELDBERG/SCHWARZWALD", "mindate": 1936, "maxdate": 2025, "distance": 40.9016125704772}, 
        {"id": "GME00130618", "latitude": 47.6789, "longitude": 8.3806, "elevation": 398.0, "state": None, "name": "WUTOSCHINGEN-OFTERINGEN", "mindate": 1961, "maxdate": 2025, "distance": 42.309927137557736}, 
        {"id": "GME00120946", "latitude": 48.4544, "longitude": 8.41, "elevation": 797.0, "state": None, "name": "FREUDENSTADT", "mindate": 1949, "maxdate": 2025, "distance": 45.00713506907184}, 
        {"id": "GME00122458", "latitude": 48.0242, "longitude": 7.8353, "elevation": 236.0, "state": None, "name": "FREIBURG", "mindate": 1881, "maxdate": 2025, "distance": 48.46792357502696}
        ], 200)
    assert result == expected_stations

    # Test: Keine Stationen aufgrund falscher Jahreszahlen
    assert get_stations_within_radius(48.0528, 8.4858, 100, 10, 1763, 2024) == ([], 200)

    # Test: Kein Treffer, da keine Stationen in der Nähe
    assert get_stations_within_radius(16, 8, 100, 10, 2010, 2024) == ([], 200)

    # Edge cases
    assert len(get_stations_within_radius(48.0528, 8.4858, 0, 10, 1900, 2023)) == len(([], 200)) # Radius 0
    assert len(get_stations_within_radius(48.0528, 8.4858, 40.030, 0, 1900, 2023)) == len(([], 200)) # Limit 0

def test_parse_station_data():
    test_data = """
        ID,DATE,ELEMENT,DATA_VALUE,M_FLAG,Q_FLAG,S_FLAG,OBS_TIME
        IV000005555,19450101,TMAX,334,,,I,
        IV000005555,19450102,TMAX,328,,,I,
        IV000005555,19450104,TMAX,326,,,I,
        IV000005555,19460101,TMAX,335,,,I,
        IV000005555,19460102,TMAX,336,,,I,
        IV000005555,19470101,TMAX,318,,,I,
        IV000005555,19470102,TMAX,338,,,I,
        IV000005555,19500101,TMAX,341,,,I,
        IV000005555,19500102,TMAX,338,,,I,
        IV000005555,19510101,TMAX,360,,,I,
        IV000005555,19520101,TMAX,343,,,I,
        IV000005555,19520201,TMAX,347,,,I,
        IV000005555,19450101,TMIN,204,,,I,
        IV000005555,19450102,TMIN,204,,,I,
        IV000005555,19520101,TMIN,170,,,I,
        """

    expected_result_1946_1947 = {
        "results": [
            {"date": "19460101", "datatype": "TMAX", "value": 335},
            {"date": "19460102", "datatype": "TMAX", "value": 336},
            {"date": "19470101", "datatype": "TMAX", "value": 318},
            {"date": "19470102", "datatype": "TMAX", "value": 338},
        ]
    }

    expected_result_all = {
        "results": [
            {"date": "19450101", "datatype": "TMAX", "value": 334},
            {"date": "19450102", "datatype": "TMAX", "value": 328},
            {"date": "19450104", "datatype": "TMAX", "value": 326},
            {"date": "19460101", "datatype": "TMAX", "value": 335},
            {"date": "19460102", "datatype": "TMAX", "value": 336},
            {"date": "19470101", "datatype": "TMAX", "value": 318},
            {"date": "19470102", "datatype": "TMAX", "value": 338},
            {"date": "19500101", "datatype": "TMAX", "value": 341},
            {"date": "19500102", "datatype": "TMAX", "value": 338},
            {"date": "19510101", "datatype": "TMAX", "value": 360},
            {"date": "19520101", "datatype": "TMAX", "value": 343},
            {"date": "19520201", "datatype": "TMAX", "value": 347},
            {"date": "19450101", "datatype": "TMIN", "value": 204},
            {"date": "19450102", "datatype": "TMIN", "value": 204},
            {"date": "19520101", "datatype": "TMIN", "value": 170},
        ]
    }
    # Test: Eingeschränkung durch Jahreszahl
    assert parse_station_data(test_data, 1946, 1947) == expected_result_1946_1947
  
    # Test: Keine Einschränkung
    assert parse_station_data(test_data, 1945, 1952) == expected_result_all
    # Test: Keine Werte in diesem Jahr (Datenlücke)
    assert parse_station_data(test_data, 1948, 1948) == {"results":[]}


def test_fetch_station_data():
    assert len(fetch_station_data("GME00120934", 2000, 2010)) != 0

def test_calculate_averages():
    sample_data = {"results": [{"date": "20000102", "datatype": "TMAX", "value": -20},
                    {"date": "20000222", "datatype": "TMAX", "value": -50},
                    {"date": "20000312", "datatype": "TMAX", "value": 150},
                    {"date": "20000402", "datatype": "TMAX", "value": 175},
                    {"date": "20000502", "datatype": "TMAX", "value": 205},
                    {"date": "20000602", "datatype": "TMAX", "value": 215},
                    {"date": "20000702", "datatype": "TMAX", "value": 315},
                    {"date": "20000822", "datatype": "TMAX", "value": 350},
                    {"date": "20000912", "datatype": "TMAX", "value": 315},
                    {"date": "20001002", "datatype": "TMAX", "value": 170},
                    {"date": "20001102", "datatype": "TMAX", "value": 105},
                    {"date": "20001202", "datatype": "TMAX", "value": 0},
                    {"date": "20000122", "datatype": "TMIN", "value": 0},
                    {"date": "20000312", "datatype": "TMIN", "value": 100},
                    {"date": "20001222", "datatype": "TMIN", "value": -50},
                    {"date": "20001229", "datatype": "TMIN", "value": -100},
                    {"date": "20010110", "datatype": "TMAX", "value": -40},
                    {"date": "20010115", "datatype": "TMIN", "value": -30},
                    {"date": "20010205", "datatype": "TMAX", "value": -20},
                    {"date": "20010210", "datatype": "TMIN", "value": -25},
                    {"date": "20010310", "datatype": "TMAX", "value": 100},
                    {"date": "20010315", "datatype": "TMIN", "value": 50},
                    {"date": "20010410", "datatype": "TMAX", "value": 180},
                    {"date": "20010420", "datatype": "TMIN", "value": 80},
                    {"date": "20010505", "datatype": "TMAX", "value": 210},
                    {"date": "20010515", "datatype": "TMIN", "value": 100},
                    {"date": "20010610", "datatype": "TMAX", "value": 250},
                    {"date": "20010615", "datatype": "TMIN", "value": 150},
                    {"date": "20010710", "datatype": "TMAX", "value": 310},
                    {"date": "20010720", "datatype": "TMIN", "value": 180},
                    {"date": "20010810", "datatype": "TMAX", "value": 320},
                    {"date": "20010815", "datatype": "TMIN", "value": 190},
                    {"date": "20011205", "datatype": "TMAX", "value": 10},
                    {"date": "20011210", "datatype": "TMIN", "value": -20},
                    {"date": "20011220", "datatype": "TMAX", "value": -5},
                    {"date": "20011230", "datatype": "TMIN", "value": -15}]
                }

    expected_result = [
    {
        "year": 2000,
        "tmax": 16.1, "tmin": -1.2,
        "spring_tmax": 17.7, "spring_tmin": 10.0,
        "summer_tmax": 29.3, "summer_tmin": None,
        "fall_tmax": 19.7, "fall_tmin": None,
        "winter_tmax": -3.5, "winter_tmin": 0.0
    },
    {
        "year": 2001,
        "tmax": 13.2, "tmin": 6.6,  
        "spring_tmax": 16.3, "spring_tmin": 7.7,  
        "summer_tmax": 29.3, "summer_tmin": 17.3,  
        "fall_tmax": None, "fall_tmin": None,  
        "winter_tmax": -2.0, "winter_tmin": -5.1  
    }
]

    result = calculate_averages(sample_data)
    assert len(result) > 0
    assert result == expected_result
  

if __name__ == "__main__":
    test_haversine()
    test_get_stations_within_radius()
    test_fetch_station_data()
    test_parse_station_data()
    test_calculate_averages()



