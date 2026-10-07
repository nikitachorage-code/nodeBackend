import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../errors/api-exception.js';

export interface ErrorBody {
  statusCode: number;
  error: string;
  code?: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

const REASONS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
};

/** One error shape for every error the API returns. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';
    let code: string | undefined;
    let details: unknown;

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as { message?: unknown; code?: string };
        if (Array.isArray(b.message)) {
          message = 'Validation failed';
          details = b.message;
          code = 'VALIDATION_FAILED';
        } else if (typeof b.message === 'string') {
          message = b.message;
        }
        if (b.code) code = b.code;
      }
      code ??= DEFAULT_CODES[status];
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      error: REASONS[status] ?? 'Error',
      ...(code ? { code } : {}),
      message,
      ...(details !== undefined ? { details } : {}),
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(body);
  }
}
