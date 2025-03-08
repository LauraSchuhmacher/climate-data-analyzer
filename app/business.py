import datetime
import math
from external import read_data, write_data, fetch_stations, fetch_inventory_data, fetch_station_data

# Stationsliste aktualisieren
def update_stations():
    # Prüfe ob Stationsliste dieses Jahr schon abgerufen wurde.
    current_year = datetime.datetime.now().year
    data = read_data()
    last_update = data.get("last_update")

    if last_update and datetime.datetime.strptime(last_update, "%Y-%m-%d").year == current_year:
        return

    stations = fetch_and_parse(fetch_stations, parse_stations_data)
    stations_with_inventory = fetch_and_parse(fetch_inventory_data, parse_inventory_data, stations)

    stations_data = {
        "last_update": datetime.datetime.now().strftime("%Y-%m-%d"),
        "stations": stations_with_inventory
    }
    write_data(stations_data)

# Daten abrufen und parsen
def fetch_and_parse(fetch_func, parse_func, *args):
    response = fetch_func()
    if isinstance(response, tuple):
        error, status = response
        raise Exception(f"{error['message']} (Status: {status})")
    
    return parse_func(response.text, *args)

# Daten für alle Stationen abrufen
def parse_stations_data(stations_data):
    station_dict = {}
    lines = stations_data.splitlines()
    
    for line in lines:
        if len(line) < 85:
            continue  # Überspringe unvollständige Zeilen
        
        try:
            station = {
                "id": line[0:11].strip(),
                "latitude": float(line[12:20].strip()),
                "longitude": float(line[21:30].strip()),
                "elevation": float(line[31:37].strip()) if line[31:37].strip() != "" else None,
                "state": line[38:40].strip() if line[38:40].strip() != "" else None,
                "name": line[41:71].strip(),
                "mindate": None,
                "maxdate": None
            }
            station_dict[station["id"]] = station
        except (ValueError, IndexError):
            continue

    return station_dict

# Inventardaten für alle Stationen abrufen
def parse_inventory_data(inventory_data, station_dict):  
    lines = inventory_data.splitlines()
    
    for line in lines:
        if len(line) < 45:
            continue  # Überspringe unvollständige Zeilen
        
        try:
            station_id = line[0:11].strip()
            element = line[31:35].strip()
            first_year = int(line[36:40].strip()) if line[36:40].strip().isdigit() else None
            last_year = int(line[41:45].strip()) if line[41:45].strip().isdigit() else None
            
            if station_id in station_dict and element in ["TMAX", "TMIN"] and first_year and last_year:
                if station_dict[station_id]["mindate"] is None or first_year > station_dict[station_id]["mindate"]:
                    station_dict[station_id]["mindate"] = first_year
                if station_dict[station_id]["maxdate"] is None or last_year < station_dict[station_id]["maxdate"]:
                    station_dict[station_id]["maxdate"] = last_year
        except (ValueError, IndexError):
            continue
    filtered_stations = {station_id: station for station_id, station in station_dict.items() if station["mindate"] and station["maxdate"]}

    return list(filtered_stations.values())

# Stationen innerhalb eines Radius abrufen
def get_stations_within_radius(lat, lon, radius, limit, start_year, end_year):
    stations = read_data().get("stations", [])
    stations_with_distance = []
    
    for station in stations:
        if "latitude" in station and "longitude" in station and "mindate" in station and "maxdate" in station:
            distance = haversine(lat, lon, station["latitude"], station["longitude"])
            if distance <= radius:
                min_year = station["mindate"] if station["mindate"] else None
                max_year = station["maxdate"] if station["maxdate"] else None
                
                if min_year and max_year and min_year <= start_year and max_year >= end_year:
                    station["distance"] = distance  # Füge Entfernung zur Station hinzu
                    stations_with_distance.append(station)
    
    stations_sorted = sorted(stations_with_distance, key=lambda station: station["distance"])
    
    return stations_sorted[:limit], 200

# Haversine-Formel zur Berechnung der Entfernung zwischen zwei Koordinaten
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Daten einer Station abrufen
def get_station_data(station_id, start_year, end_year):
    parsed_station_data = fetch_and_parse(lambda: fetch_station_data(station_id), parse_station_data, start_year, end_year)
    yearly_monthly_averages = calculate_averages(parsed_station_data)

    return yearly_monthly_averages, 200

# Stationsdaten parsen
def parse_station_data(station_data, start_year, end_year):
    lines = station_data.splitlines()
    header = lines.pop(0).strip()  # Entferne die Kopfzeile

    station_data = {"results": []}

    for line in lines:
        try:
            line = line.strip()
            if not line:  
                continue  # Überspringe leere Zeilen

            parts = line.split(",")

            date = parts[1].strip()
            datatype = parts[2].strip()
            value = parts[3].strip()

            # Parse Jahr aus Datum
            try:
                year = int(date[:4])
            except ValueError:
                print(f"Invalid date format: {date}")
                continue

            if start_year <= year <= end_year:
                if datatype in {"TMAX", "TMIN"}:
                    station_data["results"].append({
                        "date": date,
                        "datatype": datatype,
                        "value": int(value) if value != "NA" else None,
                    })

        except Exception as e:
            print(f"Skipping line due to error: {e}, line: {line}")

    return station_data


# Durchschnittstemperaturen der einzelnen Jahre/Jahreszeiten berechnen
def calculate_averages(data):
    seasonal_months = {
        "spring": {3, 4, 5},
        "summer": {6, 7, 8},
        "fall": {9, 10, 11},
        "winter": {12, 1, 2},
    }

    year_data = {}

    for entry in data["results"]:
        try:
            date = datetime.datetime.strptime(entry["date"], "%Y%m%d")
            year = date.year
            month = date.month

            winter_year = year if month != 12 else year + 1

            datatype = entry.get("datatype")
            value = entry.get("value")

            if datatype not in {"TMAX", "TMIN"} or value is None:
                continue  # Überspringe Eintrag wenn kein TMAX oder TMIN Wert vorhanden ist.

            if year not in year_data:
                year_data[year] = {
                    "tmax": [], "tmin": [],
                    "seasons": {season: {"tmax": [], "tmin": []} for season in seasonal_months}
                }

            # Füge den Wert zur entsprechenden Liste hinzu
            if datatype == "TMAX":
                year_data[year]["tmax"].append(value)
            elif datatype == "TMIN":
                year_data[year]["tmin"].append(value)

            for season, months in seasonal_months.items():
                if month in months:
                    if season == "winter":
                        if winter_year not in year_data:
                            year_data[winter_year] = {
                                "tmax": [], "tmin": [],
                                "seasons": {season: {"tmax": [], "tmin": []} for season in seasonal_months}
                            }
                        if datatype == "TMAX":
                            year_data[winter_year]["seasons"]["winter"]["tmax"].append(value)
                        elif datatype == "TMIN":
                            year_data[winter_year]["seasons"]["winter"]["tmin"].append(value)
                    else:
                        if datatype == "TMAX":
                            year_data[year]["seasons"][season]["tmax"].append(value)
                        elif datatype == "TMIN":
                            year_data[year]["seasons"][season]["tmin"].append(value)
        except Exception as e:
            print(f"Skipping entry due to error: {e}, entry: {entry}")

    result = []
    for year, values in sorted(year_data.items()):
        yearly_tmax = round(sum(values["tmax"]) / len(values["tmax"]) / 10, 1) if values["tmax"] else None
        yearly_tmin = round(sum(values["tmin"]) / len(values["tmin"]) / 10, 1) if values["tmin"] else None
        season_averages = {}
        for season, temps in values["seasons"].items():
            season_averages[f"{season}_tmax"] = (round(sum(temps["tmax"]) / len(temps["tmax"]) / 10, 1) if temps["tmax"] else None)
            season_averages[f"{season}_tmin"] = (round(sum(temps["tmin"]) / len(temps["tmin"]) / 10, 1) if temps["tmin"] else None)

        result.append({"year": year, "tmax": yearly_tmax, "tmin": yearly_tmin, **season_averages})
    result.pop()  # Letztes Jahr entfernen. Es enthält unvollständige Daten.

    return result
