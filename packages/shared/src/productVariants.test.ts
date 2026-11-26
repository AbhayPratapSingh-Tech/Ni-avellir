import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSizeVariants,
  cartLineKey,
  productAvailableStock,
  requiresVariantSelection,
  sumVariantStock,
  withApparelVariants,
} from './productVariants.js';
import type { Product } from './types/index.js';

test('buildSizeVariants splits stock across S/M/L/XL', () => {
  const variants = buildSizeVariants({ productId: 'prod-hoodie', stock: 42, skuBase: 'nw1' });
  assert.equal(variants.length, 4);
  assert.equal(sumVariantStock(variants), 42);
  assert.equal(variants[0]?.size, 'S');
  assert.equal(variants[1]?.size, 'M');
  assert.ok((variants[1]?.stock ?? 0) >= (variants[0]?.stock ?? 0));
});

test('cart lines with different sizes stay distinct', () => {
  assert.notEqual(cartLineKey('p1', 'p1-size-s'), cartLineKey('p1', 'p1-size-m'));
  assert.equal(cartLineKey('p1'), cartLineKey('p1', undefined));
});

test('withApparelVariants adds sizes for apparel only', () => {
  const apparel = withApparelVariants({
    id: 'prod-tee',
    name: 'Pixel Tee',
    category: 'apparel',
    franchise: 'Forge',
    brand: 'Forge',
    description: 'Tee',
    price: 999,
    compareAtPrice: 1299,
    currency: 'INR',
    rating: 4.5,
    reviewCount: 10,
    stock: 24,
    tags: ['tee'],
    imageUrl: 'https://example.com/t.png',
    imageUrls: [],
    isLimitedDrop: false,
    sku: 'nwtee',
    runeXp: 10,
    specifications: { Colorway: 'Ink' },
    additionalDetails: '',
  } satisfies Product);

  assert.equal(requiresVariantSelection(apparel), true);
  assert.equal(apparel.variants?.length, 4);
  assert.equal(apparel.stock, 24);
  assert.equal(apparel.variants?.[0]?.color, 'Ink');
  assert.equal(productAvailableStock(apparel, apparel.variants?.[1]?.id), apparel.variants?.[1]?.stock);

  const figure = withApparelVariants({
    ...apparel,
    id: 'prod-figure',
    category: 'collectibles',
    name: 'Statue',
    tags: [],
    variants: undefined,
    stock: 5,
  });
  assert.equal(requiresVariantSelection(figure), false);
  assert.equal(figure.stock, 5);
});
