import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (
  // Controllers often use AuthenticatedRequest; keep this permissive.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

/** Express 4 does not catch async rejections — always wrap async route handlers. */
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    void Promise.resolve(handler(request, response, next)).catch(next);
  };
}
