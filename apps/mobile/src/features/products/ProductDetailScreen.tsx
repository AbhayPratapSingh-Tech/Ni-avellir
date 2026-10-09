import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { getBundleDisplayHint, resolveProductBundleTag } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addProductToCart, setCartLineQuantity } from '../../lib/cartActions';
import { viewProduct } from '../recent/recentSlice';
import type { RootStackParamList } from '../../app/navigation/types';
import { getProductImages } from '../../lib/productMedia';
import { goBackOrHome } from '../../lib/navigation';
import { requireLogin } from '../../lib/authGates';
import { toggleWishlistForUser } from '../../lib/wishlistActions';
import { productRepository, productMatchesCatalogId } from '../../services/data/productRepository';
import { getApiErrorMessage } from '../../services/api/apiClient';
import {
  isOwnReview,
  reviewRepository,
  withViewerAvatar,
} from '../../services/data/reviewRepository';
import type { ProductReview } from '../../services/data/reviews';
import { BundleCompleteSection } from '../../components/commerce/BundleCompleteSection';
import { Accordion } from '../../components/commerce/Accordion';
import { ImageGalleryModal } from '../../components/commerce/ImageGalleryModal';
import { ReviewListItem } from '../../components/commerce/ReviewListItem';
import { WriteReviewModal } from '../../components/commerce/WriteReviewModal';
import { ImagePager } from '../../components/commerce/ImagePager';
import { PriceRow } from '../../components/commerce/PriceRow';
import { ProductSlider } from '../../components/commerce/ProductSlider';
import { AppIcon, type AppIconName } from '../../components/ui/AppIcon';
import { CachedImage } from '../../components/ui/CachedImage';
import { StarRating } from '../../components/ui/StarRating';
import { useToast } from '../../components/ui/Toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

const APP_NAME = 'Niðavellir';

/** PDP promo slider before similar brands — fill image / productSlug per slide when ready. */
type PdpPromoBanner = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  /** Catalog slug or id — opens that product's PDP. */
  productSlug: string;
};

const PDP_PROMO_BANNERS: PdpPromoBanner[] = [
  {
    id: 'promo-1',
    image: '',
    title: 'Forge drop',
    subtitle: 'Banner coming soon',
    productSlug: '',
  },
  {
    id: 'promo-2',
    image: '',
    title: 'Limited run',
    subtitle: 'Banner coming soon',
    productSlug: '',
  },
  {
    id: 'promo-3',
    image: '',
    title: 'Rune picks',
    subtitle: 'Banner coming soon',
    productSlug: '',
  },
];

const CONFIDENCE: Array<{ icon: AppIconName; title: string }> = [
  { icon: 'return', title: '7 days free return' },
  { icon: 'package', title: 'Free delivery above ₹5000' },
  { icon: 'lock', title: 'Secure transaction' },
  { icon: 'hammer', title: 'Trusted by the dwarves' },
];

export function ProductDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { product: routeProduct } = route.params;
  const [product, setProduct] = useState(routeProduct);
  const images = getProductImages(product);

  const cartQty =
    useAppSelector((state) => state.cart.items.find((item) => item.product.id === product.id)?.quantity) ?? 0;
  const wishlisted = useAppSelector((state) =>
    state.wishlist.items.some((item) => productMatchesCatalogId(item, product.id)),
  );
  const user = useAppSelector((state) => state.auth.user);
  const recentItems = useAppSelector((state) => state.recent.items);
  const recentlyViewed = useMemo(
    () => recentItems.filter((item) => item.id !== product.id).slice(0, 8),
    [product.id, recentItems],
  );

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bundleBusy, setBundleBusy] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [alsoLike, setAlsoLike] = useState<Product[]>([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const promoListRef = useRef<FlatList<PdpPromoBanner>>(null);

  useEffect(() => {
    dispatch(viewProduct(product));
    productRepository.getRelated(product).then((result) => {
      setSimilar(result.similar);
      setAlsoLike(result.alsoLike);
    });
  }, [dispatch, product]);

  useEffect(() => {
    const slug = (routeProduct as Product & { slug?: string }).slug ?? routeProduct.id;
    productRepository.getBySlug(slug).then((live) => {
      if (live) setProduct(live);
    }).catch(() => {
      // Keep route product — avoid wiping PDP if refresh 404s
    });
  }, [routeProduct]);

  useEffect(() => {
    let cancelled = false;
    reviewRepository.listByProduct(product.id).then((items) => {
      if (!cancelled) setReviews(items);
    });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const brands = useMemo(
    () =>
      [
        ...new Set([
          product.brand,
          product.franchise,
          ...similar.map((item) => item.brand),
          ...similar.map((item) => item.franchise),
          ...alsoLike.map((item) => item.brand),
          ...alsoLike.map((item) => item.franchise),
        ]),
      ].filter(Boolean),
    [alsoLike, product.brand, product.franchise, similar],
  );

  const openProduct = (next: Product) => {
    navigation.push('ProductDetail', { product: next });
  };

  const openPromoBannerProduct = async (banner: PdpPromoBanner) => {
    const slug = banner.productSlug.trim();
    if (!slug) {
      toast.show('Promo product coming soon');
      return;
    }
    const currentSlug = (product as Product & { slug?: string }).slug ?? product.id;
    if (slug === currentSlug || slug === product.id) {
      return;
    }
    try {
      const next =
        (await productRepository.getBySlug(slug)) ?? (await productRepository.getById(slug));
      if (!next) {
        toast.show('Promo product unavailable');
        return;
      }
      openProduct(next);
    } catch {
      toast.show('Could not open promo');
    }
  };

  const completeBundle = async (members: Product[]) => {
    setBundleBusy(true);
    try {
      let okCount = 0;
      for (const item of members) {
        const ok = await addProductToCart({ product: item, quantity: 1, dispatch, toast });
        if (ok) okCount += 1;
      }
      if (okCount > 0) {
        toast.show(`Added ${okCount} bundle item${okCount === 1 ? '' : 's'} ⚡`);
      }
    } finally {
      setBundleBusy(false);
    }
  };

  const bundleTag = resolveProductBundleTag(product);
  const bundleHint = getBundleDisplayHint(bundleTag);
  const visibleReviews = withViewerAvatar(reviews, user);
  const previewReviews = visibleReviews.slice(0, 2);

  const removeReview = async (item: ProductReview) => {
    try {
      await reviewRepository.remove(item.id);
      setReviews((current) => current.filter((row) => row.id !== item.id));
      toast.show('Review removed');
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => goBackOrHome(navigation)} style={styles.topBtn} hitSlop={12}>
          <Text style={styles.topBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <Pressable style={styles.topBtn} hitSlop={12} accessibilityLabel="More">
          <Text style={styles.dots}>⋮</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 88 + insets.bottom }}>
        <View>
          <ImagePager
            images={images}
            height={340}
            width={width}
            showCount={false}
            onPressImage={() => setGalleryOpen(true)}
          />
          <Pressable
            style={styles.heartOnImage}
            onPress={() => {
              void toggleWishlistForUser({
                product,
                user,
                dispatch,
                toast,
                currentlyWishlisted: wishlisted,
              });
            }}
          >
            <Text style={[styles.heartOnImageText, wishlisted && styles.wishActive]}>
              {wishlisted ? '♥' : '♡'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.shareBtn}
            onPress={() => {
              Share.share({ message: `${product.name} on Niðavellir` }).catch(() => undefined);
            }}
          >
            <Text style={styles.shareText}>↗ Share</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.franchise}>{product.franchise}</Text>
          <Text style={styles.name}>{product.name}</Text>
          {bundleTag ? (
            <View style={styles.bundleBadge}>
              <Text style={styles.bundleBadgeText}>
                {bundleTag}
                {bundleHint ? ` · ${bundleHint.name}` : ''}
              </Text>
            </View>
          ) : null}
          <Text style={styles.metaLine}>
            SKU {String(product.sku ?? '').toUpperCase()}
            {product.runeXp ? ` · +${product.runeXp} Rune XP` : ''}
          </Text>
          <Text style={styles.description}>{product.description}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={product.rating} />
            <Text style={styles.ratingCopy}>
              {product.rating.toFixed(1)} ({product.reviewCount})
            </Text>
          </View>
          <PriceRow product={product} size="detail" />
          {product.stock > 0 ? (
            <Text style={styles.stock}>In stock · {product.stock} left</Text>
          ) : (
            <Text style={styles.outOfStock}>Sold out</Text>
          )}

          <BundleCompleteSection
            product={product}
            onPressProduct={openProduct}
            onCompleteBundle={completeBundle}
            completing={bundleBusy}
          />

          <View style={styles.bankCard}>
            <View style={styles.bankIcon}>
              <Text style={styles.bankIconText}>%</Text>
            </View>
            <View style={styles.bankCopy}>
              <Text style={styles.bankTitle}>Bank Offers</Text>
              <Text style={styles.bankText}>
                Get 75% discount on shopping with SBI credit card. Get max up to ₹1,500 off on orders above ₹5,000.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Shop with confidence</Text>
          <View style={styles.confidence}>
            {CONFIDENCE.map((item) => (
              <View key={item.title} style={styles.confidenceItem}>
                <View style={styles.confidenceIconWrap}>
                  <AppIcon name={item.icon} size={22} color={colors.text} />
                </View>
                <Text style={styles.confidenceText}>{item.title}</Text>
              </View>
            ))}
          </View>

        </View>

        <View style={styles.accordions}>
          <Accordion title="Product specifications">
            {Object.entries(product.specifications ?? {}).map(([key, value]) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </Accordion>
          <Accordion title="Product image gallery">
            <View style={styles.thumbs}>
              {images.map((uri) => (
                <Pressable key={uri} onPress={() => setGalleryOpen(true)}>
                  <Image source={{ uri }} style={styles.thumb} />
                </Pressable>
              ))}
            </View>
          </Accordion>
          <Accordion title="Additional details">
            <Text style={styles.description}>{product.additionalDetails || product.description}</Text>
          </Accordion>
        </View>

        <View style={styles.body}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.reviewActions}>
              <Pressable onPress={() => setReviewOpen(true)} hitSlop={8}>
                <Text style={styles.writeLink}>Write a review</Text>
              </Pressable>
              {reviews.length > 0 ? (
                <Pressable
                  onPress={() => navigation.navigate('ProductReviews', { product })}
                  hitSlop={8}
                >
                  <Text style={styles.viewAllLink}>View all</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {previewReviews.length ? (
            previewReviews.map((review) => (
              <ReviewListItem
                key={review.id}
                review={review}
                canRemove={isOwnReview(review, user)}
                onRemove={(item) => void removeReview(item)}
                onHelpful={(item) =>
                  setReviews((current) =>
                    current.map((row) =>
                      row.id === item.id ? { ...row, helpful: row.helpful + 1 } : row,
                    ),
                  )
                }
              />
            ))
          ) : (
            <Text style={styles.noReviews}>No reviews yet. Write the first one.</Text>
          )}
        </View>

        <ProductSlider title="Similar items" products={similar} onPress={openProduct} />
        <ProductSlider title="You might also like" products={alsoLike} onPress={openProduct} />
        <ProductSlider title="Recently viewed" products={recentlyViewed} onPress={openProduct} />

        <View style={styles.pdpBannerWrap}>
          <FlatList
            ref={promoListRef}
            data={PDP_PROMO_BANNERS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / width);
              setPromoIndex(next);
            }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.pdpBanner, { width }]}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => {
                  void openPromoBannerProduct(item);
                }}
              >
                {item.image ? (
                  <CachedImage uri={item.image} style={styles.pdpBannerImage} priority="normal" />
                ) : (
                  <View style={styles.pdpBannerPlaceholder} />
                )}
                <View style={styles.pdpBannerCopy}>
                  <Text style={styles.pdpBannerTitle}>{item.title}</Text>
                  <Text style={styles.pdpBannerSub}>{item.subtitle}</Text>
                </View>
              </Pressable>
            )}
          />
          {PDP_PROMO_BANNERS.length > 1 ? (
            <View style={styles.pdpBannerDots}>
              {PDP_PROMO_BANNERS.map((banner, i) => (
                <View
                  key={banner.id}
                  style={[styles.pdpBannerDot, i === promoIndex && styles.pdpBannerDotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.body, styles.brands]}>
          <Text style={styles.brandsTitle}>Similar brands on {APP_NAME}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandChips}
          >
            {brands.map((brand) => (
              <Pressable
                key={brand}
                style={styles.brandChip}
                onPress={() => navigation.navigate('Products', { franchise: brand, title: brand })}
              >
                <View style={styles.brandAvatar}>
                  <Text style={styles.brandAvatarText}>{brand.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.brandName}>{brand}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {cartQty > 0 ? (
          <View style={styles.qtyWrap}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => {
                const nextQty = cartQty - 1;
                void setCartLineQuantity({ product, quantity: nextQty, dispatch, toast }).then((ok) => {
                  if (ok) toast.show(nextQty === 0 ? 'Removed from cart' : 'Updated cart');
                });
              }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{cartQty}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => {
                void setCartLineQuantity({
                  product,
                  quantity: cartQty + 1,
                  dispatch,
                  toast,
                }).then((ok) => {
                  if (ok) toast.show('Updated cart');
                });
              }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
            disabled={product.stock === 0}
            onPress={() => {
              void addProductToCart({ product, dispatch, toast }).then((ok) => {
                if (ok) toast.show('Struck the cart ⚡');
              });
            }}
          >
            <Text style={styles.addBtnText}>{product.stock > 0 ? 'Add to cart' : 'Out of stock'}</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.buyBtn, product.stock === 0 && styles.addBtnDisabled]}
          disabled={product.stock === 0}
          onPress={() => {
            if (cartQty === 0) {
              void addProductToCart({ product, dispatch, toast }).then((ok) => {
                if (ok) toast.show('Struck the cart ⚡');
              });
            }
            if (!requireLogin({ user, dispatch, toast, reason: 'checkout' })) {
              return;
            }
            navigation.navigate('Checkout');
          }}
        >
          <Text style={styles.buyBtnText}>Buy now</Text>
        </Pressable>
      </View>

      <ImageGalleryModal visible={galleryOpen} images={images} onClose={() => setGalleryOpen(false)} />

      <WriteReviewModal
        visible={reviewOpen}
        productId={product.id}
        onClose={() => setReviewOpen(false)}
        onCreated={(created) => {
          setReviews((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  accordions: {
    marginTop: spacing.lg,
  },
  addBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.text,
    borderRadius: 12,
    borderWidth: 1.5,
    flex: 1,
    paddingVertical: 14,
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  addBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  bankCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  bankCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  bankIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  bankIconText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  bankText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  bankTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: {
    padding: spacing.lg,
  },
  brandChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brandAvatar: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  brandAvatarText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  brandChips: {
    marginTop: spacing.lg,
    paddingRight: spacing.md,
  },
  brandName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  brands: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  brandsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  buyBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 14,
  },
  buyBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  confidence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  confidenceIconWrap: {
    marginBottom: 6,
  },
  confidenceItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    // 2×2: half row minus gap (RN % is of parent; gap handled separately)
    flexBasis: '47%',
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  confidenceText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  franchise: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  brand: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 36,
  },
  iconBtnText: {
    fontSize: 18,
  },
  iconMuted: {
    opacity: 0.35,
  },
  iconRow: {
    flexDirection: 'row',
  },
  name: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: 4,
  },
  bundleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bundleBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  metaLine: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  outOfStock: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  pdpBanner: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    height: 88,
    overflow: 'hidden',
  },
  pdpBannerCopy: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pdpBannerDot: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  pdpBannerDotActive: {
    backgroundColor: colors.accent,
    width: 14,
  },
  pdpBannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  pdpBannerImage: {
    height: '100%',
    width: 120,
  },
  pdpBannerPlaceholder: {
    backgroundColor: colors.accentSoft,
    height: '100%',
    width: 120,
  },
  pdpBannerSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pdpBannerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pdpBannerWrap: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
  },
  qtyBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  qtyBtnText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '300',
  },
  qtyValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  qtyWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  ratingCopy: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 6,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginTop: 6,
  },
  noReviews: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  reviewActions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  specKey: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  specValue: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  stock: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  stickyBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thumb: {
    borderRadius: 8,
    height: 72,
    marginRight: spacing.sm,
    width: 72,
  },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  viewAllLink: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  wishActive: {
    color: colors.danger,
  },
  dots: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  heartOnImage: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 36,
  },
  heartOnImageText: {
    color: colors.text,
    fontSize: 18,
  },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    bottom: 12,
    left: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
  },
  shareText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
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
  writeLink: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
