# API Details (example — no secrets)

Live JWT + filled cURLs are **not** committed.

1. Start the API: `npm run dev:api`
2. Seed if needed: `npm run seed --workspace apps/api`
3. Generate local cheat sheet:

```bash
python3 scripts/generate-api-details-local.py
```

This writes **`API_DETAILS.local.md`** at the repo root (gitignored). Open that file for:

- Access + refresh JWT
- Demo user email/password
- Ready-to-paste cURLs for auth, cart, coupons, orders, payments, etc.

Base URL: `http://localhost:4000/api/v1`  
Auth header: `Authorization: Bearer <accessToken>`
