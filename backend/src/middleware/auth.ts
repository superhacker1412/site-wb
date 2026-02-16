import { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { ACCESS_COOKIE, verifyAccessToken } from "../lib/security";

function extractAccessToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;

  const auth = req.get("authorization");
  if (!auth) return null;

  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractAccessToken(req);
    if (!token) throw new AppError("Unauthorized", 401);

    const payload = verifyAccessToken(token);
    if (payload.type !== "access") throw new AppError("Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        middleName: true,
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
      },
    });

    if (!user) throw new AppError("Unauthorized", 401);
    if (user.status === "ARCHIVED") throw new AppError("Account is archived", 403);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
