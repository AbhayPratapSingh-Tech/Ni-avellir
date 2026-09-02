import type { Request, Response } from 'express';
import { PaymentService } from './payment.service.js';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  createIntent = async (request: Request, response: Response) => {
    const { orderId } = request.body as { orderId?: string };
    if (!orderId) {
      response.status(400).json({ error: { message: 'orderId is required' } });
      return;
    }
    const intent = await this.service.createRazorpayIntentForOrder(orderId);
    response.status(201).json({ data: { intent } });
  };

  confirm = async (request: Request, response: Response) => {
    const body = request.body as {
      orderId?: string;
      providerIntentId?: string;
      providerPaymentId?: string;
      signature?: string;
    };
    if (!body.orderId || !body.providerIntentId || !body.providerPaymentId || !body.signature) {
      response.status(400).json({
        error: { message: 'orderId, providerIntentId, providerPaymentId, and signature are required' },
      });
      return;
    }
    const result = await this.service.confirmRazorpayPayment({
      orderId: body.orderId,
      providerIntentId: body.providerIntentId,
      providerPaymentId: body.providerPaymentId,
      signature: body.signature,
    });
    response.json({
      data: {
        order: result.order,
        payment: result.payment,
        alreadyPaid: result.alreadyPaid,
      },
    });
  };

  /** Dummy / test checkout without native Razorpay SDK. */
  demoComplete = async (request: Request, response: Response) => {
    const { orderId } = request.body as { orderId?: string };
    if (!orderId) {
      response.status(400).json({ error: { message: 'orderId is required' } });
      return;
    }
    const result = await this.service.completeDemoRazorpayPayment(orderId);
    response.json({
      data: {
        order: result.order,
        payment: result.payment,
        alreadyPaid: result.alreadyPaid,
        demo: true,
      },
    });
  };

  /** Razorpay server webhook — idempotent backup to client /confirm. */
  razorpayWebhook = async (request: Request, response: Response) => {
    const signature = request.headers['x-razorpay-signature'];
    const eventId = request.headers['x-razorpay-event-id'];
    const rawBody = request.body;
    if (!Buffer.isBuffer(rawBody)) {
      response.status(400).json({ error: { message: 'Webhook requires raw JSON body' } });
      return;
    }
    const result = await this.service.handleRazorpayWebhook({
      rawBody,
      signature: typeof signature === 'string' ? signature : undefined,
      eventId: typeof eventId === 'string' ? eventId : undefined,
    });
    response.json({ data: result });
  };
}
