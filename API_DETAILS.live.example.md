# Live API cURLs (Render) — Postman / terminal

**Base URL (no secrets in this file):**

```text
https://ni-avellir.onrender.com
API:     https://ni-avellir.onrender.com/api/v1
Health:  https://ni-avellir.onrender.com/health
```

Mobile app points here via `apps/mobile/src/config/appConfig.ts` (`apiBaseUrl`).

**Cold start:** Render Free may sleep after ~15 minutes idle. First request can take 30–90s. The app pings `/api/v1/health` on bootstrap + every 20 minutes while foregrounded (`wakeApiServer.ts`).

**Postman:** Create an environment with:

| Variable | Example |
|----------|---------|
| `baseUrl` | `https://ni-avellir.onrender.com/api/v1` |
| `rootUrl` | `https://ni-avellir.onrender.com` |
| `accessToken` | from login response |
| `refreshToken` | from login response |
| `productId` | from `GET /products` (`_id`) |
| `orderId` | from `POST /orders` |

Auth header: `Authorization: Bearer {{accessToken}}`  
Guest cart: `X-Guest-Session: <uuid>`

To mint a real JWT against live (writes **gitignored** file with tokens):

```bash
python3 scripts/generate-api-details-local.py --live
# → API_DETAILS.live.local.md
```

---

## Shell helpers

```bash
export ROOT=https://ni-avellir.onrender.com
export BASE=https://ni-avellir.onrender.com/api/v1
# After login:
# export ACCESS='...'
# export REFRESH='...'
# export PRODUCT_ID='...'
# export ORDER_ID='...'
```

---

## Health (wake server)

```bash
curl -sS -m 90 "$ROOT/health"
curl -sS -m 90 "$BASE/health"
# expect: {"service":"nidavellir-api","status":"ok"}
```

---

## Catalog / serviceability / coupons

```bash
curl -sS -m 60 "$BASE/products?limit=10"
curl -sS -m 60 "$BASE/products/featured"
curl -sS -m 60 "$BASE/products/limited-drops"
curl -sS -m 60 "$BASE/products/categories"
curl -sS -m 60 "$BASE/products/franchises"
curl -sS -m 60 "$BASE/products/suggestions?q=hoodie"
curl -sS -m 60 "$BASE/products/deathnote-tee"
curl -sS -m 60 "$BASE/products/deathnote-tee/related"
curl -sS -m 60 "$BASE/serviceability?pincode=110001"
curl -sS -m 60 "$BASE/coupons"
curl -sS -m 60 -X POST "$BASE/coupons/validate" -H 'Content-Type: application/json' \
  -d '{"code":"FORGE10","subtotal":2000}'
```

Verified sample product (Atlas seed may vary): slug `deathnote-tee` / name **Kira Rules Tee**.

Seeded coupons: `FORGE10`, `WELCOME100`.

---

## Auth

Use a **unique** email + 10-digit phone each time (both unique in DB).

### Register check (optional)

```bash
curl -sS -m 60 -X POST "$BASE/auth/register/check" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","phone":"9876543210"}'
```

### Register

```bash
curl -sS -m 60 -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d '{
    "name":"Postman Live",
    "email":"you@example.com",
    "phone":"9876543210",
    "password":"DemoPass123!",
    "deviceId":"postman"
  }'
```

### Login → copy tokens

```bash
curl -sS -m 60 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"DemoPass123!","deviceId":"postman"}'
```

### Me / refresh / logout

```bash
curl -sS -m 60 "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
curl -sS -m 60 -X POST "$BASE/auth/logout" -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

### Forgot / reset / change password

```bash
curl -sS -m 60 -X POST "$BASE/auth/forgot-password" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
curl -sS -m 60 -X POST "$BASE/auth/reset-password" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","code":"1234","password":"NewPass123!"}'
curl -sS -m 60 -X POST "$BASE/auth/change-password" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"DemoPass123!","newPassword":"NewerPass123!"}'
```

### Sessions / email verify / OTP

```bash
curl -sS -m 60 "$BASE/auth/sessions" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X DELETE "$BASE/auth/sessions/SESSION_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/auth/verify-email/send" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/auth/verify-email" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","code":"1234"}'
curl -sS -m 60 -X POST "$BASE/auth/otp/send" -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210","purpose":"login"}'
curl -sS -m 60 -X POST "$BASE/auth/otp/verify" -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210","code":"1234","purpose":"login","deviceId":"postman"}'
```

On Render with `EMAIL_DEMO_MODE` / `SMS_DEMO_MODE`, OTP codes appear in **Render logs**, not email/SMS.

---

## Cart

```bash
curl -sS -m 60 "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/cart/items" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}"
curl -sS -m 60 -X PATCH "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"quantity":2}'
curl -sS -m 60 -X POST "$BASE/cart/apply-coupon" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"code":"FORGE10"}'
curl -sS -m 60 -X POST "$BASE/cart/remove-coupon" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X DELETE "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X DELETE "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/cart/merge" -H "Authorization: Bearer $ACCESS" -H 'X-Guest-Session: GUEST-UUID'
curl -sS -m 60 -X POST "$BASE/cart/quote" -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]}"
```

---

## Wishlist / addresses / reviews / notifications

```bash
curl -sS -m 60 "$BASE/wishlist" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/wishlist/toggle" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\"}"
curl -sS -m 60 "$BASE/addresses" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/addresses" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"fullName":"Postman Live","phone":"9876543210","line1":"12 Forge Lane","city":"Delhi","state":"DL","postalCode":"110001","isDefault":true}'
curl -sS -m 60 "$BASE/reviews?productId=$PRODUCT_ID"
curl -sS -m 60 -X POST "$BASE/reviews" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\",\"name\":\"Postman Live\",\"rating\":5,\"body\":\"Solid piece.\"}"
curl -sS -m 60 "$BASE/notifications" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/notifications/read-all" -H "Authorization: Bearer $ACCESS"
```

---

## Orders / payments

### COD (marks order confirmed)

```bash
curl -sS -m 60 "$BASE/orders" -H "Authorization: Bearer $ACCESS"
curl -sS -m 60 -X POST "$BASE/orders" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{
    \"paymentMethod\":\"cash_on_delivery\",
    \"customer\":{\"name\":\"Postman Live\",\"email\":\"you@example.com\",\"phone\":\"9876543210\"},
    \"shippingAddress\":{\"fullName\":\"Postman Live\",\"phone\":\"9876543210\",\"line1\":\"12 Forge Lane\",\"city\":\"Delhi\",\"state\":\"DL\",\"postalCode\":\"110001\"},
    \"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]
  }"
```

### Razorpay Test (native checkout path)

```bash
# 1) Create pending_payment order
curl -sS -m 60 -X POST "$BASE/orders" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{
    \"paymentMethod\":\"razorpay_demo\",
    \"customer\":{\"name\":\"Postman Live\",\"email\":\"you@example.com\",\"phone\":\"9876543210\"},
    \"shippingAddress\":{\"fullName\":\"Postman Live\",\"phone\":\"9876543210\",\"line1\":\"12 Forge Lane\",\"city\":\"Delhi\",\"state\":\"DL\",\"postalCode\":\"110001\"},
    \"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]
  }"

# 2) Create payment intent (demoMode should be false when Test keys are set on Render)
curl -sS -m 60 -X POST "$BASE/payments/intents" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"$ORDER_ID\"}"

# 3) After client SDK success — confirm with signature from Razorpay
curl -sS -m 60 -X POST "$BASE/payments/razorpay/confirm" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"$ORDER_ID\",\"providerIntentId\":\"order_...\",\"providerPaymentId\":\"pay_...\",\"signature\":\"...\"}"
```

`POST /payments/razorpay/demo-complete` is **blocked** when real Razorpay keys are configured on Render.

Webhook (Razorpay Dashboard → your host; not for Postman casually):

```text
POST https://ni-avellir.onrender.com/api/v1/payments/razorpay/webhook
```

### Cancel / return / exchange

```bash
curl -sS -m 60 -X POST "$BASE/orders/$ORDER_ID/cancel" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"reason":"Changed mind"}'
curl -sS -m 60 -X POST "$BASE/orders/$ORDER_ID/return" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"reason":"Damaged"}'
curl -sS -m 60 -X POST "$BASE/orders/$ORDER_ID/exchange" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"reason":"Wrong size"}'
```

---

## Suggested Postman collection order

1. `GET {{rootUrl}}/health` (wake)
2. `GET {{baseUrl}}/products?limit=5` → save `productId`
3. `POST {{baseUrl}}/auth/register` then `POST {{baseUrl}}/auth/login` → save tokens
4. `GET {{baseUrl}}/auth/me`
5. `POST {{baseUrl}}/cart/items`
6. `POST {{baseUrl}}/orders` (COD or Razorpay)
7. If Razorpay: `POST {{baseUrl}}/payments/intents`

---

## Local vs live

| | Local | Live (Render) |
|--|--------|----------------|
| Base | `http://localhost:4000/api/v1` | `https://ni-avellir.onrender.com/api/v1` |
| Cheat sheet | `python3 scripts/generate-api-details-local.py` → `API_DETAILS.local.md` | `python3 scripts/generate-api-details-local.py --live` → `API_DETAILS.live.local.md` |
| This file | — | Committed templates (no JWTs) |
