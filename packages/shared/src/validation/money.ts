import { z } from 'zod';

export const currencyCodeSchema = z.enum(['INR', 'USD']);

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: currencyCodeSchema,
});
