# Demo Shop Static API

Read-only JSON contracts served by Vite from `app/public/api/` (no backend process).

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products.json` | Full product catalogue |
| `GET` | `/api/featured-products.json` | Products with `featured: true` |

Base URL locally: `http://localhost:5173` (same as the demo app).

## Product object fields

- `slug` (string, unique)
- `name` (string)
- `category` (string)
- `shortDescription` (string)
- `fullDescription` (string)
- `price` (number)
- `image` (string, public path)
- `featured` (boolean, optional)

## Out of scope

- Authentication / users API (demo auth stays Local Storage; credentials are not published under `/api`)
- Mutations (POST/PUT/DELETE)
- Database or external services

## Missing paths

Unknown `/api/...` URLs return **404** with a small JSON body (`{ "error": "Not found", "path": "..." }`), not the React SPA HTML. This is enforced by a Vite middleware in `app/vite.config.ts`.

## Keeping data in sync

Until Phase 5-M2 unifies the app client, catalogue JSON also lives in `app/src/data/products.json`.  
When editing products, update **both** files (or regenerate `public/api/*.json` from `src/data/products.json`).
