export type ShopCategory = {
  id: string;
  name: string;
  image: string;
  category?: string;
  q?: string;
  collection?: 'bestsellers' | 'deals' | 'also-like';
};

export const shopCategories: ShopCategory[] = [
  {
    id: 'controllers',
    name: 'Controllers',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=400&q=80',
    q: 'controller',
  },
  {
    id: 'tvs',
    name: 'TVs',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80',
    q: 'print',
  },
  {
    id: 'shirts',
    name: 'Shirts',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80',
    category: 'apparel',
  },
  {
    id: 'ps5',
    name: 'PS5',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80',
    q: 'forge',
  },
  {
    id: 'headsets',
    name: 'Headsets',
    image: 'https://images.unsplash.com/photo-1599669454699-248893617614?auto=format&fit=crop&w=400&q=80',
    q: 'headset',
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=400&q=80',
    q: 'keycap',
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=400&q=80',
    category: 'collectibles',
  },
  {
    id: 'jerseys',
    name: 'Jerseys',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
    q: 'jersey',
  },
  {
    id: 'caps',
    name: 'Caps',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
    q: 'cap',
  },
  {
    id: 'deskmats',
    name: 'Deskmats',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80',
    category: 'desk-gear',
  },
  {
    id: 'hoodies',
    name: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80',
    q: 'hoodie',
  },
  {
    id: 'drops',
    name: 'Drops',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&q=80',
    category: 'limited-drops',
  },
];
