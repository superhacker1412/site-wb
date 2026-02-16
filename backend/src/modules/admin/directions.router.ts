import { Router } from "express";
import { EntityStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody } from "../../middleware/validate";
import { adminAudit, isRelationConstraintError, statusUpdateData } from "./helpers";

const createDirectionSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  icon: z.string().min(1).max(20),
  description: z.string().min(3).max(1000),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateDirectionSchema = createDirectionSchema.partial();

export const adminDirectionsRouter = Router();

adminDirectionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const directions = await prisma.quizDirection.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
    res.json({ directions });
  }),
);

adminDirectionsRouter.post(
  "/",
  requireCsrf,
  validateBody(createDirectionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createDirectionSchema>;

    const direction = await prisma.quizDirection.create({
      data: {
        id: body.id,
        slug: body.slug,
        name: body.name,
        icon: body.icon,
        description: body.description,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_direction",
      entityId: direction.id,
      action: "create",
      beforeJson: null,
      afterJson: direction,
      req,
    });

    res.status(201).json({ direction });
  }),
);

adminDirectionsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateDirectionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateDirectionSchema>;

    const before = await prisma.quizDirection.findUnique({ where: { id } });
    if (!before) throw new AppError("Direction not found", 404);

    const direction = await prisma.quizDirection.update({
      where: { id },
      data: {
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.icon ? { icon: body.icon } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_direction",
      entityId: direction.id,
      action: "update",
      beforeJson: before,
      afterJson: direction,
      req,
    });

    res.json({ direction });
  }),
);

adminDirectionsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.quizDirection.findUnique({ where: { id } });
    if (!before) throw new AppError("Direction not found", 404);

    const direction = await prisma.quizDirection.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_direction",
      entityId: id,
      action: "archive",
      beforeJson: before,
      afterJson: direction,
      req,
    });

    res.json({ direction });
  }),
);

adminDirectionsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.quizDirection.findUnique({ where: { id } });
    if (!before) throw new AppError("Direction not found", 404);

    const direction = await prisma.quizDirection.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_direction",
      entityId: id,
      action: "unarchive",
      beforeJson: before,
      afterJson: direction,
      req,
    });

    res.json({ direction });
  }),
);

adminDirectionsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.quizDirection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true,
            favorites: true,
            questions: true,
          },
        },
      },
    });
    if (!before) throw new AppError("Direction not found", 404);

    try {
      await prisma.$transaction(async (tx) => {
        if (before._count.attempts > 0) {
          await tx.quizAttempt.deleteMany({
            where: { directionId: id },
          });
        }
        await tx.quizDirection.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "Direction cannot be deleted because related records exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_direction",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);
