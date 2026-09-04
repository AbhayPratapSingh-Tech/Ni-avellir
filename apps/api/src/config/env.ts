import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(apiRoot, '.env.development') });
dotenv.config({ path: path.join(apiRoot, '.env') });

const envSchema = z.object({
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  JWT_ACCESS_SECRET: z.string().min(1).default('development-access-secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('development-refresh-secret'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/nidavellir_dev'),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default('Niðavellir <onboarding@resend.dev>'),
  EMAIL_DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  SMS_PROVIDER: z.enum(['msg91', 'twilio', 'none']).default('none'),
  SMS_DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
});

export type Env = ReturnType<typeof loadEnv>;

export function loadEnv() {
  const parsed = envSchema.parse(process.env);

  return {
    apiBaseUrl: parsed.API_BASE_URL,
    corsOrigins: parsed.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
    mongodbUri: parsed.MONGODB_URI,
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    razorpayKeyId: parsed.RAZORPAY_KEY_ID,
    razorpayKeySecret: parsed.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: parsed.RAZORPAY_WEBHOOK_SECRET,
    resendApiKey: parsed.RESEND_API_KEY,
    emailFrom: parsed.EMAIL_FROM,
    emailDemoMode:
      process.env.EMAIL_DEMO_MODE !== undefined
        ? Boolean(parsed.EMAIL_DEMO_MODE)
        : !parsed.RESEND_API_KEY ||
          Boolean(parsed.RESEND_API_KEY?.startsWith('replace-with')) ||
          parsed.NODE_ENV === 'development',
    smsProvider: parsed.SMS_PROVIDER,
    smsDemoMode:
      process.env.SMS_DEMO_MODE !== undefined
        ? Boolean(parsed.SMS_DEMO_MODE)
        : parsed.NODE_ENV === 'development',
    msg91AuthKey: parsed.MSG91_AUTH_KEY,
    msg91TemplateId: parsed.MSG91_TEMPLATE_ID,
    msg91SenderId: parsed.MSG91_SENDER_ID,
    twilioAccountSid: parsed.TWILIO_ACCOUNT_SID,
    twilioAuthToken: parsed.TWILIO_AUTH_TOKEN,
    twilioFromNumber: parsed.TWILIO_FROM_NUMBER,
  };
}
