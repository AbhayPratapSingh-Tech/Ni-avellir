import { nanoid } from 'nanoid';
import { Order } from './order.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../common/errors/app-error.js';

export type CreateOrderInput = {
  customer: { name: string; email: string; phone: string };
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: string;
};

const FREE_SHIPPING_THRESHOLD = 1499;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.05;

type LeanOrderProduct = {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export class OrderService {
  async create(input: CreateOrderInput) {
    const productIds = input.items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanOrderProduct[];
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const items = input.items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 422);
      }
      return {
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
        lineTotal: product.price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + shipping + tax;

    const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const isCod = input.paymentMethod === 'cash_on_delivery';
    const order = await Order.create({
      orderNumber,
      customer: input.customer,
      items,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      subtotal,
      shipping,
      tax,
      total,
      currency: 'INR',
      // Online (Razorpay): wait for payment verify before stock decrement.
      status: isCod ? 'confirmed' : 'pending_payment',
      estimatedDelivery,
    });

    if (isCod) {
      await Promise.all(
        items.map((item) =>
          Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } }),
        ),
      );
    }

    return order;
  }

  async list(email?: string) {
    const filter = email ? { 'customer.email': email } : {};
    return Order.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getById(id: string) {
    const order = await Order.findById(id).lean();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }
}
