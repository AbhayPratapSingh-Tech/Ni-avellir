#!/usr/bin/env python3
"""Generate gitignored API details with JWT + cURLs.

Local (default): API on :4000 → API_DETAILS.local.md
Live Render:     python3 scripts/generate-api-details-local.py --live
                 → API_DETAILS.live.local.md
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCAL_BASE = "http://localhost:4000/api/v1"
LIVE_BASE = "https://ni-avellir.onrender.com/api/v1"


def call(
    base: str,
    method: str,
    path: str,
    body: dict | None = None,
    token: str | None = None,
    timeout: int = 90,
) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
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
    parser = argparse.ArgumentParser(description="Generate API JWT + cURL cheat sheet")
    parser.add_argument(
        "--live",
        action="store_true",
        help=f"Target Render live API ({LIVE_BASE}) and write API_DETAILS.live.local.md",
    )
    parser.add_argument("--base", default=None, help="Override API base URL")
    args = parser.parse_args()

    base = args.base or (LIVE_BASE if args.live else LOCAL_BASE)
    out = ROOT / ("API_DETAILS.live.local.md" if args.live or base == LIVE_BASE else "API_DETAILS.local.md")
    label = "LIVE RENDER" if "onrender.com" in base else "LOCAL ONLY"
    timeout = 90 if "onrender.com" in base else 30

    stamp = int(time.time())
    email = f"curl.demo.{stamp}@nidavellir.local"
    password = "DemoPass123!"
    # Last 10 digits must stay unique — phone is unique in User model.
    phone = f"9{stamp % 10_000_000_000:09d}"[-10:]

    code, reg = call(
        base,
        "POST",
        "/auth/register",
        {
            "name": "Curl Demo",
            "email": email,
            "phone": phone,
            "password": password,
            "deviceId": "curl-doc",
        },
        timeout=timeout,
    )
    if code not in (200, 201) or "data" not in reg:
        raise SystemExit(f"register failed {code}: {reg}")

    code, login = call(
        base,
        "POST",
        "/auth/login",
        {"email": email, "password": password, "deviceId": "curl-doc"},
        timeout=timeout,
    )
    if code != 200 or "data" not in login:
        raise SystemExit(f"login failed {code}: {login}")

    data = login["data"]
    access = data["accessToken"]
    refresh = data["refreshToken"]
    user_id = data["user"]["id"]

    checks: dict[str, object] = {}
    code, me = call(base, "GET", "/auth/me", token=access, timeout=timeout)
    checks["me"] = code == 200 and me.get("data", {}).get("user", {}).get("email")

    code, prods = call(base, "GET", "/products?limit=2", timeout=timeout)
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

    code, cart = call(
        base, "POST", "/cart/items", {"productId": product_id, "quantity": 1}, token=access, timeout=timeout
    )
    checks["cart"] = code in (200, 201) and "data" in cart

    code, coupon = call(
        base, "POST", "/cart/apply-coupon", {"code": "FORGE10"}, token=access, timeout=timeout
    )
    quote = (coupon.get("data") or {}).get("quote") or {}
    cart_body = (coupon.get("data") or {}).get("cart") or {}
    checks["coupon"] = cart_body.get("couponCode") or quote.get("couponCode")
    checks["discount"] = quote.get("discount")

    code, wish = call(
        base, "POST", "/wishlist/toggle", {"productId": product_id}, token=access, timeout=timeout
    )
    checks["wishlist"] = code in (200, 201) and "data" in wish

    code, sessions = call(base, "GET", "/auth/sessions", token=access, timeout=timeout)
    checks["sessions"] = code == 200 and "data" in sessions

    code, notif = call(base, "GET", "/notifications", token=access, timeout=timeout)
    checks["notifications"] = code == 200 and "data" in notif

    code, reviews = call(base, "GET", f"/reviews?productId={product_id}", timeout=timeout)
    checks["reviews"] = code == 200 and "data" in reviews

    code, svc = call(base, "GET", "/serviceability?pincode=110001", timeout=timeout)
    checks["serviceability"] = code == 200 and "data" in svc

    health_root = base.removesuffix("/api/v1")

    regen_cmd = "python3 scripts/generate-api-details-local.py --live" if "onrender.com" in base else "python3 scripts/generate-api-details-local.py"

    md = f"""# API Details ({label} — gitignored)

Generated: {datetime.now(timezone.utc).isoformat()}

**Do not commit this file.** It contains JWT material for Postman/cURL.

Base URL: `{base}`

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
export BASE={base}
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
curl -sS -m 90 -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \\
  -d '{{"name":"Curl Demo","email":"you@example.com","phone":"9876543210","password":"DemoPass123!","deviceId":"curl-doc"}}'
```

### Login
```bash
curl -sS -m 90 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","password":"{password}","deviceId":"curl-doc"}}'
```

### Me / refresh / logout
```bash
curl -sS -m 90 "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' \\
  -d "{{\\"refreshToken\\":\\"$REFRESH\\"}}"
curl -sS -m 90 -X POST "$BASE/auth/logout" -H 'Content-Type: application/json' \\
  -d "{{\\"refreshToken\\":\\"$REFRESH\\"}}"
```

### Forgot / reset / change password
```bash
curl -sS -m 90 -X POST "$BASE/auth/forgot-password" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}"}}'
curl -sS -m 90 -X POST "$BASE/auth/reset-password" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","code":"1234","password":"NewPass123!"}}'
curl -sS -m 90 -X POST "$BASE/auth/change-password" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"currentPassword":"{password}","newPassword":"NewerPass123!"}}'
```

### Sessions / email verify / OTP
```bash
curl -sS -m 90 "$BASE/auth/sessions" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X DELETE "$BASE/auth/sessions/SESSION_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/auth/verify-email/send" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/auth/verify-email" -H 'Content-Type: application/json' \\
  -d '{{"email":"{email}","code":"1234"}}'
curl -sS -m 90 -X POST "$BASE/auth/otp/send" -H 'Content-Type: application/json' \\
  -d '{{"phone":"9876543210","purpose":"login"}}'
curl -sS -m 90 -X POST "$BASE/auth/otp/verify" -H 'Content-Type: application/json' \\
  -d '{{"phone":"9876543210","code":"1234","purpose":"login","deviceId":"curl-doc"}}'
```

---

## Catalog / serviceability / coupons

```bash
curl -sS -m 90 "$BASE/products?limit=10"
curl -sS -m 90 "$BASE/products/featured"
curl -sS -m 90 "$BASE/products/limited-drops"
curl -sS -m 90 "$BASE/products/categories"
curl -sS -m 90 "$BASE/products/franchises"
curl -sS -m 90 "$BASE/products/suggestions?q=hoodie"
curl -sS -m 90 "$BASE/products/{product_slug}"
curl -sS -m 90 "$BASE/products/{product_slug}/related"
curl -sS -m 90 "$BASE/serviceability?pincode=110001"
curl -sS -m 90 "$BASE/coupons"
curl -sS -m 90 -X POST "$BASE/coupons/validate" -H 'Content-Type: application/json' \\
  -d '{{"code":"FORGE10","subtotal":2000}}'
```

## Cart

```bash
curl -sS -m 90 "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/cart/items" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}"
curl -sS -m 90 -X PATCH "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"quantity":2}}'
curl -sS -m 90 -X POST "$BASE/cart/apply-coupon" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"code":"FORGE10"}}'
curl -sS -m 90 -X POST "$BASE/cart/remove-coupon" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X DELETE "$BASE/cart/items/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X DELETE "$BASE/cart" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/cart/merge" -H "Authorization: Bearer $ACCESS" -H 'X-Guest-Session: GUEST-UUID'
curl -sS -m 90 -X POST "$BASE/cart/quote" -H 'Content-Type: application/json' \\
  -d "{{\\"items\\":[{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}]}}"
```

## Wishlist / addresses / reviews / notifications

```bash
curl -sS -m 90 "$BASE/wishlist" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/wishlist/toggle" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\"}}"
curl -sS -m 90 "$BASE/addresses" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/addresses" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"fullName":"Curl Demo","phone":"9876543210","line1":"12 Forge Lane","city":"Delhi","state":"DL","postalCode":"110001","isDefault":true}}'
curl -sS -m 90 "$BASE/reviews?productId=$PRODUCT_ID"
curl -sS -m 90 -X POST "$BASE/reviews" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"productId\\":\\"$PRODUCT_ID\\",\\"name\\":\\"Curl Demo\\",\\"rating\\":5,\\"body\\":\\"Solid piece.\\"}}"
curl -sS -m 90 "$BASE/notifications" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/notifications/read-all" -H "Authorization: Bearer $ACCESS"
```

## Orders / payments

```bash
curl -sS -m 90 "$BASE/orders" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/orders" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d "{{\\"paymentMethod\\":\\"cash_on_delivery\\",\\"shippingAddress\\":{{\\"fullName\\":\\"Curl Demo\\",\\"phone\\":\\"9876543210\\",\\"line1\\":\\"12 Forge Lane\\",\\"city\\":\\"Delhi\\",\\"state\\":\\"DL\\",\\"postalCode\\":\\"110001\\"}},\\"items\\":[{{\\"productId\\":\\"$PRODUCT_ID\\",\\"quantity\\":1}}]}}"
curl -sS -m 90 "$BASE/orders/ORDER_ID" -H "Authorization: Bearer $ACCESS"
curl -sS -m 90 -X POST "$BASE/orders/ORDER_ID/cancel" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Changed mind"}}'
curl -sS -m 90 -X POST "$BASE/orders/ORDER_ID/return" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Damaged"}}'
curl -sS -m 90 -X POST "$BASE/orders/ORDER_ID/exchange" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"reason":"Wrong size"}}'
curl -sS -m 90 -X POST "$BASE/payments/intents" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"orderId":"ORDER_ID","provider":"razorpay"}}'
curl -sS -m 90 -X POST "$BASE/payments/razorpay/confirm" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \\
  -d '{{"orderId":"ORDER_ID","providerIntentId":"order_...","providerPaymentId":"pay_...","signature":"..."}}'
```

## Health

```bash
curl -sS -m 90 {health_root}/health
curl -sS -m 90 {health_root}/api/v1/health
```

## Smoke results

```json
{json.dumps(checks, indent=2)}
```

Regenerate:

```bash
{regen_cmd}
```

Committed templates (no JWTs): `API_DETAILS.example.md` (local) · `API_DETAILS.live.example.md` (Render).
"""
    out.write_text(md)
    print(f"wrote {out}")
    print("smoke_ok", json.dumps(checks))


if __name__ == "__main__":
    main()