# API Details (example — no secrets)

Live JWT + filled cURLs are **not** committed.

## Local API (`localhost:4000`)

1. Start the API: `npm run dev:api`
2. Seed if needed: `npm run seed --workspace apps/api`
3. Generate local cheat sheet:

```bash
python3 scripts/generate-api-details-local.py
```

Writes **`API_DETAILS.local.md`** (gitignored) with access/refresh JWT + ready cURLs.

Base URL: `http://localhost:4000/api/v1`

## Live API (Render)

Committed Postman/cURL templates (no JWTs):

→ **[`API_DETAILS.live.example.md`](API_DETAILS.live.example.md)**

```text
https://ni-avellir.onrender.com/api/v1
```

Generate a gitignored sheet with real tokens against Render:

```bash
python3 scripts/generate-api-details-local.py --live
# → API_DETAILS.live.local.md
```

First request after idle may take 30–90s (Render Free cold start).

Auth header: `Authorization: Bearer <accessToken>`
