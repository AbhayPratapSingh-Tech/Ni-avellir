import { loadEnv } from '../../config/env.js';
import {
  buildOrderEmailHtml,
  createEmailService,
} from '../../integrations/email/email.factory.js';

export async function sendOrderStatusEmail(input: {
  to: string;
  orderNumber: string;
  status: string;
  total: number;
}) {
  const env = loadEnv();
  const email = createEmailService(env);
  await email.send({
    to: input.to,
    subject: `Order ${input.orderNumber} — ${input.status}`,
    html: buildOrderEmailHtml(input.orderNumber, input.status, input.total),
    text: `Order ${input.orderNumber} is now ${input.status}. Total ₹${input.total}`,
  });
}
