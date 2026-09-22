import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce.number().int().positive().default(3001),

    DATABASE_URL: z.string().min(1),

    WEB_ORIGIN: z.string().url(),

    CSRF_SECRET: z.string().min(32),

    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
});
