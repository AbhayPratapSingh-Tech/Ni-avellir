import { Product } from './product.model.js';

export type ListProductsQuery = {
  category?: string;
  search?: string;
  franchise?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
};

const PAGE_SIZE_MAX = 50;

export class ProductService {
  async list(query: ListProductsQuery = {}) {
    const filter: Record<string, unknown> = {};

    if (query.category) {
      filter.category = query.category;
    }
    if (query.franchise) {
      filter.franchise = query.franchise;
    }
if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter['$gte'] = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter['$lte'] = query.maxPrice;
      filter.price = priceFilter;
    }
    if (query.inStockOnly) {
      filter.stock = { $gt: 0 };
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), PAGE_SIZE_MAX);
    const skip = (page - 1) * limit;
    const sort = sortMap[query.sort ?? 'newest'] ?? sortMap.newest;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getBySlug(slug: string) {
    return Product.findOne({ slug }).lean();
  }

  async getCategories() {
    const categories = await Product.distinct('category');
    return categories;
  }

  async getFranchises() {
    const franchises = await Product.distinct('franchise');
    return franchises;
  }

  async getFeatured() {
    return Product.find({ isFeatured: true, stock: { $gt: 0 } }).limit(10).lean();
  }

  async getLimitedDrops() {
    return Product.find({ isLimitedDrop: true, stock: { $gt: 0 } }).limit(10).lean();
  }
}
