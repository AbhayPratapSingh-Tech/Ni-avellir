import { z } from 'zod';

export const productCategorySchema = z.enum([
  'collectibles',
  'apparel',
  'desk-gear',
  'limited-drops',
]);

export const currencyCodeSchema = z.enum(['INR', 'USD']);

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  customerId: z.string().min(1),
  cart: z.array(cartLineSchema).min(1),
  addressId: z.string().min(1),
  paymentMode: z.enum(['cod', 'upi', 'card']),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
