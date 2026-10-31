import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/**
 * In-memory IP limits. One API process only — a second instance needs a shared store.
 * Razorpay webhooks are intentionally not limited; the provider retries them.
 */

function ipLimit(windowMs: number, max: number, type: string, message: string): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: { error: { type, message } },
  });
}

/** OTP / reset / verify-email sends: 5 / minute / IP. */
export const otpSendIpLimit = ipLimit(
  60 * 1000,
  5,
  'otp_limit_per_minute_reached',
  'OTP limit per minute reached. Try again in a minute.',
);

/** Password guesses do not share a bucket with register or OTP verify. */
export const loginIpLimit = ipLimit(
  15 * 60 * 1000,
  10,
  'login_limit_reached',
  'Login limit reached. Try again in 15 minutes.',
);

/** Register, OTP verify, reset-password, verify-email confirm: 30 / 15 min / IP. */
export const authIpLimit = ipLimit(
  15 * 60 * 1000,
  30,
  'auth_limit_reached',
  'Attempt limit reached. Try again in 15 minutes.',
);

/** Coupon validate and cart apply-coupon share this bucket. */
export const couponIpLimit = ipLimit(
  60 * 1000,
  20,
  'coupon_limit_per_minute_reached',
  'Coupon limit per minute reached. Try again in a minute.',
);

/** POST /orders and POST /payments/intents share this bucket (retries included). */
export const checkoutIpLimit = ipLimit(
  60 * 1000,
  10,
  'checkout_limit_per_minute_reached',
  'Checkout limit per minute reached. Try again in a minute.',
);

/** Vision uploads. */
export const visualSearchIpLimit = ipLimit(
  60 * 1000,
  10,
  'visual_search_limit_per_minute_reached',
  'Visual search limit per minute reached. Try again in a minute.',
);
