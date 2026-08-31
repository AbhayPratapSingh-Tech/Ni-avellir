import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';
import { Review } from './review.model.js';

export class ReviewService {
  async listByProduct(productId: string) {
    return Review.find({ productId }).sort({ createdAt: -1 }).limit(50).lean();
  }

  async create(
    userId: string,
    input: { productId: string; name: string; rating: number; body: string },
  ) {
    const product = await Product.findById(input.productId);
    if (!product) throw new AppError('Product not found', 404);
    const review = await Review.create({ userId, ...input });
    const stats = await Review.aggregate([
      { $match: { productId: input.productId } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Product.updateOne(
        { _id: input.productId },
        { rating: Math.round(stats[0].avg * 10) / 10, reviewCount: stats[0].count },
      );
    }
    return review;
  }
}
