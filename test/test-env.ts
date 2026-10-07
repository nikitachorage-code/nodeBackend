/** Environment for e2e runs. Uses a separate database so dev data is never touched. */
export const TEST_DATABASE_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/certtracker_test?schema=public';

export function applyTestEnv() {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    JWT_ACCESS_SECRET: 'test-secret-0123456789abcdef0123456789abcdef',
    JWT_ACCESS_TTL: '1h',
    UPLOAD_DIR: './uploads-test',
    ALLOW_TIME_TRAVEL: 'true',
    EXPOSE_DEV_TOKENS: 'true',
    ENABLE_SCHEDULER: 'false',
    GLOBAL_THROTTLE_LIMIT: '100000',
    AUTH_THROTTLE_LIMIT: '100000',
  });
}
