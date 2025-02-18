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
NOAA_API_TOKEN = "RZmWvwwkDhFRcpXBTzOrdxnCokqMqYBW"
STATIONS_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2/stations?datasetid=GSOM&limit=1000"
DATA_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&datatypeid=TMAX&datatypeid=TMIN&units=metric&limit=1000"

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
    return stations_sorted[:limit]

def fetch_station_data(station_id, start_year, end_year):
    try:
        headers = {"token": NOAA_API_TOKEN}
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"
        url = f"{DATA_URL}&stationid={station_id}&startdate={start_date}&enddate={end_date}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data=response.json()
        averages=calculate_averages(response.json())
        return averages, 200
    except Exception as e:
        return {"message": f"Error fetching station data: {str(e)}"}, 500

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
            date = datetime.datetime.strptime(entry["date"], "%Y-%m-%dT%H:%M:%S")
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
        yearly_tmax = round(sum(values["tmax"]) / len(values["tmax"]), 1) if values["tmax"] else None
        yearly_tmin = round(sum(values["tmin"]) / len(values["tmin"]), 1) if values["tmin"] else None

        season_averages = {}
        for season, temps in values["seasons"].items():
            season_averages[f"{season}_tmax"] = (round(sum(temps["tmax"]) / len(temps["tmax"]), 1) if temps["tmax"] else None)
            season_averages[f"{season}_tmin"] = (round(sum(temps["tmin"]) / len(temps["tmin"]), 1) if temps["tmin"] else None)

        result.append({"year": year, "tmax": yearly_tmax, "tmin": yearly_tmin, **season_averages})
    result.pop()  # Letztes Jahr entfernen. Es enthält nur unvollständige Daten.
    return result

# API
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
    fetch_stations()
    app.run(debug=False, host="0.0.0.0", port=5000)
