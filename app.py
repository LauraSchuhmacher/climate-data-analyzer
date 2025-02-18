import json
import requests
import time
import datetime
import math
from flask import Flask, request, send_from_directory
from flask_restful import Api, Resource

app = Flask(__name__, static_folder="static")
api = Api(app)

STATIONS_FILE = "stations.json"
NOAA_API_TOKEN = "RZmWvwwkDhFRcpXBTzOrdxnCokqMqYBW"
STATIONS_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2/stations?datasetid=GSOM&limit=1000"
DATA_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&units=standard"

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

# Stationsliste abrufen
def fetch_stations():
    try:
        # Prüfe ob Stationsliste dieses Jahr schon abgerufen wurde.
        last_update = read_data(STATIONS_FILE).get("last_update")
        if last_update:
            last_update_year = datetime.datetime.strptime(last_update, "%Y-%m-%d").year
            current_year = datetime.datetime.now().year
            if last_update_year == current_year:
                return

        headers = {"token": NOAA_API_TOKEN}
        all_stations = []
        offset = 0

        while True:
            # Versuche die Stationsliste zu laden
            while True:
                try:
                    response = requests.get(f"{STATIONS_URL}&offset={offset}", headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    break  # Abbruch wenn Liste erfolgreich geladen.
                except Exception as e:
                    print(f"Error fetching stations for offset {offset}: {str(e)}. Retrying")
                    time.sleep(1)  # Warte eine Sekunde und versuche es dann erneut.

            stations = data.get("results", [])
            if not stations:
                break

            all_stations.extend(stations)
            offset += 1001
            time.sleep(1)  # Warte eine Sekunde vor der nächsten Anfrage.

        stations_data = {
            "last_update": datetime.datetime.now().strftime("%Y-%m-%d"),
            "stations": all_stations
        }
        write_data(STATIONS_FILE, stations_data)
    except Exception as e:
        print(f"Unexpected error in fetch_stations: {str(e)}")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_stations_within_radius(lat, lon, radius):
    stations = read_data(STATIONS_FILE).get("stations", [])
    return [station for station in stations if "latitude" in station and "longitude" in station and haversine(lat, lon, station["latitude"], station["longitude"]) <= radius]

def fetch_station_data(station_id, start_year, end_year):
    try:
        headers = {"token": NOAA_API_TOKEN}
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"
        url = f"{DATA_URL}&stationid={station_id}&startdate={start_date}&enddate={end_date}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json(), 200
    except Exception as e:
        return {"message": f"Error fetching station data: {str(e)}"}, 500

# API
class StationsResource(Resource):
    def get(self):
        stations = read_data(STATIONS_FILE)
        return stations, 200

class StationsWithinRadiusResource(Resource):
    def get(self, latitude, longitude, radius):
        return get_stations_within_radius(latitude, longitude, radius)

class StationDataResource(Resource):
    def get(self, station_id, start_year, end_year):
        return fetch_station_data(station_id, start_year, end_year)

# Routen hinzufügen
api.add_resource(StationsResource, "/stations")
api.add_resource(StationsWithinRadiusResource, "/stations-within-radius/<float(signed=True):latitude>/<float(signed=True):longitude>/<int:radius>")
api.add_resource(StationDataResource, "/station-data/<string:station_id>/<int:start_year>/<int:end_year>")

if __name__ == "__main__":
    fetch_stations()
    app.run(debug=True, host="0.0.0.0", port=5000)
