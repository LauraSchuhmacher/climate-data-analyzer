from flask import render_template, jsonify
from business import get_stations_within_radius, get_station_data, update_stations

def init_routes(app):
    """
    Initializes the Flask application routes.

    Args:
        app (Flask): The Flask application instance.
    """

    @app.route("/")
    def index():
        """
        Renders the homepage.

        Returns:
            Response: Rendered HTML template for the homepage.
        """
        return render_template("index.html")

    @app.route("/stations-within-radius/<float(signed=True):latitude>/<float(signed=True):longitude>/<int:radius>/<int:limit>/<int:start_year>/<int:end_year>", methods=["GET"])
    def stations_within_radius(latitude, longitude, radius, limit, start_year, end_year):
        """
        Retrieves weather stations within a specified radius of a given location.

        Args:
            latitude (float): Latitude of the location.
            longitude (float): Longitude of the location.
            radius (int): Radius in kilometers to search for stations.
            limit (int): Maximum number of stations to return.
            start_year (int): Start year for station data.
            end_year (int): End year for station data.

        Returns:
            Response: JSON response containing station data or an error message.
        """
        try:
            result = get_stations_within_radius(latitude, longitude, radius, limit, start_year, end_year)
            return result
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/station-data/<string:station_id>/<int:start_year>/<int:end_year>", methods=["GET"])
    def station_data(station_id, start_year, end_year):
        """
        Retrieves data for a specific weather station within a given time range.

        Args:
            station_id (str): The unique identifier for the station.
            start_year (int): The starting year for data retrieval.
            end_year (int): The ending year for data retrieval.

        Returns:
            Response: JSON response containing station data or an error message.
        """
        try:
            result = get_station_data(station_id, start_year, end_year)
            return result
        except Exception as e:
            return jsonify({"error": str(e)}), 500

def update_inventory():
    """
    Updates station inventory.

    Returns:
        Response: Result of the update operation.
    """
    try:
        return update_stations()
    except Exception as e:
        print(f"Unexpected error in update_inventory: {str(e)}")
