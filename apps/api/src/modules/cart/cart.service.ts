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

    const productIds = items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanProduct[];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

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

  async getCart(userId?: string, guestSessionId?: string, pincode?: string) {
    const cart = await this.findOrCreateCart(userId, guestSessionId);
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
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ productId, quantity });
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
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      const item = cart.items.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
      else cart.items.push({ productId, quantity });
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
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async clearCart(userId?: string, guestSessionId?: string) {
    const cart = await this.findOrCreateCart(userId, guestSessionId);
    cart.items = [];
    cart.couponCode = undefined;
    await cart.save();
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
    cart.couponCode = undefined;
    await cart.save();
    return this.getCart(userId, guestSessionId, pincode);
  }

  async mergeGuestCart(userId: string, guestSessionId: string, pincode?: string) {
    const [userCart, guestCart] = await Promise.all([
      this.findOrCreateCart(userId, undefined),
      Cart.findOne({ guestSessionId }),
    ]);
    if (guestCart?.items.length) {
      for (const item of guestCart.items) {
        const existing = userCart.items.find((i) => i.productId === item.productId);
        if (existing) existing.quantity += item.quantity;
        else userCart.items.push({ ...item });
      }
      await userCart.save();
      await Cart.deleteOne({ _id: guestCart._id });
    }
    return this.getCart(userId, undefined, pincode);
  }
}
