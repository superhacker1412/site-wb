import { Router } from "express";
import { EntityStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody } from "../../middleware/validate";
import { adminAudit, isRelationConstraintError, statusUpdateData } from "./helpers";

const createCategorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  icon: z.string().min(1).max(20),
  color: z.string().min(3).max(80),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateCategorySchema = createCategorySchema.partial();
const deleteCategorySchema = z
  .object({
    mode: z.enum(["DELETE_WITH_CONTENT", "MOVE_CONTENT"]).default("DELETE_WITH_CONTENT"),
    targetCategoryId: z.string().trim().min(1).optional(),
  })
  .default({ mode: "DELETE_WITH_CONTENT" });

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            materials: true,
          },
        },
      },
    });
    res.json({ categories });
  }),
);

adminCategoriesRouter.post(
  "/",
  requireCsrf,
  validateBody(createCategorySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createCategorySchema>;

    const category = await prisma.category.create({
      data: {
        id: body.id,
        slug: body.slug,
        name: body.name,
        icon: body.icon,
        color: body.color,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "category",
      entityId: category.id,
      action: "create",
      beforeJson: null,
      afterJson: category,
      req,
    });

    res.status(201).json({ category });
  }),
);

adminCategoriesRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateCategorySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateCategorySchema>;

    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) throw new AppError("Category not found", 404);

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.icon ? { icon: body.icon } : {}),
        ...(body.color ? { color: body.color } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "category",
      entityId: category.id,
      action: "update",
      beforeJson: before,
      afterJson: category,
      req,
    });

    res.json({ category });
  }),
);

adminCategoriesRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) throw new AppError("Category not found", 404);
    const category = await prisma.category.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "category",
      entityId: id,
      action: "archive",
      beforeJson: before,
      afterJson: category,
      req,
    });
    res.json({ category });
  }),
);

adminCategoriesRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) throw new AppError("Category not found", 404);
    const category = await prisma.category.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "category",
      entityId: id,
      action: "unarchive",
      beforeJson: before,
      afterJson: category,
      req,
    });
    res.json({ category });
  }),
);

adminCategoriesRouter.delete(
  "/:id",
  requireCsrf,
  validateBody(deleteCategorySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const actor = req.user;
    const id = req.params.id;
    const body = req.body as z.infer<typeof deleteCategorySchema>;

    const before = await prisma.category.findUnique({
      where: { id },
      include: {
        materials: {
          select: { id: true },
        },
      },
    });
    if (!before) throw new AppError("Category not found", 404);

    let movedMaterialsCount = 0;
    let deletedMaterialsCount = 0;
    let targetCategoryId: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        if (body.mode === "MOVE_CONTENT") {
          if (!body.targetCategoryId) {
            throw new AppError("targetCategoryId is required for MOVE_CONTENT mode", 422);
          }
          if (body.targetCategoryId === id) {
            throw new AppError("targetCategoryId must be different from deleting category", 422);
          }

          const targetCategory = await tx.category.findUnique({
            where: { id: body.targetCategoryId },
            select: { id: true },
          });
          if (!targetCategory) {
            throw new AppError("Target category not found", 404);
          }

          if (before.materials.length > 0) {
            const moved = await tx.material.updateMany({
              where: { categoryId: id },
              data: {
                categoryId: targetCategory.id,
                updatedById: actor.id,
              },
            });
            movedMaterialsCount = moved.count;
          }
          targetCategoryId = targetCategory.id;
        } else if (before.materials.length > 0) {
          const deleted = await tx.material.deleteMany({
            where: { categoryId: id },
          });
          deletedMaterialsCount = deleted.count;
        }
        await tx.category.delete({ where: { id } });
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "Category cannot be deleted because related records exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: actor.id,
      entityType: "category",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: {
        mode: body.mode,
        targetCategoryId,
        movedMaterialsCount,
        deletedMaterialsCount,
      },
      req,
    });

    res.json({
      deleted: true,
      id,
      mode: body.mode,
      targetCategoryId,
      movedMaterialsCount,
      deletedMaterialsCount,
    });
  }),
);
