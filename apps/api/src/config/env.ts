import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Prefer local development file after clone (`npm run setup` copies the example).
dotenv.config({ path: path.join(apiRoot, '.env.development') });
dotenv.config({ path: path.join(apiRoot, '.env') });

const envSchema = z.object({
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  JWT_ACCESS_SECRET: z.string().min(1).default('development-access-secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('development-refresh-secret'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/nidavellir_dev'),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = ReturnType<typeof loadEnv>;

export function loadEnv() {
  const parsed = envSchema.parse(process.env);

  return {
    apiBaseUrl: parsed.API_BASE_URL,
    corsOrigins: parsed.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
    mongodbUri: parsed.MONGODB_URI,
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    razorpayKeyId: parsed.RAZORPAY_KEY_ID,
    razorpayKeySecret: parsed.RAZORPAY_KEY_SECRET,
    resendApiKey: parsed.RESEND_API_KEY,
  };
}
