# Offizielles Python-Image als Basis
FROM python:3.9

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Den Code kopieren
COPY . .

# Container-Port definieren
EXPOSE 5000

# ENV PYTHONUNBUFFERED=1

# Befehl zum Starten der Anwendung
# CMD ["python", "-u", "app.py"]
CMD ["python", "app.py"]

