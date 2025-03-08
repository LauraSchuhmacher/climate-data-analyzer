from flask import render_template, jsonify
from business import get_stations_within_radius, get_station_data, update_stations

def init_routes(app):

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/stations-within-radius/<float(signed=True):latitude>/<float(signed=True):longitude>/<int:radius>/<int:limit>/<int:start_year>/<int:end_year>", methods=["GET"])
    def stations_within_radius(latitude, longitude, radius, limit, start_year, end_year):
        try:
            result = get_stations_within_radius(latitude, longitude, radius, limit, start_year, end_year)
            return result
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/station-data/<string:station_id>/<int:start_year>/<int:end_year>", methods=["GET"])
    def station_data(station_id, start_year, end_year):
        try:
            result = get_station_data(station_id, start_year, end_year)
            return result
        except Exception as e:
            return jsonify({"error": str(e)}), 500

def update_inventory():
    try:
        return update_stations()
    except Exception as e:
        print(f"Unexpected error in update_inventory: {str(e)}")

