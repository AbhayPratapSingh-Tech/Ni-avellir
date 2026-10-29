import { logger } from '../../common/logger/logger.js';
import type { PaymentService } from './payment.service.js';

/**
 * In-process reconciler — runs only while the API dyno is awake (Render Free sleeps).
 * Complements Razorpay webhooks + client /confirm. Order Details also triggers per-order reconcile.
 */
export function startPaymentReconciler(
  service: PaymentService,
  options: { intervalMs: number },
): () => void {
  const intervalMs = Math.max(60_000, options.intervalMs);

  const tick = () => {
    void service
      .reconcileStalePending()
      .then((summary) => {
        if (summary.paid > 0 || summary.expired > 0) {
          logger.info(summary, 'Payment reconcile tick');
        }
      })
      .catch((error) => {
        logger.warn({ err: error }, 'Payment reconcile tick failed');
      });
  };

  const initial = setTimeout(tick, 20_000);
  const timer = setInterval(tick, intervalMs);
  initial.unref?.();
  timer.unref?.();

  logger.info(
    { intervalMs },
    'Payment reconciler started (in-process; wakes with dyno)',
  );

  return () => {
    clearTimeout(initial);
    clearInterval(timer);
  };
}
