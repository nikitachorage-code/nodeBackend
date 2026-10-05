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
    JWT_REFRESH_SECRET: z.ZodString;
    JWT_REFRESH_TTL: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): Env;
export {};
