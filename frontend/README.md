# Frontend — Val-de-Marne Real Estate Explorer

React + Vite frontend for the Val-de-Marne real estate market explorer.

## Stack

- React 18
- Vite
- Tailwind CSS
- React Leaflet + Leaflet

## Local development

```bash
npm install
npm run dev
```

Runs on http://localhost:5173

The frontend proxies `/api` requests to `http://localhost:8000` in development (configured in `vite.config.js`). Make sure the backend is running locally or update `VITE_API_URL` in your `.env`.

## Environment variable

```env
VITE_API_URL=https://real-estate-explorer.onrender.com
```

For local development without the proxy, set:

```env
VITE_API_URL=http://localhost:8000
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Deployed automatically to Vercel on push to main.