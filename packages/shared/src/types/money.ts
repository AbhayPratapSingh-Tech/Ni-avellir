export const CurrencyCode = {
  INR: 'INR',
  USD: 'USD',
} as const;

export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

export type Money = {
  amountMinor: number;
  currency: CurrencyCode;
};
