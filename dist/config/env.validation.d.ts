import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodString;
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_ACCESS_TTL: z.ZodDefault<z.ZodString>;
    UPLOAD_DIR: z.ZodDefault<z.ZodString>;
    MAX_UPLOAD_BYTES: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    ALLOW_TIME_TRAVEL: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    EXPOSE_DEV_TOKENS: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    ENABLE_SCHEDULER: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    GLOBAL_THROTTLE_LIMIT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AUTH_THROTTLE_LIMIT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WARNING_LEAD_DAYS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SEED_ADMIN_EMAIL: z.ZodDefault<z.ZodString>;
    SEED_ADMIN_PASSWORD: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): Env;
export {};
