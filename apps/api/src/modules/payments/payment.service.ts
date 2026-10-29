import { nanoid } from 'nanoid';
import { PaymentProviderCode } from '@nidavellir/shared/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logger/logger.js';
import { releaseStock } from '../orders/inventory.js';
import { Order } from '../orders/order.model.js';
import { Payment } from './payment.model.js';
import { PaymentWebhookEvent } from './payment-webhook-event.model.js';
import { awardOrderRuneXp, computeOrderRuneXp } from '../orders/rune-xp.js';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifyPaymentInput,
} from './payment-provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  status?: string;
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
  };
};

export type ReconcileAction = 'noop' | 'paid' | 'expired' | 'waiting' | 'failed_marked';

export class PaymentService {
  private readonly providers: Map<PaymentProviderCode, PaymentProvider>;
  private readonly razorpay: RazorpayProvider;
  private readonly pendingExpireMinutes: number;

  constructor(
    providers: PaymentProvider[],
    razorpay: RazorpayProvider,
    options?: { pendingExpireMinutes?: number },
  ) {
    this.providers = new Map(providers.map((provider) => [provider.code, provider]));
    this.razorpay = razorpay;
    this.pendingExpireMinutes = options?.pendingExpireMinutes ?? 30;
  }

  createIntent(
    providerCode: PaymentProviderCode,
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
    return this.getProvider(providerCode).createIntent(input);
  }

  verifyPayment(providerCode: PaymentProviderCode, input: VerifyPaymentInput): Promise<boolean> {
    return this.getProvider(providerCode).verifyPayment(input);
  }

  async createRazorpayIntentForOrder(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.paymentMethod === 'cash_on_delivery') {
      throw new AppError('Order is COD and does not need online payment', 400);
    }
    if (order.status === 'paid' || order.status === 'confirmed') {
      throw new AppError('Order is already paid', 409);
    }
    if (order.status === 'cancelled') {
      throw new AppError('Order is cancelled', 409);
    }

    // Reuse an existing open intent so retries / double-tap do not mint a second Razorpay order.
    const existingPayment = await Payment.findOne({
      orderId: String(order._id),
      status: { $in: ['created', 'paid'] },
    }).sort({ createdAt: -1 });

    if (existingPayment?.status === 'paid') {
      throw new AppError('Order is already paid', 409);
    }
    if (existingPayment?.status === 'created') {
      return {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        provider: existingPayment.provider,
        providerIntentId: existingPayment.providerIntentId,
        keyId: this.razorpay.publicKeyId,
        amountMinor: existingPayment.amountMinor,
        currency: existingPayment.currency,
        demoMode: Boolean(existingPayment.demoMode),
        reused: true as const,
      };
    }

    const amountMinor = Math.round(order.total * 100);
    const intent = await this.razorpay.createIntent({
      checkoutId: order.orderNumber,
      customerId: order.customer.email,
      customer: order.customer,
      amount: { amountMinor, currency: 'INR' },
    });

    await Payment.findOneAndUpdate(
      { providerIntentId: intent.providerIntentId },
      {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        provider: intent.provider,
        providerIntentId: intent.providerIntentId,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        status: 'created',
        demoMode: intent.demoMode,
      },
      { upsert: true, new: true },
    );

    return {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      ...intent,
      reused: false as const,
    };
  }

  async confirmRazorpayPayment(input: {
    orderId: string;
    providerIntentId: string;
    providerPaymentId: string;
    signature: string;
  }) {
    const order = await Order.findById(input.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const payment = await Payment.findOne({ providerIntentId: input.providerIntentId });
    if (!payment) {
      throw new AppError('Payment intent not found', 404);
    }
    if (payment.orderId !== String(order._id)) {
      throw new AppError('Payment does not belong to this order', 400);
    }
    if (payment.status === 'paid') {
      return {
        order,
        payment,
        alreadyPaid: true,
        awardedXp: Number(order.runeXpAwarded ?? 0),
      };
    }

    const ok = await this.razorpay.verifyPayment({
      providerIntentId: input.providerIntentId,
      providerPaymentId: input.providerPaymentId,
      signature: input.signature,
    });
    if (!ok) {
      payment.status = 'failed';
      await payment.save();
      throw new AppError('Invalid payment signature', 400);
    }

    return this.markRazorpayPaid(payment, input.providerPaymentId);
  }

  async handleRazorpayWebhook(input: {
    rawBody: Buffer;
    signature?: string;
    eventId?: string;
  }) {
    if (this.razorpay.isDemoMode) {
      throw new AppError('Webhooks require Razorpay Test/Live keys (demo mode is active)', 400);
    }
    if (!this.razorpay.hasWebhookSecret) {
      throw new AppError('RAZORPAY_WEBHOOK_SECRET is not configured', 503);
    }
    if (!this.razorpay.verifyWebhookSignature(input.rawBody, input.signature)) {
      throw new AppError('Invalid webhook signature', 400);
    }

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(input.rawBody.toString('utf8')) as RazorpayWebhookPayload;
    } catch {
      throw new AppError('Invalid webhook payload', 400);
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const dedupeId =
      input.eventId ??
      `${payload.event}:${paymentEntity?.id ?? paymentEntity?.order_id ?? 'unknown'}`;

    const existing = await PaymentWebhookEvent.findOne({ eventId: dedupeId });
    if (existing) {
      return { duplicate: true as const, status: existing.status };
    }

    const result = await this.processRazorpayWebhookEvent(payload);
    await PaymentWebhookEvent.create({
      eventId: dedupeId,
      event: payload.event,
      provider: 'razorpay',
      providerPaymentId: result.providerPaymentId,
      providerIntentId: result.providerIntentId,
      status: result.status,
    });

    return result;
  }

  /** Test/demo checkout: mint a valid signed payment without opening Razorpay SDK. */
  async completeDemoRazorpayPayment(orderId: string) {
    if (!this.razorpay.isDemoMode) {
      throw new AppError(
        'Demo payment is disabled when Razorpay keys are configured — use native checkout',
        403,
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    let payment = await Payment.findOne({ orderId: String(order._id), status: 'created' });
    if (!payment) {
      const created = await this.createRazorpayIntentForOrder(orderId);
      payment = await Payment.findOne({ providerIntentId: created.providerIntentId });
    }
    if (!payment) {
      throw new AppError('Could not create demo payment', 500);
    }

    const providerPaymentId = `pay_demo_${nanoid(10)}`;
    const signature = this.razorpay.signDemoPayment(payment.providerIntentId, providerPaymentId);

    return this.confirmRazorpayPayment({
      orderId: String(order._id),
      providerIntentId: payment.providerIntentId,
      providerPaymentId,
      signature,
    });
  }

  /**
   * Reconcile one order: if Razorpay captured → finalize paid;
   * if still unpaid after PENDING_PAYMENT_EXPIRE_MINUTES → cancel (payment_expired).
   * Razorpay `payment.failed` already marks Payment failed; expiry cleans abandoned Orders.
   */
  async reconcileOrderById(orderId: string): Promise<{ action: ReconcileAction }> {
    const order = await Order.findById(orderId);
    if (!order) {
      return { action: 'noop' };
    }
    if (order.status !== 'pending_payment') {
      return { action: 'noop' };
    }

    const payment = await Payment.findOne({ orderId: String(order._id) }).sort({ createdAt: -1 });

    if (payment && payment.status !== 'paid' && !this.razorpay.isDemoMode) {
      const captured = await this.razorpay.findCapturedPayment(payment.providerIntentId);
      if (captured) {
        await this.markRazorpayPaid(payment, captured.id, {
          reconciled: true,
          providerStatus: captured.status,
        });
        logger.info(
          { orderId: String(order._id), orderNumber: order.orderNumber },
          'Reconciled pending order as paid from Razorpay',
        );
        return { action: 'paid' };
      }
    }

    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    const expireMs = this.pendingExpireMinutes * 60_000;
    if (ageMs < expireMs) {
      return { action: 'waiting' };
    }

    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending_payment' },
      { $set: { status: 'cancelled', cancelReason: 'payment_expired' } },
      { new: true },
    );
    if (!claimed) {
      return { action: 'noop' };
    }

    await releaseStock(
      claimed.items.map((item) => ({
        productId: String(item.productId),
        quantity: item.quantity,
      })),
    );

    if (payment && payment.status !== 'paid') {
      payment.status = 'failed';
      await payment.save();
    }
    logger.info(
      {
        orderId: String(claimed._id),
        orderNumber: claimed.orderNumber,
        expireMinutes: this.pendingExpireMinutes,
      },
      'Expired unpaid pending_payment order and released stock',
    );
    return { action: 'expired' };
  }

  /** Batch reconcile (in-process timer). Caps batch size to keep dyno work bounded. */
  async reconcileStalePending(limit = 50) {
    const orders = await Order.find({ status: 'pending_payment' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select('_id');
    const summary = { paid: 0, expired: 0, waiting: 0, noop: 0, failed_marked: 0 };
    for (const row of orders) {
      try {
        const { action } = await this.reconcileOrderById(String(row._id));
        summary[action] += 1;
      } catch (error) {
        logger.warn({ err: error, orderId: String(row._id) }, 'Reconcile order failed');
      }
    }
    return summary;
  }

  private async processRazorpayWebhookEvent(payload: RazorpayWebhookPayload) {
    const paymentEntity = payload.payload?.payment?.entity;
    const providerIntentId = paymentEntity?.order_id;
    const providerPaymentId = paymentEntity?.id;

    if (payload.event === 'payment.captured') {
      if (!providerIntentId || !providerPaymentId) {
        throw new AppError('Webhook missing payment identifiers', 400);
      }
      const payment = await Payment.findOne({ providerIntentId });
      if (!payment) {
        throw new AppError('Payment intent not found for webhook', 404);
      }
      await this.markRazorpayPaid(payment, providerPaymentId, {
        webhookEvent: payload.event,
        providerPaymentId,
      });
      return {
        status: 'processed' as const,
        providerIntentId,
        providerPaymentId,
      };
    }

    if (payload.event === 'payment.failed') {
      if (!providerIntentId) {
        return { status: 'ignored' as const };
      }
      const payment = await Payment.findOne({ providerIntentId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'failed';
        if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
        await payment.save();
      }
      return {
        status: 'processed' as const,
        providerIntentId,
        providerPaymentId,
      };
    }

    return {
      status: 'ignored' as const,
      providerIntentId,
      providerPaymentId,
    };
  }

  private async markRazorpayPaid(
    payment: InstanceType<typeof Payment>,
    providerPaymentId: string,
    raw?: Record<string, unknown>,
  ) {
    const claimedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: 'paid' } },
      {
        $set: {
          status: 'paid',
          providerPaymentId,
          ...(raw ? { raw } : {}),
        },
      },
      { new: true },
    );

    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!claimedPayment) {
      return {
        order,
        payment: (await Payment.findById(payment._id)) ?? payment,
        alreadyPaid: true,
        awardedXp: Number(order.runeXpAwarded ?? 0),
      };
    }

    let awardedXp = 0;
    if (order.status === 'pending_payment') {
      awardedXp = await this.finalizePaidOrder(order);
    } else {
      awardedXp = Number(order.runeXpAwarded ?? 0);
    }

    const freshOrder = (await Order.findById(order._id)) ?? order;
    return {
      order: freshOrder,
      payment: claimedPayment,
      alreadyPaid: false,
      awardedXp,
    };
  }

  private async finalizePaidOrder(order: InstanceType<typeof Order>) {
    const xp = await computeOrderRuneXp(
      order.items.map((item) => ({ productId: String(item.productId), quantity: item.quantity })),
    );

    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending_payment' },
      { $set: { status: 'paid', runeXpAwarded: xp } },
      { new: true },
    );

    if (!claimed) {
      const current = await Order.findById(order._id);
      return Number(current?.runeXpAwarded ?? 0);
    }

    // Stock was already reserved at POST /orders — do not decrement again.

    if (xp > 0 && claimed.userId) {
      await awardOrderRuneXp(
        String(claimed.userId),
        claimed.items.map((item) => ({
          productId: String(item.productId),
          quantity: item.quantity,
        })),
      );
    }

    return xp;
  }

  private getProvider(providerCode: PaymentProviderCode): PaymentProvider {
    const provider = this.providers.get(providerCode);

    if (!provider) {
      throw new Error(`Payment provider is not registered: ${providerCode}`);
    }

    return provider;
  }
}
