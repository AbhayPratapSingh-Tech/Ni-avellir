import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../modules/products/product.model.js';
import { logger } from '../common/logger/logger.js';

const products = [
  {
    name: 'Odin Desk Guardian',
    slug: 'odin-desk-guardian',
    category: 'collectibles',
    franchise: 'Mythic Realms',
    description: 'Hand-painted resin statue with numbered authenticity card.',
    price: 4499,
    currency: 'INR',
    rating: 4.9,
    reviewCount: 312,
    stock: 18,
    tags: ['Collector Grade', 'Numbered'],
    imageUrl:
      'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: true,
    isFeatured: true,
  },
  {
    name: 'Arcade Night Hoodie',
    slug: 'arcade-night-hoodie',
    category: 'apparel',
    franchise: 'Pixel Circuit',
    description: 'Heavyweight fleece hoodie with embroidered sleeve patch.',
    price: 2499,
    currency: 'INR',
    rating: 4.7,
    reviewCount: 184,
    stock: 42,
    tags: ['Oversized', 'Embroidered'],
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: false,
    isFeatured: true,
  },
  {
    name: 'Runestone RGB Deskmat',
    slug: 'runestone-rgb-deskmat',
    category: 'desk-gear',
    franchise: 'Nidavellir Forge',
    description: 'Extended stitched deskmat with low-profile RGB edge lighting.',
    price: 3299,
    currency: 'INR',
    rating: 4.8,
    reviewCount: 96,
    stock: 25,
    tags: ['RGB', 'XL'],
    imageUrl:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: false,
    isFeatured: true,
  },
  {
    name: 'Forged Controller Stand',
    slug: 'forged-controller-stand',
    category: 'limited-drops',
    franchise: 'Arena Masters',
    description: 'Metal display stand for controllers, headsets, and signed gear.',
    price: 1899,
    currency: 'INR',
    rating: 4.6,
    reviewCount: 71,
    stock: 9,
    tags: ['Metal Build', 'Drop 02'],
    imageUrl:
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: true,
    isFeatured: true,
  },
  {
    name: 'Viking Keyboard Keycaps',
    slug: 'viking-keyboard-keycaps',
    category: 'desk-gear',
    franchise: 'Nidavellir Forge',
    description: 'Double-shot PBT keycaps with a rune-inspired legend set.',
    price: 3999,
    currency: 'INR',
    rating: 4.5,
    reviewCount: 58,
    stock: 31,
    tags: ['PBT', 'Double-shot'],
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: false,
    isFeatured: false,
  },
  {
    name: 'Dwarven Gaming Chair',
    slug: 'dwarven-gaming-chair',
    category: 'limited-drops',
    franchise: 'Arena Masters',
    description: 'Ergonomic high-back chair with magnetic lumbar support.',
    price: 18999,
    currency: 'INR',
    rating: 4.8,
    reviewCount: 143,
    stock: 6,
    tags: ['Ergonomic', 'Drop 03'],
    imageUrl:
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: true,
    isFeatured: true,
  },
  {
    name: 'Rune Cloak Hoodie',
    slug: 'rune-cloak-hoodie',
    category: 'apparel',
    franchise: 'Mythic Realms',
    description: 'Premium French terry hoodie with woven rune emblem.',
    price: 2799,
    currency: 'INR',
    rating: 4.6,
    reviewCount: 89,
    stock: 27,
    tags: ['French Terry', 'Woven'],
    imageUrl:
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: false,
    isFeatured: false,
  },
  {
    name: 'Forbidden Vault Mousepad',
    slug: 'forbidden-vault-mousepad',
    category: 'desk-gear',
    franchise: 'Mythic Realms',
    description: 'Speed-optimized cloth pad with a gold-trimmed vault design.',
    price: 1499,
    currency: 'INR',
    rating: 4.4,
    reviewCount: 64,
    stock: 51,
    tags: ['Speed', 'Gold Trim'],
    imageUrl:
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=900&q=80',
    ],
    isLimitedDrop: false,
    isFeatured: false,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nidavellir_dev';
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB for seeding');

  await Product.deleteMany({});
  const inserted = await Product.insertMany(products);
  logger.info({ count: inserted.length }, 'Products seeded');

  await mongoose.disconnect();
  logger.info('Seed complete');
}

seed().catch((error) => {
  logger.error(error, 'Seed failed');
  process.exit(1);
});
