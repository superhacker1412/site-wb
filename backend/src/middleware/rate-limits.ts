import rateLimit from "express-rate-limit";

import { env } from "../config/env";

function createJsonRateLimiter(params: {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: params.windowMs,
    limit: params.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: params.skipSuccessfulRequests ?? false,
    message: { message: params.message },
  });
}

export const registerRateLimiter = createJsonRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  message: "Too many registration attempts. Please try again later.",
});

export const loginRateLimiter = createJsonRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again later.",
});

export const refreshRateLimiter = createJsonRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX * 3,
  message: "Too many token refresh attempts. Please try again later.",
});

export const feedbackRateLimiter = createJsonRateLimiter({
  windowMs: env.FEEDBACK_RATE_LIMIT_WINDOW_MS,
  limit: env.FEEDBACK_RATE_LIMIT_MAX,
  message: "Too many feedback requests. Please try again later.",
});
