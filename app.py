import json
import requests
import time
import datetime
import math
from flask import Flask, send_from_directory
from flask_restful import Api, Resource

app = Flask(__name__, static_folder="static")
api = Api(app)

STATIONS_FILE = "stations.json"

DATA_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station"
STATIONS_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt"
INVENTORY_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-inventory.txt"

@app.route("/")
def serve_frontend():
    return send_from_directory("static", "Index.html")

# Daten aus der JSON-Datei lesen
def read_data(file_path):
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

# Daten in die JSON-Datei schreiben
def write_data(file_path, data):
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)

# Alle Stationen abrufen
def fetch_stations(station_url):
    response = requests.get(station_url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch station data: {response.status_code}")
    
    station_dict = {}
    lines = response.text.splitlines()
    
    for line in lines:
        if len(line) < 85:
            continue  # Überspringe unvollständige Zeilen
        
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
    
    return station_dict

# Inventardaten für alle Stationen abrufen
def fetch_inventory_data(inventory_url, station_dict):
    response = requests.get(inventory_url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch inventory data: {response.status_code}")
    
    lines = response.text.splitlines()
    
    for line in lines:
        if len(line) < 45:
            continue  # Überspringe unvollständige Zeilens
        
        station_id = line[0:11].strip()
        element = line[31:35].strip()
        first_year = int(line[36:40].strip()) if line[36:40].strip().isdigit() else None
        last_year = int(line[41:45].strip()) if line[41:45].strip().isdigit() else None
        
        if station_id in station_dict and element in ["TMAX", "TMIN"] and first_year and last_year:
            if station_dict[station_id]["mindate"] is None or first_year > station_dict[station_id]["mindate"]:
                station_dict[station_id]["mindate"] = first_year
            if station_dict[station_id]["maxdate"] is None or last_year < station_dict[station_id]["maxdate"]:
                station_dict[station_id]["maxdate"] = last_year
    
        filtered_stations = {station_id: station for station_id, station in station_dict.items() if station["mindate"] and station["maxdate"]}

    return list(filtered_stations.values())

# Stationsliste aktualisieren
def update_stations():
    try:
        # Prüfe ob Stationsliste dieses Jahr schon abgerufen wurde.
        last_update = read_data(STATIONS_FILE).get("last_update")
        if last_update:
            last_update_year = datetime.datetime.strptime(last_update, "%Y-%m-%d").year
            current_year = datetime.datetime.now().year
            if last_update_year == current_year:
                return

        stations = fetch_stations(STATIONS_URL_AWS)
        stations = fetch_inventory_data(INVENTORY_URL_AWS, stations)

        stations_data = {
            "last_update": datetime.datetime.now().strftime("%Y-%m-%d"),
            "stations": stations
        }
        write_data(STATIONS_FILE, stations_data)
    except Exception as e:
        print(f"Unexpected error in update_stations: {str(e)}")

# Haversine-Formel zur Berechnung der Entfernung zwischen zwei Koordinaten
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Stationen innerhalb eines Radius abrufen
def get_stations_within_radius(lat, lon, radius, limit):
    stations = read_data(STATIONS_FILE).get("stations", [])
    stations_with_distance = []
    for station in stations:
        if "latitude" in station and "longitude" in station:
            distance = haversine(lat, lon, station["latitude"], station["longitude"])
            if distance <= radius:
                station["distance"] = distance  # Entfernung zur Station hinzufügen
                stations_with_distance.append(station)
        stations_sorted = sorted(stations_with_distance, key=lambda station: station["distance"])
    return stations_sorted[:limit], 200

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

# Daten einer Station abrufen
def fetch_station_data(station_id, start_year, end_year):
    try:
        url = f"{DATA_URL_AWS}/{station_id}.csv"
        response = requests.get(url)
        response.raise_for_status()
        parsed_station_data = parse_station_data(response.text, start_year, end_year)
        averages=calculate_averages(parsed_station_data)
        return averages, 200
    except Exception as e:
        return {"message": f"Error fetching station data: {str(e)}"}, 500

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
                    "seasons": {season: {"tmax": [], "tmin": []} for season in seasonal_months}
                }

            # Füge den Wert zur entsprechenden Liste hinzu
            for season, months in seasonal_months.items():
                if month in months:
                    if season == "winter":
                        if winter_year not in year_data:
                            year_data[winter_year] = {
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
        season_averages = {}
        for season, temps in values["seasons"].items():
            season_averages[f"{season}_tmax"] = (round(sum(temps["tmax"]) / len(temps["tmax"]) / 10, 1) if temps["tmax"] else None)
            season_averages[f"{season}_tmin"] = (round(sum(temps["tmin"]) / len(temps["tmin"]) / 10, 1) if temps["tmin"] else None)
        yearly_tmax = round(sum([temp for season, temp in season_averages.items() if "tmax" in season]) / 4, 1)
        yearly_tmin = round(sum([temp for season, temp in season_averages.items() if "tmin" in season]) / 4, 1)

        result.append({"year": year, "tmax": yearly_tmax, "tmin": yearly_tmin, **season_averages})
    result.pop()  # Letztes Jahr entfernen. Es enthält unvollständige Daten.
    return result

# API-Ressourcen definieren
class StationsResource(Resource):
    def get(self):
        stations = read_data(STATIONS_FILE)
        return stations, 200

class StationsWithinRadiusResource(Resource):
    def get(self, latitude, longitude, radius, limit):
        return get_stations_within_radius(latitude, longitude, radius, limit)

class StationDataResource(Resource):
    def get(self, station_id, start_year, end_year):
        return fetch_station_data(station_id, start_year, end_year)

# Routen hinzufügen
api.add_resource(StationsResource, "/stations")
api.add_resource(StationsWithinRadiusResource, "/stations-within-radius/<float(signed=True):latitude>/<float(signed=True):longitude>/<int:radius>/<int:limit>")
api.add_resource(StationDataResource, "/station-data/<string:station_id>/<int:start_year>/<int:end_year>")

if __name__ == "__main__":
    update_stations()
    app.run(debug=False, host="0.0.0.0", port=5000)
