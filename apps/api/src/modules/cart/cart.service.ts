import { Product } from '../products/product.model.js';
import { AppError } from '../../common/errors/app-error.js';

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

export type CartLineInput = {
  productId: string;
  quantity: number;
};

export type CartSession = {
  lines: Array<{ product: unknown; quantity: number; lineTotal: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
};

const SHIPPING_CHARGE = 99;
const FREE_SHIPPING_THRESHOLD = 1499;
const TAX_RATE = 0.05;

export class CartService {
  async quote(items: CartLineInput[]): Promise<CartSession> {
    if (!items || items.length === 0) {
      return {
        lines: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
    }

const productIds = items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanProduct[];

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const lines = items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 422);
      }

      const lineTotal = product.price * item.quantity;
      return {
        product,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_CHARGE;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + shipping + tax;

    return {
      lines,
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
    };
  }
}
