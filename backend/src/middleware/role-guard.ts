import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "../lib/errors";

export function requireRole(role: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(role) ? role : [role];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Unauthorized", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Forbidden", 403));
      return;
    }

    next();
  };
}
