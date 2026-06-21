# Val-de-Marne Real Estate Market Explorer

A full-stack geospatial real estate application for exploring and comparing housing prices across the communes of **Val-de-Marne, department 94**.

This project was built from two public datasets:

1. **Cadastre 94 GeoJSON** — used to build commune map geometries.
2. **DVF real estate transactions** — used to calculate real estate indicators such as average price per square meter, median price, transaction count, and affordability comparison.

The application lets users explore a color-coded map, search for communes, inspect real estate statistics, view rankings, and compare two communes side by side.

---

## Live Demo

Frontend:

```txt
TODO: add Vercel URL
```

Backend API:

```txt
TODO: add Render URL
```

Swagger API documentation:

```txt
TODO: add Render /docs URL
```

---

## Main Features

### Interactive map

* Val-de-Marne commune map built from cadastre data
* Commune polygons stored in PostgreSQL/PostGIS
* GeoJSON served from the backend API
* Choropleth coloring by average price per square meter
* Color legend showing cheap to expensive communes
* Hover tooltip with quick market overview
* Click interaction to open detailed commune statistics
* Selected commune highlight
* Automatic map zoom to selected commune

### Search

* Search by commune name or INSEE code
* Accent-insensitive matching
* Hyphen/apostrophe/space-insensitive matching
* Keyboard navigation with arrow keys and Enter
* Example searches:

  * `creteil`
  * `choisy`
  * `saint`
  * `vinc`
  * `94080`

### Rankings

* Most expensive communes
* Most affordable communes
* Click ranking item to open the commune on the map

### Comparison

* Compare two communes side by side
* Compare:

  * average price per square meter
  * median price per square meter
  * average sale price
  * average surface
  * transaction count
* Shows which commune is more affordable and by what percentage

### API

* REST API built with FastAPI
* Swagger available at `/docs`
* Async PostgreSQL access
* Separate router, service, and repository layers

### Docker

* Dockerized PostgreSQL/PostGIS database
* Dockerized FastAPI backend
* Dockerized React frontend
* Full stack can run with Docker Compose

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Leaflet
* Leaflet

### Backend

* Python
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

## Project Architecture

```txt
React + Leaflet Frontend
        ↓
FastAPI Backend
        ↓
PostgreSQL + PostGIS
        ↓
Cadastre 94 + DVF Data
```

The frontend does not read raw files directly. It only calls the backend API.

The backend reads data from PostgreSQL/PostGIS and exposes commune data as JSON or GeoJSON.

---

## Repository Structure

```txt
real-estate-explorer/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── repositories/
│   │   │   ├── commune_repository.py
│   │   │   └── stats_repository.py
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── communes.py
│   │   │   ├── stats.py
│   │   │   ├── rankings.py
│   │   │   └── compare.py
│   │   ├── services/
│   │   │   ├── commune_service.py
│   │   │   ├── stats_service.py
│   │   │   └── compare_service.py
│   │   └── main.py
│   │
│   ├── scripts/
│   │   ├── create_tables.py
│   │   ├── import_cadastre.py
│   │   ├── build_commune_geometries.py
│   │   └── import_dvf.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── DetailPanel.jsx
│   │   │   ├── RankingsPanel.jsx
│   │   │   └── ComparePanel.jsx
│   │   ├── map/
│   │   │   ├── ChoroplethMap.jsx
│   │   │   └── colorScale.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
│
├── data/
│   └── raw/
│       ├── cadastre_94_val_de_marne.geojson.gz
│       └── dvf.csv
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Data Files

Raw data files are **not committed** to GitHub because they are large.

You must place them manually in:

```txt
data/raw/
```

Expected filenames:

```txt
data/raw/cadastre_94_val_de_marne.geojson.gz
data/raw/dvf.csv
```

---

## Why Department 94 Only?

Val-de-Marne is department `94`.

The cadastre file provided for this project contains only Val-de-Marne geographic data. The DVF dataset can contain transactions for all of France, so the backend filters DVF rows with:

```txt
Code departement = 94
```

This keeps the transaction data aligned with the map data.

---

## Database Design

The project uses four main tables.

### `parcels`

Stores raw cadastre parcel polygons.

Used for:

* importing cadastre data
* generating commune geometries

### `communes`

Stores cleaned commune-level geometries.

Used by:

```txt
GET /communes
GET /communes/geojson
GET /communes/{insee_code}
```

### `transactions`

Stores cleaned and grouped DVF transactions.

Used for computing statistics.

### `commune_stats`

Stores precomputed commune-level real estate indicators.

Used by:

```txt
GET /stats/{insee_code}
GET /rankings
GET /compare
```

---

## Data Cleaning and Processing

### Cadastre processing

The cadastre file contains parcel-level geometries.

The project imports these parcels into the `parcels` table, then builds cleaner commune-level geometries into the `communes` table.

The commune geometries are simplified and cleaned to make the frontend map readable.

This avoids rendering hundreds of thousands of raw parcels in the browser.

### DVF processing

DVF is line-based, not transaction-based.

A single real estate sale can appear on multiple rows, especially when the sale contains multiple lots or parcels.

The import logic handles this by:

1. filtering only department `94`
2. keeping only real sales:

   ```txt
   Nature mutation = Vente
   ```
3. keeping only:

   ```txt
   Appartement
   Maison
   ```
4. removing invalid prices and surfaces
5. removing exact duplicate raw DVF rows
6. grouping valid rows into one transaction using a generated transaction key
7. summing surfaces only after duplicate rows are removed
8. computing `price_per_sqm`
9. removing unrealistic price-per-square-meter values
10. computing commune-level statistics

The script also stores `raw_line_count` to show when a transaction was built from multiple DVF rows.

This prevents repeated DVF rows from distorting averages and medians.

---

## API Endpoints

Swagger documentation:

```txt
http://localhost:8000/docs
```

### Health

```txt
GET /health
```

Checks backend and database connection.

### Communes

```txt
GET /communes
```

Returns all communes with basic statistics.

```txt
GET /communes/geojson
```

Returns commune polygons as GeoJSON for the Leaflet map.

```txt
GET /communes/{insee_code}
```

Returns detailed statistics for one commune.

Example:

```txt
GET /communes/94028
```

### Statistics

```txt
GET /stats/{insee_code}
```

Example:

```txt
GET /stats/94080
```

### Rankings

```txt
GET /rankings?metric=avg_price_per_sqm&order=desc&limit=5
```

Supported metrics:

```txt
avg_price_per_sqm
median_price_per_sqm
avg_price
transaction_count
```

Supported order:

```txt
asc
desc
```

### Compare

```txt
GET /compare?left=94080&right=94068
```

Example:

```txt
GET /compare?left=94080&right=94068
```

Compares Vincennes and Saint-Maur-des-Fossés.

---

## Running the Project with Docker

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

To stop containers:

```bash
docker compose down
```

Do not use this unless you intentionally want to delete the database data:

```bash
docker compose down -v
```

The `-v` option deletes the PostgreSQL volume.

---

## Initial Database Setup with Docker

If the database is empty, place the raw files here:

```txt
data/raw/cadastre_94_val_de_marne.geojson.gz
data/raw/dvf.csv
```

Start only the database:

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

Build commune geometries:

```bash
docker compose run --rm backend python scripts/build_commune_geometries.py
```

Import DVF transactions and compute statistics:

```bash
docker compose run --rm backend python scripts/import_dvf.py --file /app/data/raw/dvf.csv
```

Then run the full app:

```bash
docker compose up --build
```

---

## Running Locally Without Full Docker

You can also run the backend and frontend locally while keeping only the database in Docker.

### 1. Start PostgreSQL/PostGIS

```bash
docker compose up -d db
```

### 2. Backend setup

Go to backend:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/realestate
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

### 3. Frontend setup

Go to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/realestate
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
```

### Frontend

For Docker Compose, the frontend uses:

```env
VITE_API_URL=http://localhost:8000
```

For deployment, set:

```env
VITE_API_URL=https://your-backend-url
```

---

## Deployment Plan

The project can be deployed using:

```txt
Database: Neon PostgreSQL + PostGIS
Backend: Render Docker Web Service
Frontend: Vercel
```

For production, it is enough to deploy only:

```txt
communes
commune_stats
```

The frontend only needs these tables for the current map, ranking, search, and comparison features.

The full raw parcel and transaction tables are mainly needed for local data processing and recomputation.

---

## Production Database Export

To export the minimum production database from the local Docker database:

```bash
docker exec real-estate-explorer-db-1 pg_dump -U postgres -d realestate --table=public.communes --table=public.commune_stats --no-owner --no-acl > prod_minimal.sql
```

Restore it into a production Postgres/PostGIS database:

```bash
docker run --rm -i postgres:15 psql "<PRODUCTION_DATABASE_URL>" < prod_minimal.sql
```

---

## Validation Checks

### Check number of communes

```bash
docker exec -it real-estate-explorer-db-1 psql -U postgres -d realestate -c "SELECT COUNT(*) FROM communes;"
```

Expected:

```txt
47
```

### Check number of commune statistics

```bash
docker exec -it real-estate-explorer-db-1 psql -U postgres -d realestate -c "SELECT COUNT(*) FROM commune_stats;"
```

Expected:

```txt
47
```

### Check most expensive communes

```bash
docker exec -it real-estate-explorer-db-1 psql -U postgres -d realestate -c "SELECT c.name, cs.avg_price_per_sqm, cs.transaction_count FROM communes c JOIN commune_stats cs ON c.insee_code = cs.commune_insee_code ORDER BY cs.avg_price_per_sqm DESC LIMIT 5;"
```

### Check multi-line DVF transactions

```bash
docker exec -it real-estate-explorer-db-1 psql -U postgres -d realestate -c "SELECT COUNT(*) FROM transactions WHERE (raw_data->>'raw_line_count')::int > 1;"
```

This confirms that some transactions were built from multiple DVF lines.

---

## Design Decisions

### Why precompute statistics?

The frontend needs fast responses for rankings, comparisons, and map coloring.

Instead of recalculating averages and medians on every API request, the project precomputes commune indicators into `commune_stats`.

### Why use PostGIS?

The cadastre file contains geospatial polygons. PostGIS allows the backend to store, clean, simplify, and serve these geometries as GeoJSON.

### Why not render raw parcels?

The cadastre contains many parcel-level geometries. Rendering them directly would be too heavy and visually unreadable.

The project keeps parcels in the database but serves cleaned commune-level polygons to the frontend.

### Why use INSEE codes?

Postal codes are not reliable commune identifiers because one postal code can cover multiple communes or areas.

INSEE codes uniquely identify communes and are used to join cadastre and DVF data.

Example:

```txt
Choisy-le-Roi postal code: 94600
Choisy-le-Roi INSEE code: 94022
```

The API uses INSEE codes.

---

## Known Limitations

* Current indicators are based on cleaned DVF rows and selected assumptions.
* The app currently combines houses and apartments.
* No year-by-year price evolution yet.
* Raw data import is manual.
* Production deployment uses precomputed commune tables instead of the full raw database.

---

## Future Improvements

Potential improvements:

* Add Appartement / Maison / Both filter
* Add year-based filtering
* Add price evolution charts
* Add transaction density layer
* Add automated database initialization job
* Add backend unit tests
* Add frontend tests
* Add CI/CD pipeline
* Add production-ready Nginx frontend container

---

## Demo Flow

Suggested demo order:

1. Open the frontend.
2. Explain that the map uses PostGIS-generated commune GeoJSON.
3. Hover over a commune to show quick statistics.
4. Click a commune to open detailed indicators.
5. Search for a commune such as `Créteil` or `Choisy`.
6. Open rankings to show most expensive and most affordable communes.
7. Compare two communes.
8. Open Swagger to show the API endpoints.
9. Explain the DVF cleaning and duplicate-row handling.
10. Explain Docker and local setup.

---

## Project Status

Implemented:

```txt
FastAPI backend
React frontend
PostgreSQL/PostGIS database
Cadastre import
Commune geometry generation
DVF cleaning and deduplication
Precomputed statistics
Interactive map
Search
Rankings
Comparison
Docker Compose setup
README documentation
```

Pending:

```txt
Public deployment URLs
```
