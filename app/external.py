import json
import requests

JSON_FILE = "stations.json"

DATA_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station"
STATIONS_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt"
INVENTORY_URL_AWS = "http://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-inventory.txt"

# Daten aus der JSON-Datei lesen
def read_data():
    """Read data from a JSON file.

    Args:
        file_path (str): Path to the JSON file.
    Returns:
        dict: Data read from the file, or an empty dictionary if file not found or invalid.
    """
    try:
        with open(JSON_FILE, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

# Daten in die JSON-Datei schreiben
def write_data(data):
    """Write data to a JSON file.

    Args:
        file_path (str): Path to the JSON file.
        data (dict): Data to write.
    """
    with open(JSON_FILE, "w") as file:
        json.dump(data, file, indent=4)


# Alle Stationen abrufen
def fetch_stations():
    """Fetch all station data from the NOAA dataset.

    Returns:
        requests.Response: Response object containing station data or an error message.
    """
    return fetch_url(STATIONS_URL_AWS, "stations data")

# Inventardaten für alle Stationen abrufen
def fetch_inventory_data():
    """Fetch inventory data for all stations.

    Returns:
        requests.Response: Response object containing inventory data or an error message.
    """
    return fetch_url(INVENTORY_URL_AWS, "inventory data")

# Inventardaten für alle Stationen abrufen
def fetch_station_data(station_id):
    """Fetch weather data for a specific station.

    Args:
        station_id (str): The station ID to fetch data for.

    Returns:
        requests.Response: Response object containing station data or an error message.
    """
    url = f"{DATA_URL_AWS}/{station_id}.csv"
    return fetch_url(url, "station data")

# URL abrufen    
def fetch_url(url, description):
    """Fetch data from a given URL.

    Args:
        url (str): The URL to fetch data from.
        description (str): Description of the data being fetched (for error messages).

    Returns:
        requests.Response or dict: Response object if successful, or error message dictionary with status code.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        return {"message": f"Error fetching {description}: {e}"}, 500
