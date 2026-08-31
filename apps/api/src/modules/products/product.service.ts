import { ALSO_LIKE_TAG } from '@nidavellir/shared';
import { Product } from './product.model.js';

export type ListProductsQuery = {
  category?: string;
  search?: string;
  franchise?: string;
  collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking';
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
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), PAGE_SIZE_MAX);

    if (query.collection === 'deals') {
      const items = await this.getDeals(Math.max(limit, 20));
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) || 1 },
      };
    }

    if (query.collection === 'bestsellers') {
      const items = await this.getBestSellers(Math.max(limit, 20));
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) || 1 },
      };
    }

    const filter: Record<string, unknown> = {};

    if (query.category) {
      filter.category = query.category;
    }
    if (query.franchise) {
      filter.franchise = query.franchise;
    }
    if (query.collection === 'also-like') {
      filter.tags = ALSO_LIKE_TAG;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter['$gte'] = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter['$lte'] = query.maxPrice;
      filter.price = priceFilter;
    }
    if (query.collection === 'restocking') {
      filter.stock = 0;
    } else if (query.inStockOnly || query.collection === 'also-like') {
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

  async getDeals(limit = 6) {
    const products = await Product.find({ stock: { $gt: 0 } }).lean();
    return products
      .map((product) => {
        const compareAt = product.compareAtPrice ?? product.price;
        return { product, savings: compareAt - product.price };
      })
      .filter((row) => row.savings > 0)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, limit)
      .map((row) => row.product);
  }

  async getBestSellers(limit = 6) {
    return Product.find({ stock: { $gt: 0 } })
      .sort({ reviewCount: -1, rating: -1 })
      .limit(limit)
      .lean();
  }

  async getSuggestions(q?: string) {
    const filter: Record<string, unknown> = {};
    if (q?.trim()) {
      filter.name = { $regex: q.trim(), $options: 'i' };
    }
    const products = await Product.find(filter).limit(20).lean();
    const queries = [
      ...new Set(
        products.flatMap((p) => [p.name.split(' ')[0], ...(p.tags ?? [])].filter(Boolean)),
      ),
    ].slice(0, 8);
    const [categories, franchises] = await Promise.all([
      Product.distinct('category'),
      Product.distinct('franchise'),
    ]);
    return {
      queries,
      categories,
      franchises,
      brands: franchises,
    };
  }

  async getRelated(slug: string, limit = 8) {
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return { similar: [], alsoLike: [] };
    }
    const [similar, alsoLike] = await Promise.all([
      Product.find({ category: product.category, slug: { $ne: slug }, stock: { $gt: 0 } })
        .limit(limit)
        .lean(),
      Product.find({ franchise: product.franchise, slug: { $ne: slug }, stock: { $gt: 0 } })
        .limit(limit)
        .lean(),
    ]);
    return { similar, alsoLike };
  }
}
