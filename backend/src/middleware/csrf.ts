import { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { CSRF_COOKIE } from "../lib/security";

const allowedOrigins = new Set(
  env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError("Invalid CSRF token", 403));
    return;
  }

  const origin = req.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    next(new AppError("Invalid request origin", 403));
    return;
  }

  next();
}
