"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackRateLimiter = exports.refreshRateLimiter = exports.loginRateLimiter = exports.registerRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
function createJsonRateLimiter(params) {
    return (0, express_rate_limit_1.default)({
        windowMs: params.windowMs,
        limit: params.limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests: params.skipSuccessfulRequests ?? false,
        message: { message: params.message },
    });
}
exports.registerRateLimiter = createJsonRateLimiter({
    windowMs: env_1.env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.AUTH_RATE_LIMIT_MAX,
    message: "Too many registration attempts. Please try again later.",
});
exports.loginRateLimiter = createJsonRateLimiter({
    windowMs: env_1.env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.AUTH_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    message: "Too many failed login attempts. Please try again later.",
});
exports.refreshRateLimiter = createJsonRateLimiter({
    windowMs: env_1.env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.AUTH_RATE_LIMIT_MAX * 3,
    message: "Too many token refresh attempts. Please try again later.",
});
exports.feedbackRateLimiter = createJsonRateLimiter({
    windowMs: env_1.env.FEEDBACK_RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.FEEDBACK_RATE_LIMIT_MAX,
    message: "Too many feedback requests. Please try again later.",
});
//# sourceMappingURL=rate-limits.js.map