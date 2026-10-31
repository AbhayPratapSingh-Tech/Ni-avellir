import { Router } from 'express';
import multer from 'multer';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { authIpLimit, loginIpLimit, otpSendIpLimit } from '../../common/middleware/ip-rate-limit.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1_200_000 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function createAuthRouter(env: Env) {
  const router = Router();
  const service = new AuthService(env);
  const controller = new AuthController(service);
  const requireAuth = createRequireAuth(env);

  router.post('/register', authIpLimit, asyncHandler(controller.register));
  router.post('/register/check', authIpLimit, asyncHandler(controller.checkRegistration));
  router.post('/login', loginIpLimit, asyncHandler(controller.login));
  router.post('/otp/send', otpSendIpLimit, asyncHandler(controller.sendOtp));
  router.post('/otp/verify', authIpLimit, asyncHandler(controller.verifyOtp));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.post('/logout', asyncHandler(controller.logout));
  router.post('/forgot-password', otpSendIpLimit, asyncHandler(controller.forgotPassword));
  router.post('/reset-password', authIpLimit, asyncHandler(controller.resetPassword));
  router.get('/me', requireAuth, asyncHandler(controller.me));
  router.patch('/me', requireAuth, asyncHandler(controller.updateProfile));
  router.post(
    '/me/avatar',
    requireAuth,
    avatarUpload.single('avatar'),
    asyncHandler(controller.uploadAvatar),
  );
  router.post('/change-password', requireAuth, asyncHandler(controller.changePassword));
  router.get('/sessions', requireAuth, asyncHandler(controller.listSessions));
  router.delete('/sessions/:sessionId', requireAuth, asyncHandler(controller.revokeSession));
  router.post('/verify-email/send', requireAuth, otpSendIpLimit, asyncHandler(controller.sendVerifyEmail));
  router.post('/verify-email/resend', otpSendIpLimit, asyncHandler(controller.resendVerifyEmail));
  router.get('/verify-email', asyncHandler(controller.verifyEmail));
  router.post('/verify-email', authIpLimit, asyncHandler(controller.verifyEmail));

  return router;
}
