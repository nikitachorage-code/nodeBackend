import { HttpException } from '@nestjs/common';

/** HttpException carrying a stable machine-readable `code` and optional `details`. */
export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, status);
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new ApiException(400, code, message, details);
export const unauthorized = (code: string, message: string) =>
  new ApiException(401, code, message);
export const forbidden = (code: string, message: string) =>
  new ApiException(403, code, message);
export const notFound = (code: string, message: string) =>
  new ApiException(404, code, message);
export const conflict = (code: string, message: string, details?: unknown) =>
  new ApiException(409, code, message, details);
