import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import type { Env } from '../../config/env.js';
import { verifyAccessToken } from '../utils/jwt.js';

export type AuthenticatedRequest = Request & {
  userId?: string;
  userRole?: string;
};

export function createRequireAuth(env: Env) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }
    try {
      const token = header.slice('Bearer '.length);
      const payload = verifyAccessToken(env, token);
      request.userId = payload.sub;
      request.userRole = payload.role;
      return next();
    } catch {
      return next(new AppError('Invalid or expired token', 401));
    }
  };
}

export function optionalAuth(env: Env) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next();
    }
    try {
      const token = header.slice('Bearer '.length);
      const payload = verifyAccessToken(env, token);
      request.userId = payload.sub;
      request.userRole = payload.role;
    } catch {
      // ignore invalid token for optional auth
    }
    return next();
  };
}
