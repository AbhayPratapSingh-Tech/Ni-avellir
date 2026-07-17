export const ProductType = {
  PhysicalProduct: 'physical_product',
  DigitalGiftCard: 'digital_gift_card',
  DigitalGameCode: 'digital_game_code',
  MembershipSubscription: 'membership_subscription',
  BundleProduct: 'bundle_product',
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const mvpProductTypes = [ProductType.PhysicalProduct] as const;

export const futureProductTypes = [
  ProductType.DigitalGiftCard,
  ProductType.DigitalGameCode,
  ProductType.MembershipSubscription,
  ProductType.BundleProduct,
] as const;
