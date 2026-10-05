/** Stable catalog tag for the Drop Zone eligible pool (seed once; do not rotate in DB). */
export const DROP_ZONE_TAG = 'drop-zone-eligible';

/** How many Drop Zone SKUs surface each calendar day (Asia/Kolkata). */
export const DROP_ZONE_DAILY_COUNT = 4;

type DropZoneCandidate = {
  id?: string;
  _id?: unknown;
  tags?: string[];
  stock?: number;
};

/** YYYY-MM-DD in India for consistent API + college demo rotation. */
export function dropZoneDayKey(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function candidateId(item: DropZoneCandidate): string {
  if (item.id != null && String(item.id)) return String(item.id);
  if (item._id != null) return String(item._id);
  return '';
}

/**
 * Pick today's Drop Zone slice from an eligible pool.
 * Prefer in-stock items; fall back to the full eligible set if the pool is thin.
 */
export function pickDropZoneProducts<T extends DropZoneCandidate>(
  products: T[],
  now = new Date(),
  count = DROP_ZONE_DAILY_COUNT,
): T[] {
  const eligible = products.filter((item) => (item.tags ?? []).includes(DROP_ZONE_TAG));
  if (!eligible.length) return [];

  const inStock = eligible.filter((item) => (item.stock ?? 0) > 0);
  const pool = inStock.length >= Math.min(count, eligible.length) ? inStock : eligible;
  const day = dropZoneDayKey(now);

  return [...pool]
    .sort((a, b) => hashString(`${day}:${candidateId(a)}`) - hashString(`${day}:${candidateId(b)}`))
    .slice(0, Math.min(count, pool.length));
}
