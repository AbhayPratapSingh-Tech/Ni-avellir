import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { Env } from '../../config/env.js';
import { AppError } from '../../common/errors/app-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';
import {
  buildResetPasswordHtml,
  buildVerifyEmailHtml,
  createEmailService,
} from '../../integrations/email/email.factory.js';
import type { EmailService } from '../../integrations/email/email.service.js';
import { SmsService } from '../../integrations/sms/sms.service.js';
import { OtpChallenge, type OtpPurpose } from './otp-challenge.model.js';
import { RefreshToken } from './refresh-token.model.js';
import { User } from './user.model.js';

const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10);
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOtpCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export class AuthService {
  private readonly sms: SmsService;
  private readonly email: EmailService;

  constructor(private readonly env: Env) {
    this.sms = new SmsService(env);
    this.email = createEmailService(env);
  }

  private issueTokens(user: { _id: unknown; role: string }, deviceId?: string) {
    const payload = { sub: String(user._id), role: user.role };
    const accessToken = signAccessToken(this.env, payload);
    const refreshToken = signRefreshToken(this.env, payload);
    return { accessToken, refreshToken, deviceId };
  }

  private async persistRefreshToken(userId: string, refreshToken: string, deviceId?: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId,
      tokenHash: hashToken(refreshToken),
      deviceId,
      expiresAt,
    });
  }

  private sanitizeUser(user: {
    _id: unknown;
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    role: string;
    avatarUrl?: string;
  }) {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    deviceId?: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const phone = normalizePhone(input.phone);
    await this.assertRegistrationAvailable(email, phone);
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await User.create({
      name: input.name.trim(),
      email,
      phone,
      passwordHash,
      emailVerified: false,
      phoneVerified: false,
    });
    const tokens = this.issueTokens(user, input.deviceId);
    await this.persistRefreshToken(String(user._id), tokens.refreshToken, input.deviceId);
    const emailVerification = await this.sendEmailVerification(String(user._id));
    return { user: this.sanitizeUser(user), ...tokens, emailVerification };
  }

  async checkRegistration(input: { email?: string; phone?: string }) {
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone ? normalizePhone(input.phone) : undefined;
    const [emailTaken, phoneTaken] = await Promise.all([
      email ? User.exists({ email }) : Promise.resolve(null),
      phone && phone.length >= 10 ? User.exists({ phone }) : Promise.resolve(null),
    ]);
    return {
      emailAvailable: !emailTaken,
      phoneAvailable: !phoneTaken,
      emailMessage: emailTaken ? 'This email is already registered' : undefined,
      phoneMessage: phoneTaken ? 'This phone number is already registered' : undefined,
    };
  }

  private async assertRegistrationAvailable(email: string, phone: string) {
    const [emailTaken, phoneTaken] = await Promise.all([
      User.exists({ email }),
      User.exists({ phone }),
    ]);
    if (emailTaken) {
      throw new AppError('This email is already registered', 409);
    }
    if (phoneTaken) {
      throw new AppError('This phone number is already registered', 409);
    }
  }

  async login(input: { email: string; password: string; deviceId?: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user?.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError('Invalid email or password', 401);
    }
    const tokens = this.issueTokens(user, input.deviceId);
    await this.persistRefreshToken(String(user._id), tokens.refreshToken, input.deviceId);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async sendOtp(input: { phone: string; purpose?: OtpPurpose; name?: string; email?: string }) {
    const phone = normalizePhone(input.phone);
    if (phone.length < 10) {
      throw new AppError('Invalid phone number', 422);
    }
    const purpose = input.purpose ?? 'login';
    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await OtpChallenge.deleteMany({ phone, purpose });
    await OtpChallenge.create({ phone, codeHash, purpose, attempts: 0, expiresAt });
    await this.sms.sendOtp(phone, code);
    return { sent: true, expiresInSeconds: OTP_TTL_MS / 1000, demoCode: this.env.smsDemoMode ? code : undefined };
  }

  async verifyOtp(input: {
    phone: string;
    code: string;
    purpose?: OtpPurpose;
    name?: string;
    email?: string;
    deviceId?: string;
  }) {
    const phone = normalizePhone(input.phone);
    const purpose = input.purpose ?? 'login';
    const challenge = await OtpChallenge.findOne({ phone, purpose }).sort({ createdAt: -1 });
    if (!challenge) {
      throw new AppError('OTP expired or not found', 400);
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new AppError('OTP expired', 400);
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('Too many OTP attempts', 429);
    }
    const valid = await bcrypt.compare(input.code, challenge.codeHash);
    challenge.attempts += 1;
    await challenge.save();
    if (!valid) {
      throw new AppError('Invalid OTP', 401);
    }
    await OtpChallenge.deleteMany({ phone, purpose });

    let user = await User.findOne({ phone });
    if (!user && purpose === 'login') {
      user = await User.create({
        name: input.name?.trim() || `User ${phone.slice(-4)}`,
        email: input.email?.trim().toLowerCase() || `${phone}@phone.nidavellir.local`,
        phone,
        phoneVerified: true,
        emailVerified: false,
      });
    } else if (user) {
      user.phoneVerified = true;
      await user.save();
    } else {
      throw new AppError('User not found for OTP verification', 404);
    }

    const tokens = this.issueTokens(user, input.deviceId);
    await this.persistRefreshToken(String(user._id), tokens.refreshToken, input.deviceId);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(this.env, refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
    const stored = await RefreshToken.findOne({
      tokenHash: hashToken(refreshToken),
      revokedAt: { $exists: false },
    });
    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      throw new AppError('Refresh token revoked or expired', 401);
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const tokens = this.issueTokens(user);
    stored.revokedAt = new Date();
    await stored.save();
    await this.persistRefreshToken(String(user._id), tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { ok: true };
    await RefreshToken.updateOne(
      { tokenHash: hashToken(refreshToken) },
      { revokedAt: new Date() },
    );
    return { ok: true };
  }

  async me(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    input: Partial<{ name: string; email: string; avatarUrl: string }>,
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (input.name) user.name = input.name.trim();
    if (input.email) user.email = input.email.trim().toLowerCase();
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    await user.save();
    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return { sent: true };
    }
    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await OtpChallenge.deleteMany({ email: normalized, purpose: 'reset_password' });
    await OtpChallenge.create({
      email: normalized,
      codeHash,
      purpose: 'reset_password',
      attempts: 0,
      expiresAt,
    });
    await this.email.send({
      to: normalized,
      subject: 'Reset your Niðavellir password',
      html: buildResetPasswordHtml(code),
      text: `Your password reset code is ${code}`,
    });
    return {
      sent: true,
      demoCode: this.env.emailDemoMode || this.env.smsDemoMode ? code : undefined,
    };
  }

  async resetPassword(input: { email: string; code: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const challenge = await OtpChallenge.findOne({ email, purpose: 'reset_password' }).sort({
      createdAt: -1,
    });
    if (!challenge) {
      throw new AppError('Reset code expired or not found', 400);
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('Too many attempts', 429);
    }
    const valid = await bcrypt.compare(input.code, challenge.codeHash);
    challenge.attempts += 1;
    await challenge.save();
    if (!valid) {
      throw new AppError('Invalid reset code', 401);
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await user.save();
    await OtpChallenge.deleteMany({ email, purpose: 'reset_password' });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user?.passwordHash) {
      throw new AppError('Password login not enabled for this account', 400);
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError('Current password is incorrect', 401);
    }
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();
    return { ok: true };
  }

  async listSessions(userId: string) {
    const sessions = await RefreshToken.find({
      userId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    return sessions.map((s) => ({
      id: String(s._id),
      deviceId: s.deviceId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await RefreshToken.updateOne(
      { _id: sessionId, userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );
    return { ok: true };
  }

  async sendEmailVerificationByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) throw new AppError('User not found', 404);
    if (user.emailVerified) return { alreadyVerified: true as const };
    return this.sendEmailVerification(String(user._id));
  }

  async sendEmailVerification(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.emailVerified) return { alreadyVerified: true as const };

    const code = generateOtpCode();
    const token = crypto.randomBytes(24).toString('hex');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await OtpChallenge.deleteMany({ email: user.email, purpose: 'verify_email' });
    await OtpChallenge.create({
      email: user.email,
      codeHash: `${codeHash}:${tokenHash}`,
      purpose: 'verify_email',
      attempts: 0,
      expiresAt,
    });

    const verifyUrl = `${this.env.apiBaseUrl}/api/v1/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    await this.email.send({
      to: user.email,
      subject: 'Verify your Niðavellir email',
      html: buildVerifyEmailHtml(verifyUrl, code),
      text: `Verify: ${verifyUrl} or code ${code}`,
    });

    return {
      sent: true as const,
      demoCode: this.env.emailDemoMode ? code : undefined,
      demoVerifyUrl: this.env.emailDemoMode ? verifyUrl : undefined,
    };
  }

  async verifyEmail(input: { email: string; code?: string; token?: string }) {
    const email = input.email.trim().toLowerCase();
    const challenge = await OtpChallenge.findOne({ email, purpose: 'verify_email' }).sort({
      createdAt: -1,
    });
    if (!challenge) throw new AppError('Verification expired or not found', 400);
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new AppError('Verification expired', 400);
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('Too many attempts', 429);
    }

    const [codeHash, tokenHash] = challenge.codeHash.split(':');
    let ok = false;
    if (input.code && codeHash) {
      ok = await bcrypt.compare(input.code, codeHash);
    } else if (input.token && tokenHash) {
      ok = hashToken(input.token) === tokenHash;
    }
    challenge.attempts += 1;
    await challenge.save();
    if (!ok) throw new AppError('Invalid verification code', 401);

    const user = await User.findOne({ email });
    if (!user) throw new AppError('User not found', 404);
    user.emailVerified = true;
    await user.save();
    await OtpChallenge.deleteMany({ email, purpose: 'verify_email' });
    return { user: this.sanitizeUser(user) };
  }
}
