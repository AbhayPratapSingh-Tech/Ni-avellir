import { nanoid } from 'nanoid';
import { PaymentProviderCode } from '@nidavellir/shared/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { Order } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { Payment } from './payment.model.js';
import { PaymentWebhookEvent } from './payment-webhook-event.model.js';
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

export class PaymentService {
  private readonly providers: Map<PaymentProviderCode, PaymentProvider>;
  private readonly razorpay: RazorpayProvider;

  constructor(providers: PaymentProvider[], razorpay: RazorpayProvider) {
    this.providers = new Map(providers.map((provider) => [provider.code, provider]));
    this.razorpay = razorpay;
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
      return { order, payment, alreadyPaid: true };
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
    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (payment.status === 'paid') {
      return { order, payment, alreadyPaid: true };
    }

    payment.status = 'paid';
    payment.providerPaymentId = providerPaymentId;
    if (raw) payment.raw = raw;
    await payment.save();

    if (order.status === 'pending_payment') {
      await this.finalizePaidOrder(order);
    }

    return { order, payment, alreadyPaid: false };
  }

  private async finalizePaidOrder(order: InstanceType<typeof Order>) {
    order.status = 'paid';
    await order.save();

    await Promise.all(
      order.items.map((item) =>
        Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } }),
      ),
    );
  }

  private getProvider(providerCode: PaymentProviderCode): PaymentProvider {
    const provider = this.providers.get(providerCode);

    if (!provider) {
      throw new Error(`Payment provider is not registered: ${providerCode}`);
    }

    return provider;
  }
}
