import { z } from 'zod';
const bool = z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true');
const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('1h'),
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),
    ALLOW_TIME_TRAVEL: bool,
    EXPOSE_DEV_TOKENS: bool,
    ENABLE_SCHEDULER: z
        .enum(['true', 'false'])
        .default('true')
        .transform((v) => v === 'true'),
    GLOBAL_THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
    WARNING_LEAD_DAYS: z.coerce.number().int().positive().default(30),
    SEED_ADMIN_EMAIL: z.string().default('admin@example.com'),
    SEED_ADMIN_PASSWORD: z.string().default('Admin123!'),
});
export function validateEnv(config) {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        throw new Error(`Invalid environment variables: ${issues}`);
    }
    return result.data;
}
//# sourceMappingURL=env.validation.js.map