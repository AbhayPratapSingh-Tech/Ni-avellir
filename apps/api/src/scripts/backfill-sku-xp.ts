/**
 * Backfill sku (nw#####) + runeXp on existing products without wiping the catalog.
 * Usage: npm run seed:sku --workspace apps/api
 * (or: npx tsx src/scripts/backfill-sku-xp.ts from apps/api)
 */
import mongoose from 'mongoose';
import { loadEnv } from '../config/env.js';
import { Product } from '../modules/products/product.model.js';
import { logger } from '../common/logger/logger.js';

function skuFromSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const n = (hash % 90000) + 10000;
  return `nw${n}`;
}

function runeXpFromPrice(price: number): number {
  return Math.max(10, Math.round(price / 50));
}

async function main() {
  const { mongodbUri } = loadEnv();
  await mongoose.connect(mongodbUri);
  const products = await Product.find({}).select('_id slug price sku runeXp');
  let updated = 0;
  const used = new Set<string>();

  for (const product of products) {
    let sku = product.sku?.toLowerCase() || skuFromSlug(product.slug);
    while (used.has(sku)) {
      const n = (Number(sku.replace(/\D/g, '')) + 1) % 100000;
      sku = `nw${String(n).padStart(5, '0')}`;
    }
    used.add(sku);
    const runeXp = product.runeXp && product.runeXp > 0 ? product.runeXp : runeXpFromPrice(product.price);
    await Product.updateOne({ _id: product._id }, { $set: { sku, runeXp } });
    updated += 1;
  }

  logger.info({ updated }, 'Backfilled product sku + runeXp');
  await mongoose.disconnect();
}

main().catch((error) => {
  logger.error(error, 'backfill-sku-xp failed');
  process.exit(1);
});
