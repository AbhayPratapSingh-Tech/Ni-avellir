import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { Env } from '../../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  role: string;
};

export function signAccessToken(env: Env, payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(env: Env, payload: AccessTokenPayload): string {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
    },
  );
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(env: Env, token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AccessTokenPayload;
}
