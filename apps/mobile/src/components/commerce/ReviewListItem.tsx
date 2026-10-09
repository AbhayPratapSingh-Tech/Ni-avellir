import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { reviewDisplayTitle, type ProductReview } from '../../services/data/reviews';
import { StarRating } from '../ui/StarRating';

type Props = {
  review: ProductReview;
  canRemove?: boolean;
  onHelpful?: (review: ProductReview) => void;
  onRemove?: (review: ProductReview) => void;
};

export function ReviewListItem({ review, canRemove, onHelpful, onRemove }: Props) {
  const initial = (review.name.trim().charAt(0) || '?').toUpperCase();

  const confirmRemove = () => {
    Alert.alert('Remove review', 'Delete this review? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove?.(review) },
    ]);
  };

  return (
    <View style={styles.row}>
      {review.avatarUrl ? (
        <Image source={{ uri: review.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.body}>
        <StarRating rating={review.rating} size={12} />
        <Text style={styles.title} numberOfLines={2}>
          {reviewDisplayTitle(review)}
        </Text>
        <Text style={styles.text}>{review.body}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {review.name}
            {review.verified ? ' · Verified' : ''}
          </Text>
          {canRemove ? (
            <Pressable onPress={confirmRemove} hitSlop={8}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          ) : onHelpful ? (
            <Pressable onPress={() => onHelpful(review)} hitSlop={8}>
              <Text style={styles.helpful}>Helpful ({review.helpful})</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  helpful: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  remove: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  text: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
});
