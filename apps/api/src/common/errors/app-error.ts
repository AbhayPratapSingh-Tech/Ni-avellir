export class AppError extends Error {
  readonly statusCode: number;
  readonly type?: string;
  readonly isOperational = true;

  constructor(message: string, statusCode: number, type?: string) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
  }
}
