import { ALSO_LIKE_TAG, DROP_ZONE_TAG, pickDropZoneProducts } from '@nidavellir/shared';
import { Types } from 'mongoose';
import { Order } from '../orders/order.model.js';
import { Wishlist } from '../wishlist/wishlist.model.js';
import { Product } from './product.model.js';
import type { Env } from '../../config/env.js';
import { extractVisualSearchHints } from './visual-search.js';

export type ListProductsQuery = {
  category?: string;
  search?: string;
  franchise?: string;
  /** Exact tag match (e.g. anime). Facet filter — not text search. */
  tag?: string;
  collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking' | 'drop-zone';
  /** Bundle code e.g. DEMON_PR — matches bundleTag or tags. */
  bundleTag?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
};

function isMongoObjectId(value: string) {
  return Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value;
}

const PAGE_SIZE_MAX = 50;

export class ProductService {
  async list(query: ListProductsQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), PAGE_SIZE_MAX);

    if (query.collection === 'deals') {
      const fetchLimit = Math.min(PAGE_SIZE_MAX, Math.max(limit * page, limit));
      const items = await this.getDeals(fetchLimit);
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: items.length,
          pages: Math.ceil(items.length / limit) || 1,
        },
      };
    }

    if (query.collection === 'bestsellers') {
      const fetchLimit = Math.min(PAGE_SIZE_MAX, Math.max(limit * page, limit));
      const items = await this.getBestSellers(fetchLimit);
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: items.length,
          pages: Math.ceil(items.length / limit) || 1,
        },
      };
    }

    if (query.collection === 'drop-zone') {
      const pool = await Product.find({ tags: DROP_ZONE_TAG }).lean();
      const items = pickDropZoneProducts(pool);
      return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: items.length,
          pages: Math.ceil(items.length / limit) || 1,
        },
      };
    }

    const filter: Record<string, unknown> = {};

    if (query.category) {
      filter.category = query.category;
    }
    if (query.franchise) {
      filter.franchise = query.franchise;
    }
    if (query.tag?.trim()) {
      filter.tags = query.tag.trim();
    }
    if (query.bundleTag) {
      filter.$or = [{ bundleTag: query.bundleTag }, { tags: query.bundleTag }];
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
    if (Types.ObjectId.isValid(slug) && String(new Types.ObjectId(slug)) === slug) {
      const byId = await Product.findById(slug).lean();
      if (byId) return byId;
    }
    return Product.findOne({ slug }).lean();
  }

  /**
   * Bundles derived from live catalog: products that have `bundleTag`.
   * Main item = isBundleMain, else first by reviewCount.
   */
  async listBundles() {
    const products = await Product.find({
      bundleTag: { $exists: true, $nin: [null, ''] },
    })
      .sort({ reviewCount: -1 })
      .lean();

    const byTag = new Map<string, typeof products>();
    for (const product of products) {
      const tag = String(product.bundleTag ?? '').trim();
      if (!tag) continue;
      const list = byTag.get(tag) ?? [];
      list.push(product);
      byTag.set(tag, list);
    }

    return [...byTag.entries()].map(([tag, items]) => {
      const main =
        items.find((item) => item.isBundleMain) ??
        items.slice().sort((a, b) => b.reviewCount - a.reviewCount)[0]!;
      return {
        tag,
        name: `${main.franchise} Bundle`,
        subtitle: `${items.length}-piece set`,
        bannerImage: main.imageUrl,
        mainProductSlug: main.slug,
        mainProduct: main,
        products: items,
      };
    });
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
    const capped = Math.min(Math.max(1, limit), PAGE_SIZE_MAX);
    return Product.aggregate([
      {
        $match: {
          stock: { $gt: 0 },
          compareAtPrice: { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          savings: { $subtract: ['$compareAtPrice', '$price'] },
        },
      },
      { $match: { savings: { $gt: 0 } } },
      { $sort: { savings: -1 } },
      { $limit: capped },
      { $project: { savings: 0 } },
    ]);
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

  /**
   * Vision photo → catalog list. Never invents SKUs; empty products when vision unavailable.
   */
  async visualSearch(
    env: Env,
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<{
    query: string;
    franchise?: string;
    category?: string;
    products: Awaited<ReturnType<ProductService['getBestSellers']>>;
    reason?: 'vision_unavailable';
  }> {
    const hints = await extractVisualSearchHints(env, imageBuffer, mimeType);
    if (!hints) {
      return { query: '', products: [], reason: 'vision_unavailable' };
    }
    const listed = await this.list({
      search: hints.search,
      franchise: hints.franchise,
      category: hints.category,
      inStockOnly: true,
      limit: 20,
      page: 1,
      sort: 'newest',
    });
    return {
      query: hints.search,
      franchise: hints.franchise,
      category: hints.category,
      products: listed.items,
    };
  }

  /**
   * Personalized shelf from recent views + wishlist + recent orders.
   * Guests / no signals → bestsellers. Catalog read only (not a money path).
   */
  async getForYou(input: {
    userId?: string;
    recentIds?: string[];
    limit?: number;
  }) {
    const limit = Math.min(Math.max(1, input.limit ?? 12), PAGE_SIZE_MAX);
    const recentIds = (input.recentIds ?? []).map(String).filter(Boolean).slice(0, 12);

    const signalIds = new Set<string>(recentIds);
    if (input.userId) {
      const [wishlist, orders] = await Promise.all([
        Wishlist.findOne({ userId: input.userId }).lean(),
        Order.find({
          userId: input.userId,
          status: { $nin: ['pending_payment'] },
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
      ]);
      for (const id of wishlist?.productIds ?? []) {
        signalIds.add(String(id));
      }
      for (const order of orders) {
        for (const item of order.items ?? []) {
          if (item.productId) signalIds.add(String(item.productId));
        }
      }
    }

    if (!signalIds.size) {
      return this.getBestSellers(limit);
    }

    const idList = [...signalIds];
    const objectIds = idList.filter(isMongoObjectId);
    const slugs = idList
      .filter((id) => !isMongoObjectId(id))
      .map((id) => (id.startsWith('prod-') ? id.slice(5) : id));
    const seedFilter =
      objectIds.length && slugs.length
        ? { $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] }
        : objectIds.length
          ? { _id: { $in: objectIds } }
          : { slug: { $in: slugs } };
    const seeds = await Product.find(seedFilter).lean();

    const franchises = new Set(seeds.map((p) => p.franchise).filter(Boolean));
    const categories = new Set(seeds.map((p) => p.category).filter(Boolean));
    const tags = new Set(seeds.flatMap((p) => p.tags ?? []).filter(Boolean));
    const seedIdSet = new Set(seeds.map((p) => String(p._id)));

    if (!franchises.size && !categories.size && !tags.size) {
      return this.getBestSellers(limit);
    }

    const candidates = await Product.find({ stock: { $gt: 0 } })
      .sort({ reviewCount: -1, rating: -1 })
      .limit(120)
      .lean();

    const scored = candidates
      .map((product) => {
        let score = 0;
        if (franchises.has(product.franchise)) score += 8;
        if (categories.has(product.category)) score += 4;
        for (const tag of product.tags ?? []) {
          if (tags.has(tag)) {
            score += 2;
            break;
          }
        }
        if (seedIdSet.has(String(product._id))) score -= 20;
        return { product, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || b.product.reviewCount - a.product.reviewCount);

    const picked = scored.map((row) => row.product);
    if (picked.length >= limit) {
      return picked.slice(0, limit);
    }

    const pad = await this.getBestSellers(limit);
    const seen = new Set(picked.map((p) => String(p._id)));
    for (const product of pad) {
      const id = String(product._id);
      if (seen.has(id)) continue;
      picked.push(product);
      seen.add(id);
      if (picked.length >= limit) break;
    }
    return picked.slice(0, limit);
  }

  async getRelated(slug: string, limit = 8) {
    let product = await Product.findOne({ slug }).lean();
    if (
      !product &&
      Types.ObjectId.isValid(slug) &&
      String(new Types.ObjectId(slug)) === slug
    ) {
      product = await Product.findById(slug).lean();
    }
    if (!product) {
      return { similar: [], alsoLike: [] };
    }
    const productSlug = product.slug;
    const [similar, alsoLike] = await Promise.all([
      Product.find({ category: product.category, slug: { $ne: productSlug }, stock: { $gt: 0 } })
        .limit(limit)
        .lean(),
      Product.find({ franchise: product.franchise, slug: { $ne: productSlug }, stock: { $gt: 0 } })
        .limit(limit)
        .lean(),
    ]);
    return { similar, alsoLike };
  }
}
