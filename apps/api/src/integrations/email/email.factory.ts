import { logger } from '../../common/logger/logger.js';
import type { Env } from '../../config/env.js';
import type { EmailProvider, SendEmailInput } from './email-provider.js';
import { ResendProvider } from './providers/resend.provider.js';
import { EmailService } from './email.service.js';

class ConsoleEmailProvider implements EmailProvider {
  readonly code = 'console';

  async send(input: SendEmailInput): Promise<void> {
    logger.info(
      { to: input.to, subject: input.subject, text: input.text ?? input.html },
      'Email demo mode — message logged (not sent)',
    );
  }
}

export function createEmailService(env: Env): EmailService {
  const key = env.resendApiKey;
  const from = env.emailFrom;
  if (!env.emailDemoMode && key && !key.startsWith('replace-with') && from) {
    logger.info({ from, provider: 'resend' }, 'Email provider: Resend (live send)');
    return new EmailService(new ResendProvider(key, from));
  }
  logger.warn(
    {
      emailDemoMode: env.emailDemoMode,
      hasKey: Boolean(key && !key.startsWith('replace-with')),
    },
    'Email provider: console demo (no inbox delivery)',
  );
  return new EmailService(new ConsoleEmailProvider());
}

/** Origin only — strips accidental `/api/v1` so verify links stay correct. */
export function publicApiOrigin(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
}

const BRAND = {
  accent: '#155EEF',
  accentSoft: '#DBEAFE',
  bg: '#F5F6F8',
  surface: '#FFFFFF',
  text: '#111318',
  muted: '#6B7280',
  border: '#E5E7EB',
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared Niðavellir shell — inline styles for email clients. */
function emailLayout(input: { title: string; preheader: string; bodyHtml: string }) {
  const title = escapeHtml(input.title);
  const preheader = escapeHtml(input.preheader);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.accent};padding:20px 24px;">
              <p style="margin:0;color:#FFFFFF;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">Niðavellir</p>
              <p style="margin:6px 0 0;color:#FFFFFF;font-size:20px;font-weight:800;line-height:1.3;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:${BRAND.text};font-size:15px;line-height:1.55;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;color:${BRAND.muted};font-size:12px;line-height:1.5;">
              Forge Account · College project · Not a commercial storefront.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function codeBlock(code: string) {
  return `<div style="margin:20px 0;padding:16px 20px;background:${BRAND.accentSoft};border-radius:12px;text-align:center;">
    <p style="margin:0 0 6px;color:${BRAND.muted};font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Your code</p>
    <p style="margin:0;color:${BRAND.text};font-size:32px;font-weight:800;letter-spacing:6px;">${escapeHtml(code)}</p>
  </div>`;
}

function ctaButton(href: string, label: string) {
  return `<p style="margin:24px 0 8px;text-align:center;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND.accent};color:#FFFFFF;text-decoration:none;font-weight:800;font-size:15px;padding:12px 22px;border-radius:10px;">${escapeHtml(label)}</a>
  </p>`;
}

export function buildVerifyEmailHtml(verifyUrl: string, code: string) {
  return emailLayout({
    title: 'Verify your email',
    preheader: `Your Niðavellir code is ${code}`,
    bodyHtml: `
      <p style="margin:0 0 12px;">Welcome to the forge. Confirm this email to secure your account and unlock order updates.</p>
      ${codeBlock(code)}
      <p style="margin:0;">Enter the code in the app, or use the button below.</p>
      ${ctaButton(verifyUrl, 'Verify email')}
      <p style="margin:16px 0 0;color:${BRAND.muted};font-size:13px;">If you did not create a Niðavellir account, you can ignore this message.</p>
    `,
  });
}

export function buildOrderEmailHtml(orderNumber: string, status: string, total: number) {
  const safeOrder = escapeHtml(orderNumber);
  const safeStatus = escapeHtml(status);
  const totalLabel = `₹${total.toLocaleString('en-IN')}`;
  return emailLayout({
    title: `Order ${safeOrder}`,
    preheader: `Order ${orderNumber} is now ${status}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Your forge order is now <strong>${safeStatus}</strong>.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:12px 16px;background:${BRAND.bg};color:${BRAND.muted};font-size:13px;font-weight:700;">Order</td>
          <td style="padding:12px 16px;background:${BRAND.bg};color:${BRAND.text};font-size:14px;font-weight:700;text-align:right;">${safeOrder}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;font-weight:700;">Status</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:700;text-align:right;">${safeStatus}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;font-weight:700;">Total</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.accent};font-size:16px;font-weight:800;text-align:right;">${escapeHtml(totalLabel)}</td>
        </tr>
      </table>
      <p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;">Open the Niðavellir app → My Orders for details.</p>
    `,
  });
}

export function buildResetPasswordHtml(code: string) {
  return emailLayout({
    title: 'Reset your password',
    preheader: `Your Niðavellir reset code is ${code}`,
    bodyHtml: `
      <p style="margin:0 0 12px;">Use this code in the app to set a new password. It expires in <strong>10 minutes</strong>.</p>
      ${codeBlock(code)}
      <p style="margin:0;color:${BRAND.muted};font-size:13px;">If you did not request a reset, you can ignore this email — your password will stay the same.</p>
    `,
  });
}
