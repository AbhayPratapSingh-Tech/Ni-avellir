import type { MarketplaceOverview, Product } from './types/index.js';

export const demoProducts: Product[] = [
  {
    id: 'prod-odin-statue',
    name: 'Odin Desk Guardian',
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
    isLimitedDrop: true,
  },
  {
    id: 'prod-arcade-hoodie',
    name: 'Arcade Night Hoodie',
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
    isLimitedDrop: false,
  },
  {
    id: 'prod-rgb-mat',
    name: 'Runestone RGB Deskmat',
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
    isLimitedDrop: false,
  },
  {
    id: 'prod-controller-stand',
    name: 'Forged Controller Stand',
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
    isLimitedDrop: true,
  },
];

export const demoMarketplaceOverview: MarketplaceOverview = {
  products: demoProducts,
  featuredProductId: 'prod-odin-statue',
  cart: [
    { productId: 'prod-odin-statue', quantity: 1 },
    { productId: 'prod-rgb-mat', quantity: 1 },
  ],
  latestOrder: {
    id: 'ORD-NDV-1048',
    status: 'packed',
    total: 7798,
    currency: 'INR',
    estimatedDelivery: '2026-08-12',
    itemCount: 2,
  },
};
