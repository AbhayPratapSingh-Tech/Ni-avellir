/**
 * In-place apparel size variants for nidavellir_uat (UAT phase).
 * Does not wipe themed names/art. Refuses any other database unless
 * MIGRATE_ALLOW_PRODUCTION=yes is set for a later production promote.
 *
 * Usage (UAT):
 *   npm run migrate:product-variants --workspace apps/api
 *
 * Usage (production, after Nidavellir promote only):
 *   MIGRATE_ALLOW_PRODUCTION=yes npm run migrate:product-variants --workspace apps/api
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import {
  buildSizeVariants,
  productHasVariants,
  shouldHaveSizeVariants,
  sumVariantStock,
  type ProductCategory,
} from '@nidavellir/shared';
import { Product } from '../modules/products/product.model.js';

const UAT_DB = 'nidavellir_uat';

function hideUri(message: string) {
  return message.replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, 'mongodb://***');
}

function databaseName(uri: string) {
  const noQuery = uri.split('?')[0] ?? uri;
  const parts = noQuery.split('/');
  return parts[parts.length - 1] || '';
}

function uatUriFromDevFile() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(here, '../../../.env.development');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split('\n').find((row) => row.startsWith('MONGODB_URI='));
  if (!line) throw new Error('MONGODB_URI missing from apps/api/.env.development');
  const value = line.slice('MONGODB_URI='.length).trim().replace(/^["']|["']$/g, '');
  const from = databaseName(value);
  if (!from) throw new Error('Could not parse database name from MONGODB_URI.');
  if (from === UAT_DB) return value;
  const at = value.lastIndexOf(from);
  if (at < 0) throw new Error('Could not find the database name in the URI path.');
  const next = `${value.slice(0, at)}${UAT_DB}${value.slice(at + from.length)}`;
  if (databaseName(next) !== UAT_DB) {
    throw new Error('Rewritten URI is not the UAT database.');
  }
  return next;
}

function resolveUri() {
  if (process.env.MIGRATE_ALLOW_PRODUCTION === 'yes' && process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  return uatUriFromDevFile();
}

async function main() {
  const uri = resolveUri();
  const targetDb = databaseName(uri);
  const allowProduction = process.env.MIGRATE_ALLOW_PRODUCTION === 'yes';

  if (targetDb !== UAT_DB && !allowProduction) {
    throw new Error(
      `Refusing database "${targetDb}". UAT phase only accepts ${UAT_DB}. ` +
        'Set MIGRATE_ALLOW_PRODUCTION=yes only after promoting to Nidavellir.',
    );
  }
  if (targetDb === UAT_DB || allowProduction) {
    // ok
  }

  await mongoose.connect(uri);
  const connected = mongoose.connection.db?.databaseName;
  if (!connected) throw new Error('No database on connection.');
  if (connected !== UAT_DB && !allowProduction) {
    throw new Error(`Connected to "${connected}", not ${UAT_DB}.`);
  }
  if (connected !== targetDb) {
    throw new Error(`Connected to "${connected}" but URI targeted "${targetDb}".`);
  }

  const products = await Product.find({})
    .select('_id slug name category tags stock variants sku')
    .lean();

  let updated = 0;
  let skipped = 0;
  for (const product of products) {
    if (productHasVariants(product)) {
      const sum = sumVariantStock(product.variants ?? []);
      if (sum !== product.stock) {
        await Product.updateOne({ _id: product._id }, { $set: { stock: sum } });
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    const category = product.category as ProductCategory;
    if (!shouldHaveSizeVariants(category, product.tags ?? [], product.name)) {
      skipped += 1;
      continue;
    }

    const productId = String(product._id);
    const variants = buildSizeVariants({
      productId,
      stock: product.stock,
      skuBase: product.sku,
    });
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          variants,
          stock: sumVariantStock(variants),
        },
      },
    );
    updated += 1;
  }

  const sample = await Product.find({ 'variants.0': { $exists: true } })
    .select('name category stock variants')
    .limit(5)
    .lean();

  console.log(
    JSON.stringify(
      {
        database: connected,
        updated,
        skipped,
        sample: sample.map((item) => ({
          name: item.name,
          category: item.category,
          stock: item.stock,
          variants: (item.variants ?? []).map((variant) => ({
            id: variant.id,
            size: variant.size,
            stock: variant.stock,
          })),
        })),
      },
      null,
      2,
    ),
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(hideUri(message));
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
