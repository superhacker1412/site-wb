import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { UserRole } from "@prisma/client";

import { env } from "../config/env";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const CSRF_COOKIE = "csrf_token";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" satisfies AccessTokenPayload["type"] },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TOKEN_MINUTES}m` },
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      type: "refresh" satisfies RefreshTokenPayload["type"],
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TOKEN_DAYS}d` },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  csrfToken: string,
): void {
  const isSecure = env.NODE_ENV === "production";
  const sameSite: "strict" = "strict";

  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: env.ACCESS_TOKEN_MINUTES * 60 * 1000,
    path: "/",
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: isSecure,
    sameSite,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  const isSecure = env.NODE_ENV === "production";
  const sameSite: "strict" = "strict";

  res.clearCookie(ACCESS_COOKIE, { path: "/", secure: isSecure, sameSite });
  res.clearCookie(REFRESH_COOKIE, { path: "/", secure: isSecure, sameSite });
  res.clearCookie(CSRF_COOKIE, { path: "/", secure: isSecure, sameSite });
}

export function tokenExpiresAt(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
