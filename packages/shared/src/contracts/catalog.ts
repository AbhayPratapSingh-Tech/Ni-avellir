import type { ProductDetail, ProductSummary } from '../types/product.js';

export type CatalogResponse = {
  products: ProductSummary[];
  featured: ProductSummary[];
  categories: string[];
};

export type ProductDetailResponse = {
  product: ProductDetail;
};
