import 'dotenv/config';

/** Per-minute limit for auth routes. Read at import time because decorators are static. */
export const AUTH_THROTTLE = {
  default: {
    limit: Number(process.env['AUTH_THROTTLE_LIMIT'] ?? 10),
    ttl: 60_000,
  },
};
