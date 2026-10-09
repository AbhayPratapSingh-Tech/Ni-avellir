import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { ReviewListItem } from '../../components/commerce/ReviewListItem';
import { WriteReviewModal } from '../../components/commerce/WriteReviewModal';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../app/store';
import { goBackOrHome } from '../../lib/navigation';
import { getApiErrorMessage } from '../../services/api/apiClient';
import {
  isOwnReview,
  reviewRepository,
  withViewerAvatar,
} from '../../services/data/reviewRepository';
import type { ProductReview } from '../../services/data/reviews';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductReviews'>;

const HISTOGRAM_STARS = [5, 4, 3, 2, 1] as const;
const HISTOGRAM_FILL = '#16A34A';

export function ProductReviewsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { product } = route.params;
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [writeOpen, setWriteOpen] = useState(false);
  const visibleReviews = useMemo(() => withViewerAvatar(reviews, user), [reviews, user]);

  const load = useCallback(() => {
    reviewRepository.listByProduct(product.id).then(setReviews).catch(() => undefined);
  }, [product.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const removeReview = async (item: ProductReview) => {
    try {
      await reviewRepository.remove(item.id);
      setReviews((current) => current.filter((row) => row.id !== item.id));
      toast.show('Review removed');
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    }
  };

  const counts = useMemo(() => {
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
      buckets[star] += 1;
    }
    return buckets;
  }, [reviews]);

  const average = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }
    const sum = reviews.reduce((total, item) => total + item.rating, 0);
    return Math.round((sum / reviews.length) * 100) / 100;
  }, [reviews]);

  const maxCount = Math.max(1, ...HISTOGRAM_STARS.map((star) => counts[star]));

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => goBackOrHome(navigation)} style={styles.topBtn} hitSlop={12}>
          <Text style={styles.topBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>All Reviews</Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.summary}>
          <View style={styles.scoreCol}>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{reviews.length ? average.toFixed(2) : '—'}</Text>
              <Text style={styles.scoreStar}>★</Text>
            </View>
            <Text style={styles.count}>
              {reviews.length} Review{reviews.length === 1 ? '' : 's'}
            </Text>
            <Pressable style={styles.writePill} onPress={() => setWriteOpen(true)}>
              <Text style={styles.writePillText}>Write review</Text>
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.histogram}>
            {HISTOGRAM_STARS.map((star) => (
              <View key={star} style={styles.histRow}>
                <Text style={styles.histLabel}>{star} ★</Text>
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      { width: `${(counts[star] / maxCount) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.histCount}>{counts[star]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.list}>
          {visibleReviews.length ? (
            visibleReviews.map((review) => (
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
            <Text style={styles.empty}>No reviews yet. Be the first to write one.</Text>
          )}
        </View>
      </ScrollView>

      <WriteReviewModal
        visible={writeOpen}
        productId={product.id}
        onClose={() => setWriteOpen(false)}
        onCreated={(created) => {
          setReviews((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    width: 1,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  histCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    width: 18,
  },
  histFill: {
    backgroundColor: HISTOGRAM_FILL,
    borderRadius: 3,
    height: '100%',
  },
  histLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    width: 32,
  },
  histRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  histTrack: {
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    flex: 1,
    height: 8,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  histogram: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  score: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  scoreCol: {
    minWidth: 120,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreStar: {
    color: '#F5A524',
    fontSize: 22,
    marginLeft: 6,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  summary: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
  writePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.text,
    borderRadius: 20,
    marginTop: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  writePillText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
