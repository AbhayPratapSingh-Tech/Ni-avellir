/**
 * Upsert coupons + store locator pins without wiping the product catalog.
 * Usage (from repo root):
 *   npm run seed:ops --workspace apps/api
 */
import mongoose from 'mongoose';
import { loadEnv } from '../config/env.js';
import { Coupon } from '../modules/coupons/coupon.model.js';
import { Store } from '../modules/stores/stores.model.js';
import { logger } from '../common/logger/logger.js';

async function seedOps() {
  const { mongodbUri } = loadEnv();
  await mongoose.connect(mongodbUri);
  logger.info(
    { mongo: mongodbUri.replace(/\/\/.*@/, '//***@') },
    'Connected for ops seed (coupons + stores)',
  );

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
  logger.info({ count: await Coupon.countDocuments() }, 'Coupons seeded');

  await Store.deleteMany({});
  await Store.insertMany([
    {
      name: 'Niðavellir Flagship — Bengaluru',
      address: '12 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      lat: 12.9716,
      lng: 77.5946,
      phone: '+91 80 0000 0000',
      active: true,
    },
    {
      name: 'Niðavellir — Mumbai',
      address: '45 Linking Road, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      lat: 19.0596,
      lng: 72.8295,
      phone: '+91 22 0000 0000',
      active: true,
    },
    {
      name: 'Niðavellir — Jaipur',
      address: 'C-Scheme, MI Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      lat: 26.9124,
      lng: 75.7873,
      phone: '+91 141 0000 000',
      active: true,
    },
    {
      name: 'Niðavellir — Delhi',
      address: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      lat: 28.6315,
      lng: 77.2167,
      phone: '+91 11 0000 0000',
      active: true,
    },
  ]);
  logger.info({ count: await Store.countDocuments() }, 'Stores seeded');

  await mongoose.disconnect();
  logger.info('Ops seed complete');
}

seedOps().catch((error) => {
  logger.error(error, 'Ops seed failed');
  process.exit(1);
});
