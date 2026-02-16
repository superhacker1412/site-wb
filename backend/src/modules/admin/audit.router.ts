import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { validateQuery } from "../../middleware/validate";

const auditQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  entityType: z.string().optional(),
});

export const adminAuditRouter = Router();

adminAuditRouter.get(
  "/",
  validateQuery(auditQuerySchema),
  asyncHandler(async (req, res) => {
    const { take, skip, entityType } = auditQuerySchema.parse(req.query);
    const where = entityType ? { entityType } : undefined;

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    res.json({ total, logs });
  }),
);
