import { z } from 'zod';
import { ProductType } from '../constants/product-types.js';
import { moneySchema } from './money.js';

export const productTypeSchema = z.enum([
  ProductType.PhysicalProduct,
  ProductType.DigitalGiftCard,
  ProductType.DigitalGameCode,
  ProductType.MembershipSubscription,
  ProductType.BundleProduct,
]);

export const productSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  type: productTypeSchema,
  price: moneySchema,
  thumbnailUrl: z.string().url(),
  inStock: z.boolean(),
});
