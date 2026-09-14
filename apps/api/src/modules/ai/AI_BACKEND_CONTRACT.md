# AI Backend Contract — Niðavellir

## Endpoint

`POST /api/v1/ai/chat`

### Headers

- `Authorization: Bearer <accessToken>` — optional for catalog/policy; **required** for cart mutations that need ownership, wishlist, and orders
- `X-Guest-Session: <id>` — guest cart (same as existing cart APIs)

### Request

```json
{
  "conversationId": "optional-string",
  "message": "Show me desk gear under 3000"
}
```

### Response (`AIResponse`)

Discriminated by `type`:

| type | fields |
|------|--------|
| `text` | `conversationId`, `message` |
| `product_results` | + `products[]` (live catalog only) |
| `cart` | + `cart` |
| `wishlist` | + `wishlist` |
| `order` | + `order` |
| `error` | + optional `code` |

Prices, stock, and order status always come from Mongo via existing services — never from the LLM alone.

## Tools (server-side)

- `searchProducts` → `ProductService.list`
- `getProductDetails` → `ProductService.getBySlug` / id
- `getCart` / `addToCart` / `removeFromCart` / `updateCartQuantity` / `clearCart` → `CartService`
- `getWishlist` / `addToWishlist` / `removeFromWishlist` → `WishlistService` (auth)
- `getOrders` / `getOrderDetails` / `trackOrder` → `OrderService` (auth + ownership)
- `searchKnowledgeBase` → local markdown under `knowledge/`

## Env

| Variable | Purpose |
|----------|---------|
| `AI_ENABLED` | `true` to serve chat (default true in development) |
| `OPENAI_API_KEY` | Enables LLM tool-calling; without it, stub orchestrator runs |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible base (default `https://api.openai.com/v1`) |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |

## Security

- Never put LLM keys in the mobile app
- Never trust LLM for auth, prices, stock, or order status
- Validate product IDs and order ownership in tool runners
