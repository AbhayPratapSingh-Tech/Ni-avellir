import type { NextFunction, Request, Response } from 'express';

export type GuestSessionRequest = Request & {
  guestSessionId?: string;
};

export function guestSessionMiddleware(
  request: GuestSessionRequest,
  _response: Response,
  next: NextFunction,
) {
  const guestId = request.headers['x-guest-session'];
  if (typeof guestId === 'string' && guestId.trim().length >= 8) {
    request.guestSessionId = guestId.trim();
  }
  next();
}
