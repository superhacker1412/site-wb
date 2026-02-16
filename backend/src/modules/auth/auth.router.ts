import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  generateCsrfToken,
  hashPassword,
  hashToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  tokenExpiresAt,
  verifyPassword,
  verifyRefreshToken,
} from "../../lib/security";
import { env } from "../../config/env";
import { authenticate } from "../../middleware/auth";
import { requireCsrf } from "../../middleware/csrf";
import { loginRateLimiter, refreshRateLimiter, registerRateLimiter } from "../../middleware/rate-limits";
import { validateBody } from "../../middleware/validate";

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Password must contain at least one letter and one number",
  });

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  middleName: z.string().trim().min(2).max(80),
  regionId: z.string().trim().min(1),
  cityId: z.string().trim().min(1).optional().nullable(),
  districtId: z.string().trim().min(1).optional().nullable(),
  customDistrictName: z.string().trim().min(2).max(180).optional().nullable(),
  schoolId: z.string().trim().min(1).optional().nullable(),
  customSchoolName: z.string().trim().min(2).max(180).optional().nullable(),
  gradeNumber: z.number().int().min(1).max(11),
  gradeLetter: z
    .string()
    .trim()
    .min(1)
    .max(5)
    .transform((value) => value.toUpperCase()),
  email: z.string().email().toLowerCase(),
  password: passwordSchema,
}).refine((value) => Boolean(value.districtId) || Boolean(value.customDistrictName), {
  message: "Select district or provide custom district name",
  path: ["districtId"],
}).refine((value) => Boolean(value.schoolId) || Boolean(value.customSchoolName), {
  message: "Select school or provide custom school name",
  path: ["schoolId"],
});

const loginSchema = z.object({
  login: z.string().trim().min(2).max(120).toLowerCase(),
  password: z.string().min(8).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: passwordSchema,
});

const safeUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  middleName: true,
  email: true,
  role: true,
  status: true,
  regionId: true,
  cityId: true,
  districtId: true,
  customDistrictName: true,
  schoolId: true,
  customSchoolName: true,
  gradeNumber: true,
  gradeLetter: true,
  region: {
    select: {
      id: true,
      name: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
    },
  },
  district: {
    select: {
      id: true,
      name: true,
    },
  },
  school: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

async function createSession(params: {
  userId: string;
  email: string;
  role: UserRole;
  res: Parameters<typeof setAuthCookies>[0];
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const accessToken = signAccessToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
  });
  const refreshToken = signRefreshToken(params.userId);
  const csrfToken = generateCsrfToken();

  await prisma.refreshToken.create({
    data: {
      userId: params.userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: tokenExpiresAt(env.REFRESH_TOKEN_DAYS),
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    },
  });

  setAuthCookies(params.res, accessToken, refreshToken, csrfToken);
}

export const authRouter = Router();

authRouter.post(
  "/register",
  registerRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      middleName,
      regionId,
      cityId,
      districtId,
      customDistrictName,
      schoolId,
      customSchoolName,
      gradeNumber,
      gradeLetter,
      email,
      password,
    } = req.body as z.infer<typeof registerSchema>;

    const normalizedCityId = cityId || null;
    const normalizedDistrictId = districtId || null;
    const normalizedCustomDistrictName = customDistrictName?.trim() || null;
    const normalizedSchoolId = schoolId || null;
    const normalizedCustomSchoolName = customSchoolName?.trim() || null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already exists", 409);

    const [region, city, district, school] = await Promise.all([
      prisma.region.findUnique({
        where: { id: regionId },
        select: { id: true, status: true },
      }),
      normalizedCityId
        ? prisma.city.findUnique({
            where: { id: normalizedCityId },
            select: { id: true, regionId: true, status: true },
          })
        : Promise.resolve(null),
      normalizedDistrictId
        ? prisma.district.findUnique({
            where: { id: normalizedDistrictId },
            select: { id: true, regionId: true, cityId: true, status: true },
          })
        : Promise.resolve(null),
      normalizedSchoolId
        ? prisma.school.findUnique({
            where: { id: normalizedSchoolId },
            select: { id: true, districtId: true, status: true },
          })
        : Promise.resolve(null),
    ]);

    if (!region || region.status !== "ACTIVE") throw new AppError("Region not found", 400);
    if (normalizedDistrictId) {
      if (!district || district.status !== "ACTIVE") throw new AppError("District not found", 400);
      if (district.regionId !== regionId) throw new AppError("District does not belong to selected region", 400);
    } else if (!normalizedCustomDistrictName) {
      throw new AppError("District is required", 400);
    }

    if (city) {
      if (city.status !== "ACTIVE") throw new AppError("City not found", 400);
      if (city.regionId !== regionId) throw new AppError("City does not belong to selected region", 400);
      if (district && district.cityId && district.cityId !== city.id) {
        throw new AppError("District does not belong to selected city", 400);
      }
    }

    if (school) {
      if (!normalizedDistrictId) {
        throw new AppError("School can be selected only with existing district", 400);
      }
      if (school.status !== "ACTIVE") throw new AppError("School not found", 400);
      if (school.districtId !== normalizedDistrictId) {
        throw new AppError("School does not belong to selected district", 400);
      }
    }

    if (!normalizedSchoolId && !normalizedCustomSchoolName) {
      throw new AppError("School is required", 400);
    }

    const composedName = `${lastName} ${firstName} ${middleName}`.replace(/\s+/g, " ").trim();

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: composedName,
        firstName,
        lastName,
        middleName,
        regionId,
        cityId: normalizedCityId,
        districtId: normalizedDistrictId,
        customDistrictName: normalizedDistrictId ? null : normalizedCustomDistrictName,
        schoolId: normalizedSchoolId,
        customSchoolName: normalizedSchoolId ? null : normalizedCustomSchoolName,
        gradeNumber,
        gradeLetter,
        email,
        passwordHash,
      },
      select: safeUserSelect,
    });

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      res,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ user });
  }),
);

authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { login, password } = req.body as z.infer<typeof loginSchema>;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { name: { equals: login, mode: "insensitive" } }],
      },
      select: {
        ...safeUserSelect,
        passwordHash: true,
      },
    });

    if (!user) throw new AppError("Invalid login or password", 401);
    if (user.status === "ARCHIVED") throw new AppError("Account is archived", 403);

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) throw new AppError("Invalid login or password", 401);

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      res,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  }),
);

authRouter.post(
  "/refresh",
  refreshRateLimiter,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) throw new AppError("Refresh token is missing", 401);

    verifyRefreshToken(refreshToken);

    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: safeUserSelect,
        },
      },
    });

    if (!storedToken) throw new AppError("Invalid refresh token", 401);
    if (storedToken.revokedAt) throw new AppError("Refresh token revoked", 401);
    if (storedToken.expiresAt < new Date()) throw new AppError("Refresh token expired", 401);
    if (storedToken.user.status === "ARCHIVED") throw new AppError("Account is archived", 403);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    await createSession({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      res,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      user: storedToken.user,
    });
  }),
);

authRouter.post(
  "/logout",
  requireCsrf,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearAuthCookies(res);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

authRouter.post(
  "/change-password",
  authenticate,
  requireCsrf,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    if (!req.user) throw new AppError("Unauthorized", 401);
    if (currentPassword === newPassword) {
      throw new AppError("New password must be different from current password", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new AppError("User not found", 404);

    const currentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentValid) throw new AppError("Current password is incorrect", 400);

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    clearAuthCookies(res);
    res.status(204).send();
  }),
);

authRouter.get(
  "/csrf",
  authenticate,
  asyncHandler(async (req, res) => {
    // Accessed by the client if it needs to restore CSRF state manually.
    const csrfToken = req.cookies?.csrf_token;
    res.json({ csrfToken: csrfToken || null });
  }),
);

authRouter.post(
  "/logout-all",
  authenticate,
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    clearAuthCookies(res);
    res.status(204).send();
  }),
);
