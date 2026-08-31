import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem, updateQuantity, type CartItem } from './cartSlice';
import { toggleItem } from '../wishlist/wishlistSlice';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { appConfig } from '../../config/appConfig';
import { cartRepository } from '../../services/data/cartRepository';
import { wishlistRepository } from '../../services/data/wishlistRepository';
import { requireLogin } from '../../lib/authGates';
import { toggleWishlistForUser } from '../../lib/wishlistActions';
import { discountPercent, formatInr, getProductImages } from '../../lib/productMedia';
import { getApiErrorMessage } from '../../services/api/apiClient';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CartScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { items, total, discount, couponCode, subtotal, shipping, tax, couponDiscountType, couponDiscountValue, totalBeforeDiscount } =
    useAppSelector((state) => state.cart);
  const user = useAppSelector((state) => state.auth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const defaultAddress = useAppSelector(
    (state) => state.addresses.items.find((item) => item.isDefault) ?? state.addresses.items[0],
  );
  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (appConfig.dataSource === 'api') {
        void cartRepository.refresh(defaultAddress?.postalCode);
      }
    }, [defaultAddress?.postalCode]),
  );
  const recipient = user?.isGuest
    ? defaultAddress?.fullName || 'Guest'
    : user?.name?.trim() || defaultAddress?.fullName || 'Forgehand';
  const addressLine = defaultAddress
    ? `${defaultAddress.line1}, ${defaultAddress.city} ${defaultAddress.postalCode}`
    : 'Add a delivery address';

  const originalTotal = totalBeforeDiscount ?? subtotal + shipping + tax + discount;
  const couponOfferLabel =
    couponDiscountType === 'percent' && couponDiscountValue != null
      ? `${couponDiscountValue}% off`
      : couponDiscountType === 'flat' && couponDiscountValue != null
        ? `${formatInr(couponDiscountValue)} off`
        : discount > 0
          ? 'coupon discount'
          : undefined;

  const canPop = navigation.canGoBack();

  const goBack = () => {
    if (canPop) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const header = (
    <View style={styles.topBar}>
      {canPop ? (
        <Pressable onPress={goBack} style={styles.topBtn} hitSlop={12}>
          <Text style={styles.topBtnText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.topBtn} />
      )}
      <Text style={styles.topTitle}>My Cart</Text>
      <View style={styles.topBtn} />
    </View>
  );

  if (items.length === 0) {
    return (
      <Screen edges={['top']} style={styles.screen}>
        {header}
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your forge is empty</Text>
          <Text style={styles.emptySub}>Add some gear to begin your collection.</Text>
          <Pressable style={styles.emptyCta} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.emptyCtaText}>Browse gear</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={styles.screen}>
      {header}
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        style={styles.listFlex}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.addressCard}>
              <View style={styles.addressCopy}>
                <Text style={styles.deliverTo} numberOfLines={1}>
                  Deliver to {recipient}
                </Text>
                <Text style={styles.addressLine} numberOfLines={1}>
                  {addressLine}
                </Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Addresses')} hitSlop={8}>
                <Text style={styles.change}>{defaultAddress ? 'Change' : 'Add'}</Text>
              </Pressable>
            </View>
            <View style={styles.couponCard}>
              <Text style={styles.couponTitle}>Coupon</Text>
              {couponCode ? (
                <View style={styles.couponApplied}>
                  <Text style={styles.couponAppliedText}>{couponCode} applied</Text>
                  <Pressable
                    onPress={async () => {
                      setCouponBusy(true);
                      try {
                        await cartRepository.removeCoupon(defaultAddress?.postalCode);
                        toast.show('Coupon removed');
                      } catch (error) {
                        toast.show(getApiErrorMessage(error));
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    disabled={couponBusy}
                  >
                    <Text style={styles.couponRemove}>Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="FORGE10 / WELCOME100"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    value={couponInput}
                    onChangeText={setCouponInput}
                  />
                  <Pressable
                    style={styles.couponBtn}
                    disabled={couponBusy}
                    onPress={async () => {
                      if (!couponInput.trim()) {
                        toast.show('Enter a coupon code');
                        return;
                      }
                      setCouponBusy(true);
                      try {
                        await cartRepository.applyCoupon(
                          couponInput.trim(),
                          defaultAddress?.postalCode,
                        );
                        toast.show('Coupon applied');
                        setCouponInput('');
                      } catch (error) {
                        toast.show(getApiErrorMessage(error));
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                  >
                    <Text style={styles.couponBtnText}>Apply</Text>
                  </Pressable>
                </View>
              )}
              {discount > 0 ? (
                <Text style={styles.couponSavings}>You save {formatInr(discount)}</Text>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CartLineCard
            item={item}
            wishlisted={wishlistItems.some((wish) => wish.id === item.product.id)}
            onOpen={() => navigation.navigate('ProductDetail', { product: item.product })}
            onQty={(quantity) => {
              if (appConfig.dataSource === 'api') {
                void cartRepository.updateItem(item.product.id, quantity, defaultAddress?.postalCode);
              } else {
                dispatch(updateQuantity({ productId: item.product.id, quantity }));
              }
              toast.show(quantity <= 0 ? 'Removed from cart' : 'Updated cart');
            }}
            onWish={() => {
              const already = wishlistItems.some((wish) => wish.id === item.product.id);
              if (
                !requireLogin({
                  user,
                  dispatch,
                  toast,
                  reason: 'wishlist',
                })
              ) {
                return;
              }
              void (async () => {
                if (already) {
                  await toggleWishlistForUser({
                    product: item.product,
                    user,
                    dispatch,
                    toast,
                    currentlyWishlisted: true,
                  });
                  return;
                }
                // Move to wishlist: add wish + remove cart line
                dispatch(toggleItem(item.product));
                if (appConfig.dataSource === 'api') {
                  try {
                    await wishlistRepository.toggle(item.product.id);
                  } catch {
                    // ignore sync error
                  }
                  void cartRepository.removeItem(item.product.id, defaultAddress?.postalCode);
                } else {
                  dispatch(removeItem(item.product.id));
                }
                toast.show('Moved to wishlist');
              })();
            }}
            onRemove={() => {
              if (appConfig.dataSource === 'api') {
                void cartRepository.removeItem(item.product.id, defaultAddress?.postalCode);
              } else {
                dispatch(removeItem(item.product.id));
              }
              toast.show('Removed from cart');
            }}
          />
        )}
      />

      <View style={styles.stickyBar}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Your Total</Text>
          {couponCode && discount > 0 ? (
            <>
              <Text style={styles.couponOffer}>
                {couponCode} · {couponOfferLabel} · save {formatInr(discount)}
              </Text>
              <View style={styles.totalPriceRow}>
                <Text style={styles.totalWas}>{formatInr(originalTotal)}</Text>
                <Text style={styles.totalValue}>{formatInr(total)}</Text>
              </View>
            </>
          ) : couponCode && discount === 0 ? (
            <Text style={styles.couponOfferMuted}>{couponCode} applied — min order not met</Text>
          ) : null}
          {!(couponCode && discount > 0) ? (
            <Text style={styles.totalValue}>{formatInr(total)}</Text>
          ) : null}
        </View>
        <Pressable
          style={styles.anvilBtn}
          onPress={() => {
            if (!requireLogin({ user, dispatch, toast, reason: 'checkout' })) {
              return;
            }
            navigation.navigate('Checkout');
          }}
        >
          <Text style={styles.anvilBtnText}>Hit the Anvil</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function CartLineCard({
  item,
  wishlisted,
  onOpen,
  onQty,
  onWish,
  onRemove,
}: {
  item: CartItem;
  wishlisted: boolean;
  onOpen: () => void;
  onQty: (quantity: number) => void;
  onWish: () => void;
  onRemove: () => void;
}) {
  const { product, quantity } = item;
  const image = getProductImages(product)[0] || product.imageUrl;
  const off = discountPercent(product);
  const inStock = product.stock > 0;

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardTop} onPress={onOpen}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <PriceOffer product={product} off={off} />
          <View style={[styles.stockChip, inStock ? styles.stockIn : styles.stockOut]}>
            <Text style={[styles.stockText, inStock ? styles.stockInText : styles.stockOutText]}>
              {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.cardFooter}>
        <View style={styles.qtyWrap}>
          <Pressable style={styles.qtyBtn} onPress={() => onQty(quantity - 1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, !inStock && styles.qtyBtnDisabled]}
            disabled={!inStock}
            onPress={() => onQty(quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.iconRow}>
          <Pressable style={styles.iconBtn} onPress={onWish} hitSlop={8}>
            <Text style={[styles.heart, wishlisted && styles.heartOn]}>{wishlisted ? '♥' : '♡'}</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onRemove} hitSlop={8}>
            <Text style={styles.trash}>🗑</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PriceOffer({ product, off }: { product: Product; off: number }) {
  return (
    <View style={styles.priceRow}>
      {off > 0 ? (
        <View style={styles.offBox}>
          <Text style={styles.offBoxText}>{off}% off</Text>
        </View>
      ) : null}
      {product.compareAtPrice > product.price ? (
        <Text style={styles.mrp}>{formatInr(product.compareAtPrice)}</Text>
      ) : null}
      <Text style={styles.price}>{formatInr(product.price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addressCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  couponApplied: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  couponAppliedText: { color: colors.text, fontWeight: '800' },
  couponBtn: {
    backgroundColor: colors.text,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  couponBtnText: { color: colors.onAccent, fontWeight: '800' },
  couponCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  couponInput: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  couponRemove: { color: colors.danger, fontWeight: '800' },
  couponRow: { flexDirection: 'row' },
  couponSavings: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  couponTitle: { color: colors.text, fontWeight: '800', marginBottom: 8 },
  couponOffer: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  couponOfferMuted: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  addressCopy: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addressLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  anvilBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  anvilBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  change: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  deliverTo: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyCta: {
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  emptyCtaText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  heart: {
    color: colors.text,
    fontSize: 20,
  },
  heartOn: {
    color: colors.danger,
  },
  iconBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  image: {
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 92,
    marginRight: spacing.sm,
    width: 92,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 140,
  },
  listFlex: {
    flex: 1,
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 12,
    marginRight: 6,
    textDecorationLine: 'line-through',
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  offBox: {
    backgroundColor: colors.danger,
    borderRadius: 4,
    marginRight: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offBoxText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
  },
  price: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  qtyBtn: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  qtyWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stickyBar: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  stockChip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockIn: {
    backgroundColor: '#D1FAE5',
  },
  stockInText: {
    color: '#047857',
  },
  stockOut: {
    backgroundColor: '#FEE2E2',
  },
  stockOutText: {
    color: colors.danger,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: spacing.sm,
  },
  topBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topBtnText: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 34,
  },
  topTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  totalBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  totalPriceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  totalWas: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  trash: {
    fontSize: 16,
  },
});
