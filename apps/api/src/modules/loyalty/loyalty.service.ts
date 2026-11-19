import { nanoid } from 'nanoid';
import { AppError } from '../../common/errors/app-error.js';
import { User } from '../auth/user.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { spendRuneXp, syncUserRuneXp, voidRuneSpend } from '../orders/rune-xp.js';
import {
  EARLY_DROP_MS,
  FLAT_50_MIN_ORDER,
  FLAT_50_TTL_MS,
  FLAT_50_VALUE,
  RUNE_REWARDS,
  runeReward,
  type RuneRewardId,
} from './rewards.js';

function redeemRef(userId: string, rewardId: string, idempotencyKey: string) {
  return `redeem:${userId}:${rewardId}:${idempotencyKey}`;
}

export class LoyaltyService {
  async catalogue(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const balance = await syncUserRuneXp(userId);
    if (balance !== Number(user.runeXp ?? 0)) {
      user.runeXp = Math.max(0, balance);
      await user.save();
    }

    const coupons = await Coupon.find({
      userIds: userId,
      active: true,
      code: /^RUNE50-/,
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    })
      .select('code discountValue minOrderValue expiresAt')
      .sort({ createdAt: -1 })
      .lean();

    const earlyUntil = user.dropZoneEarlyUntil;
    const dropZoneEarlyUntil =
      earlyUntil && earlyUntil.getTime() > Date.now() ? earlyUntil.toISOString() : null;

    return {
      runeXp: Math.max(0, balance),
      freeShippingCredits: Number(user.freeShippingCredits ?? 0),
      dropZoneEarlyUntil,
      coupons: coupons.map((coupon) => ({
        code: coupon.code,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      })),
      rewards: RUNE_REWARDS.map((reward) => ({
        ...reward,
        affordable: balance >= reward.xpCost,
      })),
    };
  }

  async redeem(userId: string, rewardId: string, idempotencyKey: string) {
    const reward = runeReward(rewardId);
    if (!reward) throw new AppError('Unknown reward', 404);
    const key = idempotencyKey.trim();
    if (key.length < 8 || key.length > 80) {
      throw new AppError('Idempotency key is required', 400);
    }

    const businessRef = redeemRef(userId, reward.id, key);
    const spent = await spendRuneXp({
      userId,
      amount: reward.xpCost,
      businessRef,
    });

    if (spent === 'created') {
      try {
        await this.grant(userId, reward.id);
      } catch (error) {
        await voidRuneSpend(userId, businessRef);
        throw error;
      }
    }

    const catalogue = await this.catalogue(userId);
    return { ...catalogue, replayed: spent === 'replay' };
  }

  private async grant(userId: string, rewardId: RuneRewardId) {
    if (rewardId === 'flat_50') {
      await Coupon.create({
        code: `RUNE50-${nanoid(6).toUpperCase()}`,
        description: 'Rune XP ₹50 off',
        discountType: 'flat',
        discountValue: FLAT_50_VALUE,
        minOrderValue: FLAT_50_MIN_ORDER,
        productIds: [],
        categories: [],
        userIds: [userId],
        firstOrderOnly: false,
        usageLimit: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + FLAT_50_TTL_MS),
        active: true,
      });
      return;
    }

    if (rewardId === 'free_shipping') {
      await User.updateOne({ _id: userId }, { $inc: { freeShippingCredits: 1 } });
      return;
    }

    const user = await User.findById(userId).select('dropZoneEarlyUntil');
    const now = Date.now();
    const start =
      user?.dropZoneEarlyUntil && user.dropZoneEarlyUntil.getTime() > now
        ? user.dropZoneEarlyUntil.getTime()
        : now;
    await User.updateOne(
      { _id: userId },
      { $set: { dropZoneEarlyUntil: new Date(start + EARLY_DROP_MS) } },
    );
  }
}
