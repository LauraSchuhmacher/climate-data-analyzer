from flask import Flask
from controller import init_routes, update_inventory

app = Flask(__name__)

init_routes(app)

if __name__ == "__main__":
    update_inventory()
    app.run(debug=False, host="0.0.0.0", port=5000)
