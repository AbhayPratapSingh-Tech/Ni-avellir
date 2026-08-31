import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';
import { Wishlist } from './wishlist.model.js';

export class WishlistService {
  private async getOrCreate(userId: string) {
    let list = await Wishlist.findOne({ userId });
    if (!list) list = await Wishlist.create({ userId, productIds: [] });
    return list;
  }

  async get(userId: string) {
    const list = await this.getOrCreate(userId);
    const products = await Product.find({ _id: { $in: list.productIds } }).lean();
    return { productIds: list.productIds, products };
  }

  async toggle(userId: string, productId: string) {
    const list = await this.getOrCreate(userId);
    const exists = list.productIds.includes(productId);
    if (exists) list.productIds = list.productIds.filter((id) => id !== productId);
    else list.productIds.push(productId);
    await list.save();
    return { productIds: list.productIds, added: !exists };
  }

  async remove(userId: string, productId: string) {
    const list = await this.getOrCreate(userId);
    list.productIds = list.productIds.filter((id) => id !== productId);
    await list.save();
    return { productIds: list.productIds };
  }
}
