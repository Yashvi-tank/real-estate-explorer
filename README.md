# Val-de-Marne Real Estate Market Explorer

A full-stack geospatial application for exploring and comparing housing market data across the 47 communes of **Val-de-Marne (département 94)**, built from real French government data.

---

## Live Application

| | URL |
|---|---|
| **Frontend** | https://real-estate-explorer-frontend.vercel.app |
| **Backend API** | https://real-estate-explorer.onrender.com |
| **Swagger docs** | https://real-estate-explorer.onrender.com/docs |
| **Health check** | https://real-estate-explorer.onrender.com/health |

---

## What It Does

- Interactive choropleth map of Val-de-Marne communes, colored by average price per m²
- Hover tooltip with quick market overview per commune
- Click any commune to open detailed real estate indicators
- Search communes by name (accent-insensitive, partial match)
- Rankings: most expensive and most affordable communes
- Side-by-side comparison of two communes with affordability delta
- Fully documented REST API with Swagger UI

---

## Data Sources

| Dataset | Source | Usage |
|---|---|---|
| Cadastre 94 GeoJSON | data.gouv.fr / cadastre.data.gouv.fr | Commune map geometries |
| DVF transactions | data.gouv.fr / demandes-de-valeurs-foncieres | Real estate price indicators |

Raw files are not committed to this repository due to size. See [Local Setup](#local-setup) for placement instructions.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Leaflet

**Backend:** Python, FastAPI, SQLAlchemy (async), asyncpg, Pandas

**Database:** PostgreSQL + PostGIS (Neon in production, Docker locally)

**Infrastructure:** Docker, Docker Compose, Render, Vercel

---

## Architecture
React + Leaflet (Vercel)

↓  REST / GeoJSON

FastAPI Backend (Render)

↓  async SQL

PostgreSQL + PostGIS (Neon)

↓  imported from

Cadastre 94 GeoJSON + DVF CSV

The frontend never reads raw files. It only calls the backend API. The backend reads from PostGIS and serves commune data as JSON or GeoJSON.

---

## Repository Structure
real-estate-explorer/

├── backend/

│   ├── app/

│   │   ├── core/          # config.py, database.py

│   │   ├── repositories/  # commune_repository.py, stats_repository.py

│   │   ├── routers/       # health, communes, stats, rankings, compare

│   │   ├── services/      # commune, stats, compare services

│   │   └── main.py

│   ├── scripts/

│   │   ├── create_tables.py

│   │   ├── import_cadastre.py

│   │   ├── build_commune_geometries.py

│   │   └── import_dvf.py

│   ├── Dockerfile

│   └── requirements.txt

├── frontend/

│   ├── src/

│   │   ├── components/    # SearchBar, DetailPanel, RankingsPanel, ComparePanel

│   │   ├── map/           # ChoroplethMap, colorScale

│   │   ├── services/      # api.js

│   │   └── App.jsx

│   ├── Dockerfile

│   └── package.json

├── data/raw/              # place raw files here (not committed)

├── docker-compose.yml

└── README.md

---

## API Endpoints

Full interactive documentation: https://real-estate-explorer.onrender.com/docs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend + database status |
| GET | `/communes` | All communes with summary stats |
| GET | `/communes/geojson` | Commune polygons as GeoJSON for the map |
| GET | `/communes/{insee_code}` | Detailed stats for one commune |
| GET | `/stats/{insee_code}` | Raw stats for one commune |
| GET | `/rankings?metric=avg_price_per_sqm&order=desc&limit=5` | Ranked communes |
| GET | `/compare?left=94044&right=94013` | Side-by-side commune comparison |

Supported ranking metrics: `avg_price_per_sqm`, `median_price_per_sqm`, `avg_price`, `transaction_count`

---

## Database Design

| Table | Purpose |
|---|---|
| `parcels` | Raw cadastre parcel polygons, used for geometry generation |
| `communes` | Simplified commune-level geometries served to the frontend |
| `transactions` | Cleaned and deduplicated DVF transactions |
| `commune_stats` | Precomputed indicators per commune (avg, median, count) |

**Why precompute stats?** The frontend needs fast map coloring, rankings, and comparisons. Computing medians and averages on every request over thousands of transactions would be too slow. Stats are computed once at import time and served directly.

**Why PostGIS?** The cadastre file contains parcel-level polygon geometries. PostGIS allows server-side `ST_Union` to merge parcels into clean commune boundaries, `ST_SimplifyPreserveTopology` to reduce geometry complexity before serving to the browser, and `ST_AsGeoJSON` to serialize directly to GeoJSON in SQL.

**Why INSEE codes?** Postal codes are not reliable commune identifiers — one postal code can span multiple communes. INSEE codes uniquely identify each commune and are used to join cadastre and DVF data.

---

## DVF Data Cleaning

DVF is line-based, not transaction-based. A single property sale can appear across multiple rows when it involves multiple lots or parcels.

The import pipeline:

1. Filters to département 94 only
2. Keeps only `Nature mutation = Vente` (real sales)
3. Keeps only `Appartement` and `Maison` property types
4. Removes rows with missing price or surface
5. Removes exact duplicate DVF rows
6. Groups remaining rows by transaction ID into one record
7. Sums surfaces across lots within a transaction
8. Computes `price_per_sqm = price / surface`
9. Removes outliers outside 500–30 000 €/m²
10. Aggregates into `commune_stats` using median and average

This prevents duplicated DVF rows from inflating averages and distorting the market picture.

---

## Local Setup

### Prerequisites

Docker Desktop, Python 3.10+, Node 18+

### 1. Clone the repo

```bash
git clone https://github.com/your-username/real-estate-explorer
cd real-estate-explorer
```

### 2. Place raw data files
data/raw/cadastre_94_val_de_marne.geojson.gz

data/raw/dvf.csv

### 3. Run with Docker Compose

```bash
docker compose up --build
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000  
Swagger: http://localhost:8000/docs

### 4. Initialize the database (first time only)

```bash
docker compose up -d db
docker compose run --rm backend python scripts/create_tables.py
docker compose run --rm backend python scripts/import_cadastre.py --file /app/data/raw/cadastre_94_val_de_marne.geojson.gz
docker compose run --rm backend python scripts/build_commune_geometries.py
docker compose run --rm backend python scripts/import_dvf.py --file /app/data/raw/dvf.csv
docker compose up --build
```

### 5. Run locally without Docker (backend + frontend only)

Keep only the database in Docker:

```bash
docker compose up -d db
```

Backend:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate  |  Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Create backend/.env with:
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/realestate
# ENVIRONMENT=development
# CORS_ORIGINS=http://localhost:5173
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/realestate
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_URL=https://real-estate-explorer.onrender.com
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Database | Neon (PostgreSQL + PostGIS) | Only `communes` and `commune_stats` tables needed in production |
| Backend | Render (Docker Web Service) | Set `DATABASE_URL` and `CORS_ORIGINS` env vars |
| Frontend | Vercel | Set `VITE_API_URL` env var to Render backend URL |

To export the minimal production tables from a local Docker database:

```bash
docker exec real-estate-explorer-db-1 pg_dump -U postgres -d realestate \
  --table=public.communes --table=public.commune_stats \
  --no-owner --no-acl > prod_minimal.sql
```

---

## Known Limitations

- Appartement and Maison transactions are currently combined in statistics
- No year-by-year price evolution (data exists in DVF, not yet surfaced)
- Raw data import is manual — no automated pipeline
- Production uses precomputed tables; raw parcel and transaction tables are for local processing only

## Possible Future Improvements

- Appartement / Maison filter toggle
- Price evolution chart per commune
- Transaction density heatmap layer
- Automated database initialization
- Backend unit tests and CI/CD pipeline

---

## Demo Flow

1. Open https://real-estate-explorer-frontend.vercel.app
2. Show the choropleth map — explain it is built from PostGIS commune geometries
3. Hover a commune — quick tooltip with price per m²
4. Click a commune — detailed panel with all indicators
5. Search `Créteil` or `Choisy` — show accent-insensitive search
6. Open Rankings — most expensive (Saint-Mandé, Vincennes) vs most affordable
7. Compare two communes — show the affordability delta
8. Open https://real-estate-explorer.onrender.com/docs — walk through the API
9. Explain DVF deduplication and why it matters for data accuracy
10. Explain the PostGIS geometry pipeline from parcels → communes

---

## About

Built by **Yashvi Tank** as a technical assessment — a one-day full-stack challenge to build a real estate territory comparison application using real French government data.