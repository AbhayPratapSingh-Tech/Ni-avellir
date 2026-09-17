import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { Coupon } from '../coupons/coupon.model.js';
import { Product } from '../products/product.model.js';
import { serviceabilityService } from '../serviceability/serviceability.service.js';
import { Cart, type CartItem } from './cart.model.js';

export type CartLineInput = {
  productId: string;
  quantity: number;
};

type LeanProduct = {
  _id: unknown;
  name: string;
  stock: number;
  price: number;
  currency: string;
  imageUrl: string;
  slug: string;
  category: string;
  franchise: string;
  isLimitedDrop: boolean;
  rating: number;
  reviewCount: number;
};

export type CartSession = {
  items: CartItem[];
  lines: Array<{ product: unknown; quantity: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  totalBeforeDiscount: number;
  itemCount: number;
  couponCode?: string;
  coupon?: {
    code: string;
    discountType: 'percent' | 'flat';
    discountValue: number;
  };
};

const TAX_RATE = 0.05;

function isMongoObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value;
}

export class CartService {
  private async findOrCreateCart(userId?: string, guestSessionId?: string) {
    if (userId) {
      let cart = await Cart.findOne({ userId });
      if (!cart) cart = await Cart.create({ userId, items: [] });
      return cart;
    }
    if (guestSessionId) {
      let cart = await Cart.findOne({ guestSessionId });
      if (!cart) cart = await Cart.create({ guestSessionId, items: [] });
      return cart;
    }
    throw new AppError('Cart session required', 400);
  }

  /** Resolve catalog products by Mongo `_id` and/or `slug` (Home sometimes sent slug historically). */
  private async loadProductsByRefs(refs: string[]): Promise<Map<string, LeanProduct>> {
    const unique = [...new Set(refs.map(String).filter(Boolean))];
    if (!unique.length) return new Map();

    const objectIds = unique.filter(isMongoObjectId);
    const filter =
      objectIds.length > 0
        ? { $or: [{ _id: { $in: objectIds } }, { slug: { $in: unique } }] }
        : { slug: { $in: unique } };

    const products = (await Product.find(filter).lean()) as LeanProduct[];
    const map = new Map<string, LeanProduct>();
    for (const product of products) {
      map.set(String(product._id), product);
      if (product.slug) map.set(product.slug, product);
    }
    return map;
  }

  private async resolveProduct(ref: string): Promise<LeanProduct | null> {
    const map = await this.loadProductsByRefs([ref]);
    return map.get(ref) ?? null;
  }

  private async computeQuote(
    items: CartLineInput[],
    couponCode?: string,
    pincode?: string,
  ): Promise<CartSession> {
    if (!items.length) {
      return {
        items: [],
        lines: [],
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        totalBeforeDiscount: 0,
        itemCount: 0,
        couponCode,
      };
    }

    const productMap = await this.loadProductsByRefs(items.map((item) => item.productId));

    const lines = items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 422);
      }
      return { product, quantity: item.quantity, lineTotal: product.price * item.quantity };
    });

    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    let discount = 0;
    let appliedCoupon: CartSession['coupon'];

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon) {
        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        };
        if (coupon.discountType === 'percent') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }
        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
          discount = 0;
        }
      }
    }

    const serviceability = await serviceabilityService.resolve(pincode);
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping =
      afterDiscount >= serviceability.freeShippingThreshold || afterDiscount === 0
        ? 0
        : serviceability.shippingCharge;
    const tax = Math.round(afterDiscount * TAX_RATE);
    const total = afterDiscount + shipping + tax;
    const shippingBefore =
      subtotal >= serviceability.freeShippingThreshold || subtotal === 0
        ? 0
        : serviceability.shippingCharge;
    const taxBefore = Math.round(subtotal * TAX_RATE);
    const totalBeforeDiscount = subtotal + shippingBefore + taxBefore;

    return {
      items,
      lines,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      totalBeforeDiscount,
      itemCount,
      couponCode,
      coupon: appliedCoupon,
    };
  }

  async quote(items: CartLineInput[], pincode?: string) {
    return this.computeQuote(items, undefined, pincode);
  }

  /** Drop cart lines that no longer resolve (deleted products / old mock ids). */
  private async sanitizeCartItems(cart: Awaited<ReturnType<CartService['findOrCreateCart']>>) {
    if (!cart.items.length) return cart;
    const productMap = await this.loadProductsByRefs(cart.items.map((i) => i.productId));
    const next: CartItem[] = [];
    let changed = false;
    for (const item of cart.items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        changed = true;
        continue;
      }
      const canonicalId = String(product._id);
      if (item.productId !== canonicalId) {
        changed = true;
        const existing = next.find((row) => row.productId === canonicalId);
        if (existing) existing.quantity += item.quantity;
        else next.push({ productId: canonicalId, quantity: item.quantity });
      } else {
        const existing = next.find((row) => row.productId === canonicalId);
        if (existing) {
          changed = true;
          existing.quantity += item.quantity;
        } else {
          next.push(item);
        }
      }
    }
    if (changed) {
      cart.items = next;
      cart.updatedAt = new Date();
      await cart.save();
    }
    return cart;
  }

  async getCart(userId?: string, guestSessionId?: string, pincode?: string) {
    const cart = await this.sanitizeCartItems(await this.findOrCreateCart(userId, guestSessionId));
    const quote = await this.computeQuote(cart.items, cart.couponCode, pincode);
    return { cart: { items: cart.items, couponCode: cart.couponCode }, quote };
  }

  async addItem(
    userId: string | undefined,
    guestSessionId: string | undefined,
    productId: string,
    quantity = 1,
    pincode?: string,
  ) {
    const product = await this.resolveProduct(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    const canonicalId = String(product._id);
    const cart = await this.sanitizeCartItems(await this.findOrCreateCart(userId, guestSessionId));
    const existing = cart.items.find((i) => i.productId === canonicalId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ productId: canonicalId, quantity });
    cart.updatedAt = new Date();
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async updateItem(
    userId: string | undefined,
    guestSessionId: string | undefined,
    productId: string,
    quantity: number,
    pincode?: string,
  ) {
    const product = await this.resolveProduct(productId);
    if (!product && quantity > 0) {
      throw new AppError('Product not found', 404);
    }
    const canonicalId = product ? String(product._id) : productId;
    const cart = await this.sanitizeCartItems(await this.findOrCreateCart(userId, guestSessionId));
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== canonicalId && i.productId !== productId);
    } else {
      const item = cart.items.find((i) => i.productId === canonicalId || i.productId === productId);
      if (item) {
        item.productId = canonicalId;
        item.quantity = quantity;
      } else cart.items.push({ productId: canonicalId, quantity });
    }
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async removeItem(
    userId: string | undefined,
    guestSessionId: string | undefined,
    productId: string,
    pincode?: string,
  ) {
    const product = await this.resolveProduct(productId);
    const canonicalId = product ? String(product._id) : productId;
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    cart.items = cart.items.filter((i) => i.productId !== canonicalId && i.productId !== productId);
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async clearCart(userId?: string, guestSessionId?: string) {
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    await Cart.updateOne(
      { _id: cart._id },
      { $set: { items: [] }, $unset: { couponCode: 1 } },
    );
    return { ok: true };
  }

  async applyCoupon(
    userId: string | undefined,
    guestSessionId: string | undefined,
    code: string,
    pincode?: string,
  ) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) throw new AppError('Invalid coupon', 404);
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new AppError('Coupon expired', 422);
    }
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    cart.couponCode = coupon.code;
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async removeCoupon(userId?: string, guestSessionId?: string, pincode?: string) {
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    await Cart.updateOne({ _id: cart._id }, { $unset: { couponCode: 1 } });
    return this.getCart(userId, guestSessionId, pincode);
  }

  async mergeGuestCart(userId: string, guestSessionId: string, pincode?: string) {
    const [userCart, guestCart] = await Promise.all([
      this.findOrCreateCart(userId, undefined),
      Cart.findOne({ guestSessionId }),
    ]);
    if (guestCart?.items.length) {
      const productMap = await this.loadProductsByRefs(guestCart.items.map((i) => i.productId));
      for (const item of guestCart.items) {
        const product = productMap.get(String(item.productId));
        if (!product) continue;
        const canonicalId = String(product._id);
        const existing = userCart.items.find((i) => i.productId === canonicalId);
        if (existing) existing.quantity += item.quantity;
        else userCart.items.push({ productId: canonicalId, quantity: item.quantity });
      }
      await userCart.save();
      await Cart.deleteOne({ _id: guestCart._id });
    }
    return this.getCart(userId, undefined, pincode);
  }
}
