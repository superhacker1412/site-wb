"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    CLIENT_ORIGIN: zod_1.z.string().default("http://localhost:8080"),
    TRUST_PROXY: zod_1.z.coerce.number().int().min(0).default(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    ACCESS_TOKEN_MINUTES: zod_1.z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_DAYS: zod_1.z.coerce.number().int().positive().default(30),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().int().min(8).max(14).default(10),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(400),
    AUTH_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(900000),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(20),
    FEEDBACK_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(3600000),
    FEEDBACK_RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(25),
    ADMIN_NAME: zod_1.z.string().default("Admin"),
    ADMIN_EMAIL: zod_1.z.string().email().default("admin@example.com"),
    ADMIN_PASSWORD: zod_1.z.string().min(8).default("admin12345"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map