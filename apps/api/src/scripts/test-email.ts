/**
 * Smoke-test outbound email (Resend or console demo).
 *
 * Usage:
 *   npm run test:email --workspace apps/api
 *   npm run test:email --workspace apps/api -- you@example.com
 *
 * Real inbox: EMAIL_DEMO_MODE=false + real RESEND_API_KEY + verified EMAIL_FROM.
 */
import { loadEnv } from '../config/env.js';
import { createEmailService } from '../integrations/email/email.factory.js';
import { logger } from '../common/logger/logger.js';

async function main() {
  const env = loadEnv();
  const to = (process.argv[2] || process.env.EMAIL_TEST_TO || '').trim();
  if (!to) {
    console.error('Usage: npm run test:email --workspace apps/api -- you@example.com');
    process.exit(1);
  }

  const email = createEmailService(env);
  const mode = env.emailDemoMode ? 'DEMO (console only)' : 'LIVE (Resend)';
  logger.info(
    {
      mode,
      from: env.emailFrom,
      hasKey: Boolean(env.resendApiKey && !env.resendApiKey.startsWith('replace-with')),
      to,
    },
    'Sending test email',
  );

  await email.send({
    to,
    subject: 'Niðavellir email test',
    html: `<p>Test from Niðavellir API (${mode}).</p><p>If you see this in your inbox, Resend is configured.</p>`,
    text: `Test from Niðavellir API (${mode}).`,
  });

  if (env.emailDemoMode) {
    console.log(
      '\n✓ Logged to console only (EMAIL_DEMO_MODE). Set EMAIL_DEMO_MODE=false + RESEND_API_KEY for real delivery.\n',
    );
  } else {
    console.log(`\n✓ Sent via Resend to ${to} (check inbox / spam / Resend dashboard).\n`);
  }
}

main().catch((error) => {
  console.error('Email test failed:', error);
  process.exit(1);
});
