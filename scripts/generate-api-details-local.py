#!/usr/bin/env python3
"""Generate gitignored API_DETAILS.local.md with live JWT + cURLs. Run with API up on :4000."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "API_DETAILS.local.md"
BASE = "http://localhost:4000/api/v1"


def call(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode() or "{}"
            return res.status, json.loads(raw)
    except urllib.error.HTTPError as err:
        raw = err.read().decode() or "{}"
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"error": {"message": raw}}
        return err.code, payload


def main() -> None:
    stamp = int(time.time())
    email = f"curl.demo.{stamp}@nidavellir.local"
    password = "DemoPass123!"
    # Last 10 digits must stay unique — phone is unique in User model.
    phone = f"9{stamp % 10_000_000_000:09d}"[-10:]

    code, reg = call(
        "POST",
        "/auth/register",
        {
            "name": "Curl Demo",
            "email": email,
            "phone": phone,
            "password": password,
            "deviceId": "curl-doc",
        },
    )
    if code not in (200, 201) or "data" not in reg:
        raise SystemExit(f"register failed {code}: {reg}")

    code, login = call(
        "POST",
        "/auth/login",
        {"email": email, "password": password, "deviceId": "curl-doc"},
    )
    if code != 200 or "data" not in login:
        raise SystemExit(f"login failed {code}: {login}")

    data = login["data"]
    access = data["accessToken"]
    refresh = data["refreshToken"]
    user_id = data["user"]["id"]

    checks: dict[str, object] = {}
    code, me = call("GET", "/auth/me", token=access)
    checks["me"] = code == 200 and me.get("data", {}).get("user", {}).get("email")

    code, prods = call("GET", "/products?limit=2")
    products = (
        prods.get("data", {}).get("products")
        or prods.get("data", {}).get("items")
        or []
    )
    if not products:
        raise SystemExit(f"no products: {prods}")
    product_id = str(products[0]["_id"])
    product_slug = products[0].get("slug") or product_id
    checks["productId"] = product_id

    code, cart = call("POST", "/cart/items", {"productId": product_id, "quantity": 1}, token=access)
    checks["cart"] = code in (200, 201) and "data" in cart

    code, coupon = call("POST", "/cart/apply-coupon", {"code": "FORGE10"}, token=access)
    quote = (coupon.get("data") or {}).get("quote") or {}
    cart_body = (coupon.get("data") or {}).get("cart") or {}
    checks["coupon"] = cart_body.get("couponCode") or quote.get("couponCode")
    checks["discount"] = quote.get("discount")

    code, wish = call("POST", "/wishlist/toggle", {"productId": product_id}, token=access)
    checks["wishlist"] = code in (200, 201) and "data" in wish

    code, sessions = call("GET", "/auth/sessions", token=access)
    checks["sessions"] = code == 200 and "data" in sessions

    code, notif = call("GET", "/notifications", token=access)
    checks["notifications"] = code == 200 and "data" in notif

    code, reviews = call("GET", f"/reviews?productId={product_id}")
    checks["reviews"] = code == 200 and "data" in reviews

    code, svc = call("GET", "/serviceability?pincode=110001")
    checks["serviceability"] = code == 200 and "data" in svc

    md = f"""# API Details (LOCAL ONLY — gitignored)

Generated: {datetime.now(timezone.utc).isoformat()}

**Do not commit this file.** It contains live JWT material for local Postman/cURL.

Base URL: `{BASE}`

## Demo user (from smoke register/login)

- Email: `{email}`
- Password: `{password}`
- Phone: `{phone}`
- User id: `{user_id}`

## JWT

```text
ACCESS_TOKEN={access}
REFRESH_TOKEN={refresh}
```

Shell helpers:

```bash
export BASE={BASE}
export ACCESS='{access}'
export REFRESH='{refresh}'
export PRODUCT_ID='{product_id}'
```

Auth header: `Authorization: Bearer $ACCESS`  
Guest cart (when logged out): `X-Guest-Session: <uuid>`

---

## Auth

### Register
```bash
curl -sS -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \\
  -d '{{"name":"Curl Demo","email":"you@example.com","phone":"9876543210","password":"DemoPass123!","deviceId":"curl-doc"}}'
```

### Login
```bash
curl -sS -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","password":"{password}","deviceId":"curl-doc"}}'
```

### Me / refresh / logout
```bash
curl -sS "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' \\
  -d "{{\\"refreshToken\\":\\"$REFRESH\\"}}"
curl -sS -X POST "$BASE/auth/logout" -H 'Content-Type: application/json' \\
  -d "{{\\"refreshToken\\":\\"$REFRESH\\"}}"
```

### Forgot / reset / change password
```bash
curl -sS -X POST "$BASE/auth/forgot-password" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}"}}'
curl -sS -X POST "$BASE/auth/reset-password" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","code":"1234","password":"NewPass123!"}}'
curl -sS -X POST "$BASE/auth/change-password" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"currentPassword":"{password}","newPassword":"NewerPass123!"}}'
```

### Sessions / email verify / OTP
```bash
curl -sS "$BASE/auth/sessions" -H "Authorization: Bearer $ACCESS"
curl -sS -X DELETE "$BASE/auth/sessions/SESSION_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/auth/verify-email/send" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/auth/verify-email" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","code":"1234"}}'
curl -sS -X POST "$BASE/auth/otp/send" -H 'Content-Type: application/json' \\
  -d '{{"phone":"9876543210","purpose":"login"}}'
curl -sS -X POST "$BASE/auth/otp/verify" -H 'Content-Type: application/json' \\
  -d '{{"phone":"9876543210","code":"1234","purpose":"login","deviceId":"curl-doc"}}'
```

---

## Catalog / serviceability / coupons

```bash
curl -sS "$BASE/products?limit=10"
curl -sS "$BASE/products/featured"
curl -sS "$BASE/products/limited-drops"
curl -sS "$BASE/products/categories"
curl -sS "$BASE/products/franchises"
curl -sS "$BASE/products/suggestions?q=hoodie"
curl -sS "$BASE/products/{product_slug}"
curl -sS "$BASE/products/{product_slug}/related"
curl -sS "$BASE/serviceability?pincode=110001"
curl -sS "$BASE/coupons"
curl -sS -X POST "$BASE/coupons/validate" -H 'Content-Type: application/json' \\
  -d '{{"code":"FORGE10","subtotal":2000}}'
```

## Cart

```bash
curl -sS "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/cart/items" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}"
curl -sS -X PATCH "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"quantity":2}}'
curl -sS -X POST "$BASE/cart/apply-coupon" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"code":"FORGE10"}}'
curl -sS -X POST "$BASE/cart/remove-coupon" -H "Authorization: Bearer $ACCESS"
curl -sS -X DELETE "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -X DELETE "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/cart/merge" -H "Authorization: Bearer $ACCESS" -H 'X-Guest-Session: GUEST-UUID'
curl -sS -X POST "$BASE/cart/quote" -H 'Content-Type: application/json' \\
  -d "{{\\"items\\":[{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}]}}"
```

## Wishlist / addresses / reviews / notifications

```bash
curl -sS "$BASE/wishlist" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/wishlist/toggle" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\"}}"
curl -sS "$BASE/addresses" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/addresses" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"fullName":"Curl Demo","phone":"9876543210","line1":"12 Forge Lane","city":"Delhi","state":"DL","postalCode":"110001","isDefault":true}}'
curl -sS "$BASE/reviews?productId=$PRODUCT_ID"
curl -sS -X POST "$BASE/reviews" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\",\\"name\\":\\"Curl Demo\\",\\"rating\\":5,\\"body\\":\\"Solid piece.\\"}}"
curl -sS "$BASE/notifications" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/notifications/read-all" -H "Authorization: Bearer $ACCESS"
```

## Orders / payments

```bash
curl -sS "$BASE/orders" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/orders" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"paymentMethod\\":\\"cash_on_delivery\\",\\"shippingAddress\\":{{\\"fullName\\":\\"Curl Demo\\",\\"phone\\":\\"9876543210\\",\\"line1\\":\\"12 Forge Lane\\",\\"city\\":\\"Delhi\\",\\"state\\":\\"DL\\",\\"postalCode\\":\\"110001\\"}},\\"items\\":[{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}]}}"
curl -sS "$BASE/orders/ORDER_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -X POST "$BASE/orders/ORDER_ID/cancel" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Changed mind"}}'
curl -sS -X POST "$BASE/orders/ORDER_ID/return" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Damaged"}}'
curl -sS -X POST "$BASE/orders/ORDER_ID/exchange" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Wrong size"}}'
curl -sS -X POST "$BASE/payments/intents" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"orderId":"ORDER_ID","provider":"razorpay"}}'
curl -sS -X POST "$BASE/payments/razorpay/demo-complete" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"orderId":"ORDER_ID","providerIntentId":"order_demo_..."}}'
```

## Health

```bash
curl -sS http://localhost:4000/health
curl -sS http://localhost:4000/api/v1/health
```

## Smoke results

```json
{json.dumps(checks, indent=2)}
```

Regenerate anytime (API must be running):

```bash
python3 scripts/generate-api-details-local.py
```
"""
    OUT.write_text(md)
    print(f"wrote {OUT}")
    print("smoke_ok", json.dumps(checks))


if __name__ == "__main__":
    main()
