"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMaterialsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const html_sanitizer_1 = require("../../lib/html-sanitizer");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const createMaterialSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().trim().min(1),
    title: zod_1.z.string().trim().min(3).max(255),
    description: zod_1.z.string().trim().min(3).max(1000),
    imagePath: zod_1.z
        .string()
        .trim()
        .max(1000)
        .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
        message: "imagePath must be a relative path or absolute http(s) URL",
    })
        .nullable()
        .optional(),
    contentHtml: zod_1.z.string().min(1),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateMaterialSchema = createMaterialSchema.partial();
exports.adminMaterialsRouter = (0, express_1.Router)();
exports.adminMaterialsRouter.get("/", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const materials = await prisma_1.prisma.material.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            category: true,
        },
    });
    res.json({ materials });
}));
exports.adminMaterialsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createMaterialSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const contentHtml = (0, html_sanitizer_1.sanitizeRichHtml)(body.contentHtml);
    if (!(0, html_sanitizer_1.hasMeaningfulHtmlContent)(contentHtml)) {
        throw new errors_1.AppError("Material content is empty after sanitization", 422);
    }
    const material = await prisma_1.prisma.material.create({
        data: {
            id: body.id,
            categoryId: body.categoryId,
            title: body.title,
            description: body.description,
            imagePath: body.imagePath || null,
            contentHtml,
            createdById: req.user.id,
            updatedById: req.user.id,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
        include: { category: true },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "material",
        entityId: material.id,
        action: "create",
        beforeJson: null,
        afterJson: material,
        req,
    });
    res.status(201).json({ material });
}));
exports.adminMaterialsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateMaterialSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.material.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Material not found", 404);
    const contentHtml = body.contentHtml ? (0, html_sanitizer_1.sanitizeRichHtml)(body.contentHtml) : null;
    if (contentHtml !== null && !(0, html_sanitizer_1.hasMeaningfulHtmlContent)(contentHtml)) {
        throw new errors_1.AppError("Material content is empty after sanitization", 422);
    }
    const material = await prisma_1.prisma.material.update({
        where: { id },
        data: {
            ...(body.categoryId ? { categoryId: body.categoryId } : {}),
            ...(body.title ? { title: body.title } : {}),
            ...(body.description ? { description: body.description } : {}),
            ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
            ...(contentHtml !== null ? { contentHtml } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
            updatedById: req.user.id,
        },
        include: { category: true },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "material",
        entityId: material.id,
        action: "update",
        beforeJson: before,
        afterJson: material,
        req,
    });
    res.json({ material });
}));
exports.adminMaterialsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.material.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Material not found", 404);
    const material = await prisma_1.prisma.material.update({
        where: { id },
        data: { ...(0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED), updatedById: req.user.id },
        include: { category: true },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "material",
        entityId: id,
        action: "archive",
        beforeJson: before,
        afterJson: material,
        req,
    });
    res.json({ material });
}));
exports.adminMaterialsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.material.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Material not found", 404);
    const material = await prisma_1.prisma.material.update({
        where: { id },
        data: { ...(0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE), updatedById: req.user.id },
        include: { category: true },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "material",
        entityId: id,
        action: "unarchive",
        beforeJson: before,
        afterJson: material,
        req,
    });
    res.json({ material });
}));
exports.adminMaterialsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.material.findUnique({
        where: { id },
        include: { category: true },
    });
    if (!before)
        throw new errors_1.AppError("Material not found", 404);
    try {
        await prisma_1.prisma.material.delete({ where: { id } });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("Material cannot be deleted because related records exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "material",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
//# sourceMappingURL=materials.router.js.map