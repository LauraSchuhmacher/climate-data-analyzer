import json
import requests
from flask import Flask, request
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)

DATA_FILE = "data.json"
EXTERNAL_API_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2/"  # Externe API

# Daten aus der JSON-Datei lesen
def read_data():
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

# Daten in die JSON-Datei schreiben
def write_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

# REST API Ressourcen
class ItemResource(Resource):
    def get(self, item_id):
        items = read_data()
        for item in items:
            if item["id"] == item_id:
                return item, 200
        return {"message": "Item nicht gefunden"}, 404

    def post(self, item_id):
        items = read_data()
        if any(item["id"] == item_id for item in items):
            return {"message": "Item existiert bereits"}, 400
        new_item = {"id": item_id, "name": f"Item-{item_id}"}
        items.append(new_item)
        write_data(items)
        return new_item, 201

    def delete(self, item_id):
        items = read_data()
        items = [item for item in items if item["id"] != item_id]
        write_data(items)
        return {"message": "Item gelöscht"}, 200

# API, um Daten von einer externen API abzurufen
class ExternalAPIResource(Resource):
    def get(self):
        try:
            response = requests.get(EXTERNAL_API_URL)
            data = response.json()
            return data, 200
        except Exception as e:
            return {"message": f"Fehler beim Abrufen der externen API: {str(e)}"}, 500

# Routen hinzufügen
api.add_resource(ItemResource, "/items/<int:item_id>")
api.add_resource(ExternalAPIResource, "/external-data")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
