import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';
import { Wishlist } from './wishlist.model.js';

function isMongoObjectId(value: string) {
  return Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value;
}

function canonicalProductId(product: { _id: unknown }): string {
  return String(product._id);
}

export class WishlistService {
  private async getOrCreate(userId: string) {
    let list = await Wishlist.findOne({ userId });
    if (!list) list = await Wishlist.create({ userId, productIds: [] });
    return list;
  }

  /** Resolve Mongo `_id` or catalog slug to the product document. */
  private async resolveProduct(ref: string) {
    const key = String(ref || '').trim();
    if (!key) return null;
    if (isMongoObjectId(key)) {
      return Product.findById(key).lean();
    }
    const slug = key.startsWith('prod-') ? key.slice(5) : key;
    return Product.findOne({ slug }).lean();
  }

  private async loadProductsByIds(ids: string[]) {
    const unique = [...new Set(ids.map(String).filter(Boolean))];
    if (!unique.length) return [];

    const objectIds = unique.filter(isMongoObjectId);
    const slugs = unique
      .filter((id) => !isMongoObjectId(id))
      .map((id) => (id.startsWith('prod-') ? id.slice(5) : id));

    const filter =
      objectIds.length && slugs.length
        ? { $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] }
        : objectIds.length
          ? { _id: { $in: objectIds } }
          : { slug: { $in: slugs } };

    return Product.find(filter).lean();
  }

  /** Keep only canonical Mongo ids that still resolve; drop orphans / duplicate slugs. */
  private async sanitizeProductIds(productIds: string[]) {
    const products = await this.loadProductsByIds(productIds);
    const byRef = new Map<string, string>();
    for (const product of products) {
      const id = canonicalProductId(product);
      byRef.set(id, id);
      if (product.slug) {
        byRef.set(String(product.slug), id);
        byRef.set(`prod-${product.slug}`, id);
      }
    }

    const canonical: string[] = [];
    const seen = new Set<string>();
    for (const ref of productIds) {
      const id = byRef.get(String(ref));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      canonical.push(id);
    }
    return { canonical, products: products.filter((p) => seen.has(canonicalProductId(p))) };
  }

  async get(userId: string) {
    const list = await this.getOrCreate(userId);
    const { canonical, products } = await this.sanitizeProductIds(list.productIds.map(String));

    if (
      canonical.length !== list.productIds.length ||
      canonical.some((id, index) => id !== String(list.productIds[index]))
    ) {
      list.productIds = canonical;
      await list.save();
    }

    // Preserve wishlist order (canonical order).
    const byId = new Map(products.map((p) => [canonicalProductId(p), p]));
    const ordered = canonical.map((id) => byId.get(id)).filter(Boolean);
    return { productIds: canonical, products: ordered };
  }

  async toggle(userId: string, productId: string) {
    const product = await this.resolveProduct(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    const canonicalId = canonicalProductId(product);
    const list = await this.getOrCreate(userId);

    // Normalize any legacy slug / prod-* entries before toggling.
    const { canonical } = await this.sanitizeProductIds(list.productIds.map(String));
    const exists = canonical.includes(canonicalId);
    const next = exists
      ? canonical.filter((id) => id !== canonicalId)
      : [...canonical, canonicalId];

    list.productIds = next;
    await list.save();
    return { productIds: list.productIds, added: !exists, productId: canonicalId };
  }

  async remove(userId: string, productId: string) {
    const product = await this.resolveProduct(productId);
    const list = await this.getOrCreate(userId);
    const { canonical } = await this.sanitizeProductIds(list.productIds.map(String));

    const dropIds = new Set<string>();
    if (product) {
      dropIds.add(canonicalProductId(product));
    } else {
      // Still drop exact / slug variants if product was deleted from catalog.
      dropIds.add(String(productId));
      if (String(productId).startsWith('prod-')) dropIds.add(String(productId).slice(5));
    }

    list.productIds = canonical.filter((id) => !dropIds.has(id));
    await list.save();
    return { productIds: list.productIds };
  }
}
