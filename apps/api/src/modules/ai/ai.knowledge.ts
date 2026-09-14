/** Inlined knowledge — ships with `tsc` dist (Render). Keep in sync with `knowledge/*.md`. */

const DOCS: Array<{ source: string; text: string }> = [
  {
    source: 'faq.md',
    text: `## How long does shipping take?
Most orders leave the forge in 1–2 business days. Metro cities usually arrive in 3–5 days.

## Do you ship COD?
Yes. Cash on Delivery is available at checkout alongside UPI / card.

## Are sizes true to fit?
Apparel is listed with fit notes on the product page. Size swaps are handled within the return window.

## Is this official merch?
Items are fan-inspired studio drops unless marked as a licensed brand on the product card.

## Payment methods
UPI, cards, and Cash on Delivery (where available at checkout).`,
  },
  {
    source: 'returns.md',
    text: `## 7-day window
Start a return or exchange within 7 days of delivery. Items must be unused with tags on.

## What we take back
Apparel, desk gear, and most collectibles. Limited numbered drops are final sale unless damaged.

## How to start
Open Orders, pick the item, and write Support with your order number. We reply with a pickup slot.

## Cancel order
You can cancel before the order ships via My Orders. Once shipped, use the return flow after delivery.`,
  },
  {
    source: 'shipping.md',
    text: `## Dispatch
Orders typically leave the forge in 1–2 business days after confirmation.

## Delivery ETA
Metro cities: about 3–5 days after dispatch. Other areas may take longer depending on pincode serviceability checked at checkout.

## Tracking
Open My Orders in the app to see status (placed, packed, shipped, delivered). Status always comes from live order data.

## Free shipping
Shipping charges and free-shipping thresholds depend on pincode serviceability and cart total at checkout.`,
  },
];

type Chunk = {
  source: string;
  text: string;
};

let cachedChunks: Chunk[] | null = null;

function loadChunks(): Chunk[] {
  if (cachedChunks) return cachedChunks;
  const chunks: Chunk[] = [];
  for (const doc of DOCS) {
    const parts = doc.text.split(/\n##\s+/).map((part, index) => {
      if (index === 0) return part.trim();
      return `## ${part}`.trim();
    });
    for (const part of parts) {
      if (part.length < 20) continue;
      chunks.push({ source: doc.source, text: part });
    }
  }
  cachedChunks = chunks;
  return chunks;
}

/** Simple keyword overlap retrieval — no vector DB. */
export function searchKnowledgeBase(query: string, limit = 3): Array<{ source: string; text: string }> {
  const q = query.toLowerCase();
  const terms = q
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
  if (!terms.length) return [];

  const scored = loadChunks()
    .map((chunk) => {
      const lower = chunk.text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 1;
      }
      return { ...chunk, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ source, text }) => ({ source, text }));
}
