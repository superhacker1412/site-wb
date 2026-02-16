import { Router } from "express";
import { EntityStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { hasMeaningfulHtmlContent, sanitizeRichHtml } from "../../lib/html-sanitizer";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody } from "../../middleware/validate";
import { adminAudit, isRelationConstraintError, statusUpdateData } from "./helpers";

const createMaterialSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(3).max(1000),
  imagePath: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
      message: "imagePath must be a relative path or absolute http(s) URL",
    })
    .nullable()
    .optional(),
  contentHtml: z.string().min(1),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateMaterialSchema = createMaterialSchema.partial();

export const adminMaterialsRouter = Router();

adminMaterialsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    });
    res.json({ materials });
  }),
);

adminMaterialsRouter.post(
  "/",
  requireCsrf,
  validateBody(createMaterialSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createMaterialSchema>;
    const contentHtml = sanitizeRichHtml(body.contentHtml);
    if (!hasMeaningfulHtmlContent(contentHtml)) {
      throw new AppError("Material content is empty after sanitization", 422);
    }

    const material = await prisma.material.create({
      data: {
        id: body.id,
        categoryId: body.categoryId,
        title: body.title,
        description: body.description,
        imagePath: body.imagePath || null,
        contentHtml,
        createdById: req.user.id,
        updatedById: req.user.id,
        ...statusUpdateData(body.status),
      },
      include: { category: true },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "material",
      entityId: material.id,
      action: "create",
      beforeJson: null,
      afterJson: material,
      req,
    });
    res.status(201).json({ material });
  }),
);

adminMaterialsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateMaterialSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateMaterialSchema>;

    const before = await prisma.material.findUnique({ where: { id } });
    if (!before) throw new AppError("Material not found", 404);
    const contentHtml = body.contentHtml ? sanitizeRichHtml(body.contentHtml) : null;
    if (contentHtml !== null && !hasMeaningfulHtmlContent(contentHtml)) {
      throw new AppError("Material content is empty after sanitization", 422);
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(body.categoryId ? { categoryId: body.categoryId } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
        ...(contentHtml !== null ? { contentHtml } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
        updatedById: req.user.id,
      },
      include: { category: true },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "material",
      entityId: material.id,
      action: "update",
      beforeJson: before,
      afterJson: material,
      req,
    });
    res.json({ material });
  }),
);

adminMaterialsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.material.findUnique({ where: { id } });
    if (!before) throw new AppError("Material not found", 404);
    const material = await prisma.material.update({
      where: { id },
      data: { ...statusUpdateData(EntityStatus.ARCHIVED), updatedById: req.user.id },
      include: { category: true },
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "material",
      entityId: id,
      action: "archive",
      beforeJson: before,
      afterJson: material,
      req,
    });
    res.json({ material });
  }),
);

adminMaterialsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.material.findUnique({ where: { id } });
    if (!before) throw new AppError("Material not found", 404);
    const material = await prisma.material.update({
      where: { id },
      data: { ...statusUpdateData(EntityStatus.ACTIVE), updatedById: req.user.id },
      include: { category: true },
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "material",
      entityId: id,
      action: "unarchive",
      beforeJson: before,
      afterJson: material,
      req,
    });
    res.json({ material });
  }),
);

adminMaterialsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.material.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!before) throw new AppError("Material not found", 404);

    try {
      await prisma.material.delete({ where: { id } });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "Material cannot be deleted because related records exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "material",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);
