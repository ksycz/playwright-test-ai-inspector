# Demo Shop Static API

Read-only JSON contracts served by Vite from `app/public/api/` (no backend process).

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products.json` | Full product catalogue |
| `GET` | `/api/featured-products.json` | Products with `featured: true` |

Base URL locally: `http://localhost:5173` (same as the demo app).

## Product object fields

- `slug` (string, unique, non-empty)
- `name` (string, non-empty)
- `category` (string)
- `shortDescription` (string)
- `fullDescription` (string)
- `price` (number, ≥ 0)
- `image` (string, public path starting with `/`)
- `featured` (boolean, optional)

## Out of scope

- Authentication / users API (demo auth stays Local Storage; credentials are not published under `/api`)
- Mutations (POST/PUT/DELETE) — non-GET/HEAD methods return **405** JSON (`Method not allowed`)
- Database or external services

## Error responses

| Status | When | Body shape |
|---|---|---|
| `404` | Unknown `/api/...` path | `{ "error": "Not found", "path": "..." }` |
| `405` | Non-GET/HEAD method on `/api/...` | `{ "error": "Method not allowed", "path": "...", "method": "..." }` (`Allow: GET, HEAD`) |

Missing paths return JSON, not the React SPA HTML. Enforced by Vite middleware in `app/vite.config.ts`.

## How to validate

```bash
# From repository root (starts Vite via Playwright webServer)
npm run test:api
```

See also `docs/TESTING.md` → Static API contract.

## Keeping data in sync

The HTTP contract under `public/api/` is the source of truth for catalogue API tests.  
The React app loads products via `fetch('/api/products.json')` (`ProductsProvider`).  
`app/src/data/products.json` remains available as a seed/reference copy — keep it aligned when editing catalogue data.
