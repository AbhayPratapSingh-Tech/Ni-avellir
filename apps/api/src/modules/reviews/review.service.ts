import { AppError } from '../../common/errors/app-error.js';
import { isPersistedAvatarUrl } from '../../integrations/media/avatar-upload.js';
import { Product } from '../products/product.model.js';
import { User } from '../auth/user.model.js';
import { Review } from './review.model.js';

async function refreshProductStats(productId: string) {
  const stats = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    await Product.updateOne(
      { _id: productId },
      { rating: Math.round(stats[0].avg * 10) / 10, reviewCount: stats[0].count },
    );
    return;
  }
  await Product.updateOne({ _id: productId }, { reviewCount: 0 });
}

export class ReviewService {
  async listByProduct(productId: string) {
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(50).lean();
    const userIds = [...new Set(reviews.map((row) => String(row.userId)).filter(Boolean))];
    const authors = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('avatarUrl name').lean()
      : [];
    const byId = new Map(authors.map((user) => [String(user._id), user]));
    return reviews.map((row) => {
      const author = byId.get(String(row.userId));
      const avatarUrl = isPersistedAvatarUrl(row.avatarUrl)
        ? row.avatarUrl
        : isPersistedAvatarUrl(author?.avatarUrl)
          ? author?.avatarUrl
          : undefined;
      return {
        ...row,
        id: String(row._id),
        userId: String(row.userId),
        avatarUrl,
      };
    });
  }

  async create(
    userId: string,
    input: {
      productId: string;
      name: string;
      rating: number;
      title?: string;
      body: string;
      avatarUrl?: string;
      imageUrl?: string;
    },
  ) {
    const product = await Product.findById(input.productId);
    if (!product) throw new AppError('Product not found', 404);
    const author = await User.findById(userId).lean();
    const title = typeof input.title === 'string' ? input.title.trim().slice(0, 70) : '';
    const imageUrl =
      typeof input.imageUrl === 'string' && /^https?:\/\//i.test(input.imageUrl.trim())
        ? input.imageUrl.trim()
        : undefined;
    const avatarUrl = isPersistedAvatarUrl(author?.avatarUrl)
      ? author!.avatarUrl
      : isPersistedAvatarUrl(input.avatarUrl)
        ? input.avatarUrl!.trim()
        : undefined;
    const review = await Review.create({
      userId,
      productId: input.productId,
      name: input.name || author?.name || 'Shopper',
      rating: input.rating,
      body: input.body,
      ...(title ? { title } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
    await refreshProductStats(input.productId);
    const created = review.toObject();
    return {
      ...created,
      id: String(review._id),
      userId: String(userId),
      avatarUrl: avatarUrl ?? created.avatarUrl,
    };
  }

  async remove(userId: string, reviewId: string) {
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (String(review.userId) !== userId) {
      throw new AppError('You can only remove your own review', 403);
    }
    const productId = review.productId;
    await review.deleteOne();
    await refreshProductStats(productId);
  }
}
