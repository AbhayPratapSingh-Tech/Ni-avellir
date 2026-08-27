import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addItem, updateQuantity } from '../cart/cartSlice';
import { toggleItem } from '../wishlist/wishlistSlice';
import { viewProduct } from '../recent/recentSlice';
import type { RootStackParamList } from '../../app/navigation/types';
import { getProductImages } from '../../lib/productMedia';
import { goBackOrHome } from '../../lib/navigation';
import { productRepository } from '../../services/data/productRepository';
import { demoReviews, type ProductReview } from '../../services/data/reviews';
import { Accordion } from '../../components/commerce/Accordion';
import { ImageGalleryModal } from '../../components/commerce/ImageGalleryModal';
import { ImagePager } from '../../components/commerce/ImagePager';
import { PriceRow } from '../../components/commerce/PriceRow';
import { ProductSlider } from '../../components/commerce/ProductSlider';
import { BrandMark } from '../../components/ui/BrandMark';
import { StarRating } from '../../components/ui/StarRating';
import { useToast } from '../../components/ui/Toast';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

const APP_NAME = 'Niðavellir';

const CONFIDENCE = [
  { icon: '↩', title: '7 days free return' },
  { icon: '📦', title: 'Free delivery above ₹5000' },
  { icon: '🔒', title: 'Secure transaction' },
  { icon: '⚒', title: 'Trusted by the dwarves' },
];

export function ProductDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { product } = route.params;
  const images = getProductImages(product);

  const cartQty =
    useAppSelector((state) => state.cart.items.find((item) => item.product.id === product.id)?.quantity) ?? 0;
  const wishlisted = useAppSelector((state) => state.wishlist.items.some((item) => item.id === product.id));
  const recentItems = useAppSelector((state) => state.recent.items);
  const recentlyViewed = useMemo(
    () => recentItems.filter((item) => item.id !== product.id).slice(0, 8),
    [product.id, recentItems],
  );

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    const own = demoReviews.filter((item) => item.productId === product.id);
    return own.length ? own : demoReviews.slice(0, 3);
  });
  const [similar, setSimilar] = useState<Product[]>([]);
  const [alsoLike, setAlsoLike] = useState<Product[]>([]);

  useEffect(() => {
    dispatch(viewProduct(product));
    productRepository.getRelated(product).then((result) => {
      setSimilar(result.similar);
      setAlsoLike(result.alsoLike);
    });
  }, [dispatch, product]);

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

  const submitReview = () => {
    if (!reviewName.trim() || !reviewBody.trim()) {
      Alert.alert('Add a name and review');
      return;
    }
    setReviews((current) => [
      {
        id: `rev-local-${Date.now()}`,
        productId: product.id,
        name: reviewName.trim(),
        avatarUrl: `https://i.pravatar.cc/80?u=${encodeURIComponent(reviewName.trim())}`,
        rating: reviewRating,
        verified: false,
        body: reviewBody.trim(),
        helpful: 0,
      },
      ...current,
    ]);
    setReviewName('');
    setReviewBody('');
    setReviewRating(5);
    setReviewOpen(false);
    toast.show('Review submitted');
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
              dispatch(toggleItem(product));
              toast.show(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
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
                <Text style={styles.confidenceIcon}>{item.icon}</Text>
                <Text style={styles.confidenceText}>{item.title}</Text>
              </View>
            ))}
          </View>

        </View>

        <ProductSlider title="Similar items" products={similar} onPress={openProduct} />
        <ProductSlider title="You might also like" products={alsoLike} onPress={openProduct} />
        <ProductSlider title="Recently viewed" products={recentlyViewed} onPress={openProduct} />

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
            <Pressable onPress={() => setReviewOpen(true)}>
              <Text style={styles.writeLink}>Write a review</Text>
            </Pressable>
          </View>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <Image source={{ uri: review.avatarUrl }} style={styles.avatar} />
              <View style={styles.reviewBody}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.verified}>{review.verified ? 'Verified' : 'Not verified'}</Text>
                </View>
                <StarRating rating={review.rating} size={12} />
                <Text style={styles.reviewText}>{review.body}</Text>
                <Pressable
                  onPress={() =>
                    setReviews((current) =>
                      current.map((item) =>
                        item.id === review.id ? { ...item, helpful: item.helpful + 1 } : item,
                      ),
                    )
                  }
                >
                  <Text style={styles.helpful}>Helpful ({review.helpful})</Text>
                </Pressable>
              </View>
            </View>
          ))}
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
                <BrandMark size={28} />
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
                dispatch(updateQuantity({ productId: product.id, quantity: cartQty - 1 }));
                toast.show(cartQty === 1 ? 'Removed from cart' : 'Updated cart');
              }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{cartQty}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => {
                dispatch(updateQuantity({ productId: product.id, quantity: cartQty + 1 }));
                toast.show('Updated cart');
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
              dispatch(addItem({ product, quantity: 1 }));
              toast.show('Struck the cart ⚡');
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
              dispatch(addItem({ product, quantity: 1 }));
              toast.show('Struck the cart ⚡');
            }
            navigation.navigate('Checkout');
          }}
        >
          <Text style={styles.buyBtnText}>Buy now</Text>
        </Pressable>
      </View>

      <ImageGalleryModal visible={galleryOpen} images={images} onClose={() => setGalleryOpen(false)} />

      <Modal
        visible={reviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewOpen(false)}
      >
        <View style={styles.reviewOverlay}>
          <Pressable style={styles.reviewBackdrop} onPress={() => setReviewOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.reviewSheetWrap}
          >
            <View style={[styles.reviewSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <View style={styles.reviewHandle} />
              <View style={styles.reviewSheetHeader}>
                <Text style={styles.reviewSheetTitle}>Write a review</Text>
                <Pressable onPress={() => setReviewOpen(false)} hitSlop={12}>
                  <Text style={styles.reviewClose}>Close</Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                value={reviewName}
                onChangeText={setReviewName}
              />
              <View style={styles.reviewStars}>
                <StarRating rating={reviewRating} size={28} onChange={setReviewRating} />
              </View>
              <TextInput
                style={[styles.input, styles.inputArea]}
                placeholder="How was the gear?"
                placeholderTextColor={colors.textMuted}
                value={reviewBody}
                onChangeText={setReviewBody}
                multiline
              />
              <Pressable style={styles.submitReviewBtn} onPress={submitReview}>
                <Text style={styles.addBtnText}>Submit review</Text>
              </Pressable>
              <Pressable onPress={() => setReviewOpen(false)} hitSlop={8}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  accordions: {
    marginTop: spacing.lg,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
  },
  addBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
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
  cancel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  confidence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  confidenceIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  confidenceItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    marginRight: '4%',
    padding: spacing.sm,
    width: '48%',
  },
  confidenceText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
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
  helpful: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
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
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  inputArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  name: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: 4,
  },
  outOfStock: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm,
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
  reviewBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewCard: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  reviewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewClose: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewOverlay: {
    backgroundColor: 'rgba(17, 19, 24, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  reviewSheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reviewSheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  reviewSheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewStars: {
    marginBottom: spacing.md,
  },
  reviewText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  reviewTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  submitReviewBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 14,
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
  verified: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: spacing.lg,
  },
});
