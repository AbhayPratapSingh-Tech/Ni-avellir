/** PLP filter / sort options returned by GET /products/filters (and mock). */

export type CatalogSortOption = {
  value: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  label: string;
};

export type CatalogPriceBucket = {
  id: string;
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

export type CatalogRatingOption = {
  value: number;
  label: string;
};

export type CatalogFilterOptions = {
  sorts: CatalogSortOption[];
  priceBuckets: CatalogPriceBucket[];
  ratings: CatalogRatingOption[];
  franchises: string[];
  categories: string[];
  priceMin: number;
  priceMax: number;
};

const DEFAULT_SORTS: CatalogSortOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Snap to shopper-friendly INR steps. */
export function roundPriceStep(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= 500) return Math.ceil(n / 50) * 50;
  if (n <= 2000) return Math.ceil(n / 100) * 100;
  if (n <= 5000) return Math.ceil(n / 500) * 500;
  return Math.ceil(n / 1000) * 1000;
}

export function buildPriceBuckets(priceMin: number, priceMax: number): CatalogPriceBucket[] {
  const any: CatalogPriceBucket = { id: 'any', label: 'Any price' };
  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMax <= 0) {
    return [any];
  }
  const min = Math.max(0, Math.floor(priceMin));
  const max = Math.max(min, Math.ceil(priceMax));
  if (min === max) {
    return [any, { id: `eq-${min}`, label: formatInr(min), minPrice: min, maxPrice: max }];
  }

  const span = max - min;
  let low = roundPriceStep(min + span * 0.33);
  let mid = roundPriceStep(min + span * 0.66);
  if (low <= min) low = roundPriceStep(min + Math.max(1, span * 0.2));
  if (mid <= low) mid = roundPriceStep(low + Math.max(1, span * 0.25));
  if (mid >= max) mid = Math.max(low + 1, max - 1);
  if (low >= mid) {
    return [
      any,
      { id: `under-${mid}`, label: `Under ${formatInr(mid)}`, maxPrice: mid },
      { id: `from-${mid + 1}`, label: `${formatInr(mid + 1)}+`, minPrice: mid + 1 },
    ];
  }

  return [
    any,
    { id: `under-${low}`, label: `Under ${formatInr(low)}`, maxPrice: low },
    {
      id: `${low + 1}-${mid}`,
      label: `${formatInr(low + 1)}–${formatInr(mid)}`,
      minPrice: low + 1,
      maxPrice: mid,
    },
    { id: `from-${mid + 1}`, label: `${formatInr(mid + 1)}+`, minPrice: mid + 1 },
  ];
}

export function buildRatingOptions(ratingMax: number): CatalogRatingOption[] {
  const options: CatalogRatingOption[] = [{ value: 0, label: 'Any' }];
  const max = Number.isFinite(ratingMax) ? ratingMax : 5;
  if (max >= 4) options.push({ value: 4, label: '4 & above' });
  if (max >= 3) options.push({ value: 3, label: '3 & above' });
  if (max >= 2) options.push({ value: 2, label: '2 & above' });
  return options;
}

export function buildCatalogFilterOptions(input: {
  categories: string[];
  franchises: string[];
  priceMin: number;
  priceMax: number;
  ratingMax: number;
}): CatalogFilterOptions {
  const categories = [...input.categories].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const franchises = [...input.franchises].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const priceMin = Number.isFinite(input.priceMin) ? input.priceMin : 0;
  const priceMax = Number.isFinite(input.priceMax) ? input.priceMax : 0;

  return {
    sorts: DEFAULT_SORTS,
    priceBuckets: buildPriceBuckets(priceMin, priceMax),
    ratings: buildRatingOptions(input.ratingMax),
    franchises,
    categories,
    priceMin,
    priceMax,
  };
}
