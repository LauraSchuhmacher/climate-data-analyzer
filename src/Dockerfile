# Python-Image als Basis
FROM python:3.13-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /src

# Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Den Code kopieren
COPY . .

# Container-Port definieren
EXPOSE 5000

# Befehl zum Starten der Anwendung
CMD ["python", "main.py"]
