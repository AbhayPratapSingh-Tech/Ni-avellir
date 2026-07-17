import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logger/logger.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
      },
    });
    return;
  }

  logger.error({ error }, 'Unhandled API error');
  response.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
};
