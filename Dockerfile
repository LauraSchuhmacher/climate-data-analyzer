# Offizielles Python-Image als Basis
FROM python:3.9-slim

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Den Code kopieren
COPY /app .

# Container-Port definieren
EXPOSE 5000

# Befehl zum Starten der Anwendung
CMD ["python", "app/app.py"]
