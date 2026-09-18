import mongoose from 'mongoose';
import { demoProducts } from '@nidavellir/shared';
import type { Product } from '@nidavellir/shared';
import { loadEnv } from '../config/env.js';
import { Product as ProductModel } from '../modules/products/product.model.js';
import { Coupon } from '../modules/coupons/coupon.model.js';
import { ServiceabilityRule } from '../modules/serviceability/serviceability.model.js';
import { logger } from '../common/logger/logger.js';

function productIdToSlug(id: string): string {
  return id.startsWith('prod-') ? id.slice(5) : id;
}

function toSeedDoc(product: Product) {
  const galleryUrls = product.imageUrls?.length
    ? product.imageUrls.filter((url) => url !== product.imageUrl)
    : [];

  return {
    name: product.name,
    slug: productIdToSlug(product.id),
    category: product.category,
    franchise: product.franchise,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    tags: product.tags,
    bundleTag: product.bundleTag,
    isBundleMain: Boolean(product.isBundleMain),
    imageUrl: product.imageUrl,
    galleryUrls,
    isLimitedDrop: product.isLimitedDrop,
    isFeatured: product.isLimitedDrop || product.rating >= 4.8,
    sku: product.sku,
    runeXp: product.runeXp,
  };
}

const products = demoProducts.map(toSeedDoc);

async function seed() {
  const { mongodbUri } = loadEnv();
  await mongoose.connect(mongodbUri);
  logger.info('Connected to MongoDB for seeding');

  await ProductModel.deleteMany({});
  const inserted = await ProductModel.insertMany(products);
  logger.info({ count: inserted.length }, 'Products seeded');

  await ServiceabilityRule.deleteMany({});
  await ServiceabilityRule.insertMany([
    {
      pincodePrefix: '000',
      codAvailable: true,
      shippingCharge: 99,
      freeShippingThreshold: 1499,
      etaDays: 5,
      active: true,
    },
    {
      pincodePrefix: '110',
      codAvailable: true,
      shippingCharge: 79,
      freeShippingThreshold: 999,
      etaDays: 3,
      active: true,
    },
    {
      pincodePrefix: '500',
      codAvailable: false,
      shippingCharge: 129,
      freeShippingThreshold: 1999,
      etaDays: 6,
      active: true,
    },
  ]);
  logger.info('Serviceability rules seeded');

  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: 'FORGE10',
      description: 'FORGE10: Get 10% off on cart value ₹999 and above.',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 500,
      productIds: [],
      categories: [],
      userIds: [],
      firstOrderOnly: false,
      usageLimit: 1000,
      usedCount: 0,
      active: true,
    },
    {
      code: 'WELCOME100',
      description: 'WELCOME100: Get ₹100 off on cart value ₹499 and above.',
      discountType: 'flat',
      discountValue: 100,
      minOrderValue: 499,
      productIds: [],
      categories: [],
      userIds: [],
      firstOrderOnly: true,
      usageLimit: 500,
      usedCount: 0,
      active: true,
    },
    {
      code: 'SUMMER10',
      description: 'SUMMER10: Get 10% off on Cart value 6,000 and above.',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 6000,
      maxDiscount: 1000,
      productIds: [],
      categories: [],
      userIds: ['8750996351'],
      firstOrderOnly: false,
      usageLimit: 1000,
      usedCount: 0,
      active: true,
    },
    {
      code: 'JUSTFORYOU',
      description: 'JUSTFORYOU: Get ₹250 off on Cart value 2,000 and above.',
      discountType: 'flat',
      discountValue: 250,
      minOrderValue: 2000,
      productIds: [],
      categories: [],
      userIds: ['8750996351'],
      firstOrderOnly: false,
      usageLimit: 500,
      usedCount: 0,
      active: true,
    },
  ]);
  logger.info('Coupons seeded');

  await mongoose.disconnect();
  logger.info('Seed complete');
}

seed().catch((error) => {
  logger.error(error, 'Seed failed');
  process.exit(1);
});
