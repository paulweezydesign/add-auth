"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
// Load environment variables
(0, dotenv_1.config)();
// Environment validation schema
var envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().optional(),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.coerce.number().default(5432),
    DB_NAME: zod_1.z.string().default('add_auth'),
    DB_USER: zod_1.z.string().default('postgres'),
    DB_PASSWORD: zod_1.z.string().default('password'),
    DB_SSL: zod_1.z.coerce.boolean().default(false),
    // Server
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Security
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // Password
    BCRYPT_ROUNDS: zod_1.z.coerce.number().default(12),
    // Session
    SESSION_SECRET: zod_1.z.string().min(32),
    SESSION_TIMEOUT: zod_1.z.coerce.number().default(86400000), // 24 hours in ms
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(100),
    // Redis
    REDIS_URL: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.coerce.number().default(0),
    REDIS_KEY_PREFIX: zod_1.z.string().default('auth:'),
    // OAuth
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    OAUTH_CALLBACK_URL: zod_1.z.string().default('http://localhost:3000/auth/callback'),
});
// Validate environment variables
var env = envSchema.parse(process.env);
exports.appConfig = {
    database: {
        url: env.DATABASE_URL,
        host: env.DB_HOST,
        port: env.DB_PORT,
        name: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        ssl: env.DB_SSL,
    },
    server: {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
    },
    security: {
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
        jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
        bcryptRounds: env.BCRYPT_ROUNDS,
        sessionSecret: env.SESSION_SECRET,
        sessionTimeout: env.SESSION_TIMEOUT,
    },
    logging: {
        level: env.LOG_LEVEL,
    },
    rateLimiting: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    redis: {
        url: env.REDIS_URL,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        keyPrefix: env.REDIS_KEY_PREFIX,
    },
    oauth: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
        callbackUrl: env.OAUTH_CALLBACK_URL,
    },
};
exports.default = exports.appConfig;
