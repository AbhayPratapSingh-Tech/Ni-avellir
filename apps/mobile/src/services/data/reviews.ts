export type ProductReview = {
  id: string;
  productId: string;
  name: string;
  avatarUrl: string;
  rating: number;
  verified: boolean;
  body: string;
  helpful: number;
};

export const demoReviews: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod-odin-statue',
    name: 'Aarav Mehta',
    avatarUrl: 'https://i.pravatar.cc/80?img=12',
    rating: 5,
    verified: true,
    body: 'Paint work is sharp and the numbered card feels legit. Looks serious on a clean desk.',
    helpful: 24,
  },
  {
    id: 'rev-2',
    productId: 'prod-arcade-hoodie',
    name: 'Priya Nair',
    avatarUrl: 'https://i.pravatar.cc/80?img=32',
    rating: 4,
    verified: true,
    body: 'Heavy fleece, embroidery sits flat. Size up if you want the LAN-weekend drape.',
    helpful: 11,
  },
  {
    id: 'rev-3',
    productId: 'prod-rgb-mat',
    name: 'Rohan Kale',
    avatarUrl: 'https://i.pravatar.cc/80?img=15',
    rating: 5,
    verified: false,
    body: 'Stitching is tight and the edge light is low enough that it does not wash the monitor.',
    helpful: 8,
  },
  {
    id: 'rev-4',
    productId: 'prod-pro-jersey',
    name: 'Ishita Shah',
    avatarUrl: 'https://i.pravatar.cc/80?img=47',
    rating: 5,
    verified: true,
    body: 'Match-day fit. Sublimation did not crack after a wash.',
    helpful: 19,
  },
  {
    id: 'rev-5',
    productId: 'prod-drop-tee',
    name: 'Kabir Singh',
    avatarUrl: 'https://i.pravatar.cc/80?img=8',
    rating: 4,
    verified: false,
    body: 'Short run quality is there. Wish there was a size chart on the card.',
    helpful: 3,
  },
  {
    id: 'rev-6',
    productId: 'prod-mousepad-pro',
    name: 'Neha Desai',
    avatarUrl: 'https://i.pravatar.cc/80?img=25',
    rating: 5,
    verified: true,
    body: 'Stopping power is consistent. No edge peel after two weeks of grind.',
    helpful: 16,
  },
  {
    id: 'rev-7',
    productId: 'prod-void-hoodie',
    name: 'Devansh Rao',
    avatarUrl: 'https://i.pravatar.cc/80?img=5',
    rating: 4,
    verified: true,
    body: 'Zip is smooth and the reflective mark pops under booth lights.',
    helpful: 7,
  },
  {
    id: 'rev-8',
    productId: 'prod-forge-bundle',
    name: 'Meera Iyer',
    avatarUrl: 'https://i.pravatar.cc/80?img=44',
    rating: 5,
    verified: true,
    body: 'Mat and rest match perfectly. Bundle sleeve feels like a real drop.',
    helpful: 12,
  },
  {
    id: 'rev-9',
    productId: 'prod-monitor-light',
    name: 'Arjun Patel',
    avatarUrl: 'https://i.pravatar.cc/80?img=18',
    rating: 5,
    verified: false,
    body: 'No screen glare. Clamp held on a thin bezel without marks.',
    helpful: 9,
  },
  {
    id: 'rev-10',
    productId: 'prod-pixel-cart',
    name: 'Sana Qureshi',
    avatarUrl: 'https://i.pravatar.cc/80?img=36',
    rating: 5,
    verified: true,
    body: 'Pins are sharp. Sold out fast — glad I grabbed a set.',
    helpful: 21,
  },
];
