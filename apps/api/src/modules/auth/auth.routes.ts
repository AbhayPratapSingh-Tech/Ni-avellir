import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

export function createAuthRouter(env: Env) {
  const router = Router();
  const service = new AuthService(env);
  const controller = new AuthController(service);
  const requireAuth = createRequireAuth(env);

  const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many OTP requests. Try again in a minute.' } },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.post('/register', authLimiter, asyncHandler(controller.register));
  router.post('/register/check', authLimiter, asyncHandler(controller.checkRegistration));
  router.post('/login', authLimiter, asyncHandler(controller.login));
  router.post('/otp/send', otpLimiter, asyncHandler(controller.sendOtp));
  router.post('/otp/verify', authLimiter, asyncHandler(controller.verifyOtp));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.post('/logout', asyncHandler(controller.logout));
  router.post('/forgot-password', otpLimiter, asyncHandler(controller.forgotPassword));
  router.post('/reset-password', authLimiter, asyncHandler(controller.resetPassword));
  router.get('/me', requireAuth, asyncHandler(controller.me));
  router.patch('/me', requireAuth, asyncHandler(controller.updateProfile));
  router.post('/change-password', requireAuth, asyncHandler(controller.changePassword));
  router.get('/sessions', requireAuth, asyncHandler(controller.listSessions));
  router.delete('/sessions/:sessionId', requireAuth, asyncHandler(controller.revokeSession));
  router.post('/verify-email/send', requireAuth, otpLimiter, asyncHandler(controller.sendVerifyEmail));
  router.post('/verify-email/resend', otpLimiter, asyncHandler(controller.resendVerifyEmail));
  router.get('/verify-email', asyncHandler(controller.verifyEmail));
  router.post('/verify-email', authLimiter, asyncHandler(controller.verifyEmail));

  return router;
}
