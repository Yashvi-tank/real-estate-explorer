# Val-de-Marne Real Estate Market Explorer

A full-stack geospatial web application for exploring and comparing real estate prices across communes in **Val-de-Marne (department 94)**.

The project combines public French real estate transaction data (**DVF**) with cadastral geographic data (**Cadastre GeoJSON**) to build an interactive map-based market explorer.

Users can visually explore communes, compare market prices, view rankings, search for a commune, and inspect detailed statistics.

---

## Features

* Interactive map of Val-de-Marne communes
* Commune polygons stored and served from PostgreSQL/PostGIS
* Color-coded choropleth map based on average price per square meter
* Hover tooltip with quick market overview
* Click interaction to view full commune statistics
* Commune search with accent-insensitive matching
* Keyboard navigation in search results
* Rankings for most expensive and most affordable communes
* Commune comparison mode
* Dockerized full-stack setup
* Swagger API documentation

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Leaflet
* Leaflet

### Backend

* FastAPI
* SQLAlchemy async
* asyncpg
* Pandas

### Database

* PostgreSQL
* PostGIS

### DevOps

* Docker
* Docker Compose

---

## Data Sources

This project uses two public datasets:

### Cadastre GeoJSON

Used to build commune-level geographic polygons for Val-de-Marne.

Expected local file path:

```txt
data/raw/cadastre_94_val_de_marne.geojson.gz
```

### DVF Real Estate Transactions

Used to calculate commune-level real estate market indicators.

Expected local file path:

```txt
data/raw/dvf.csv
```

The raw data files are not committed to the repository because they are large.

---

## Why Department 94 Only?

The application focuses on **Val-de-Marne**, which is department `94`.

The DVF dataset may contain transactions for all of France, but the map/cadastre dataset used in this project covers Val-de-Marne. Therefore, the backend filters DVF records using:

```txt
Code departement = 94
```

This keeps both datasets aligned.

---

## Architecture

```txt
React Frontend
      ↓
FastAPI Backend
      ↓
PostgreSQL + PostGIS
      ↓
Cadastre + DVF data
```

The backend exposes REST API endpoints consumed by the React frontend.

The database stores:

* cadastral parcels
* cleaned commune geometries
* DVF transactions
* precomputed commune statistics

---

## Database Tables

### `parcels`

Stores raw cadastral parcel polygons.

### `communes`

Stores cleaned commune-level geometries used by the frontend map.

### `transactions`

Stores cleaned DVF real estate transactions.

### `commune_stats`

Stores precomputed commune-level statistics for fast API responses.

---

## API Endpoints

Swagger documentation is available at:

```txt
http://localhost:8000/docs
```

Main endpoints:

```txt
GET /health
GET /communes
GET /communes/geojson
GET /communes/{insee_code}
GET /stats/{insee_code}
GET /rankings
GET /compare?left=94080&right=94068
```

Example:

```txt
GET /compare?left=94080&right=94068
```

Compares Vincennes and Saint-Maur-des-Fossés.

---

## Running with Docker

Make sure Docker Desktop is running.

From the project root:

```bash
docker compose up --build
```

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:8000
```

Swagger:

```txt
http://localhost:8000/docs
```

Stop containers:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete the database volume.

---

## Initial Data Setup

If the database is empty, place the raw files here:

```txt
data/raw/cadastre_94_val_de_marne.geojson.gz
data/raw/dvf.csv
```

Start the database:

```bash
docker compose up -d db
```

Create tables:

```bash
docker compose run --rm backend python scripts/create_tables.py
```

Import cadastre parcels:

```bash
docker compose run --rm backend python scripts/import_cadastre.py --file /app/data/raw/cadastre_94_val_de_marne.geojson.gz
```

Build clean commune geometries:

```bash
docker compose run --rm backend python scripts/build_commune_geometries.py
```

Import DVF transactions and compute statistics:

```bash
docker compose run --rm backend python scripts/import_dvf.py --file /app/data/raw/dvf.csv
```

Then run the full application:

```bash
docker compose up --build
```

---

## Local Development Without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

## Current Frontend Features

The frontend includes:

* interactive Leaflet map
* data-driven commune coloring
* color legend
* commune hover tooltip
* clickable commune details
* selected commune zoom
* search bar
* rankings panel
* comparison panel

---

## Design Decisions

### Precomputed Statistics

Commune statistics are precomputed and stored in `commune_stats` instead of being recalculated on every request. This improves API response time.

### PostGIS for Geospatial Data

PostGIS is used to store and process commune geometries. The frontend receives GeoJSON generated from the database.

### Commune Geometry Cleanup

Raw cadastral parcels are too detailed for map display. The project stores raw parcel data separately and builds cleaner commune-level geometries for frontend rendering.

### Dockerized Setup

The application is containerized to make local testing easier and closer to a production-like structure.

---

## Future Improvements

Potential improvements:

* Add Appartement / Maison / Both type filter
* Add historical price evolution by year
* Add transaction density visualization
* Add deployment with managed PostgreSQL/PostGIS
* Add automated database initialization script
* Add unit tests for backend services
* Add frontend loading skeletons and error states

---

## Project Status

Implemented:

```txt
Backend API
PostGIS database
Cadastre import
DVF import
Commune statistics
Interactive frontend map
Search
Rankings
Comparison
Docker Compose setup
```

This project is ready for demonstration and technical review.
