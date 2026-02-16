"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCategoriesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const createCategorySchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    slug: zod_1.z.string().min(2).max(120),
    name: zod_1.z.string().min(2).max(120),
    icon: zod_1.z.string().min(1).max(20),
    color: zod_1.z.string().min(3).max(80),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateCategorySchema = createCategorySchema.partial();
const deleteCategorySchema = zod_1.z
    .object({
    mode: zod_1.z.enum(["DELETE_WITH_CONTENT", "MOVE_CONTENT"]).default("DELETE_WITH_CONTENT"),
    targetCategoryId: zod_1.z.string().trim().min(1).optional(),
})
    .default({ mode: "DELETE_WITH_CONTENT" });
exports.adminCategoriesRouter = (0, express_1.Router)();
exports.adminCategoriesRouter.get("/", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const categories = await prisma_1.prisma.category.findMany({
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
}));
exports.adminCategoriesRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createCategorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const category = await prisma_1.prisma.category.create({
        data: {
            id: body.id,
            slug: body.slug,
            name: body.name,
            icon: body.icon,
            color: body.color,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "category",
        entityId: category.id,
        action: "create",
        beforeJson: null,
        afterJson: category,
        req,
    });
    res.status(201).json({ category });
}));
exports.adminCategoriesRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateCategorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Category not found", 404);
    const category = await prisma_1.prisma.category.update({
        where: { id },
        data: {
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.icon ? { icon: body.icon } : {}),
            ...(body.color ? { color: body.color } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "category",
        entityId: category.id,
        action: "update",
        beforeJson: before,
        afterJson: category,
        req,
    });
    res.json({ category });
}));
exports.adminCategoriesRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Category not found", 404);
    const category = await prisma_1.prisma.category.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "category",
        entityId: id,
        action: "archive",
        beforeJson: before,
        afterJson: category,
        req,
    });
    res.json({ category });
}));
exports.adminCategoriesRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Category not found", 404);
    const category = await prisma_1.prisma.category.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "category",
        entityId: id,
        action: "unarchive",
        beforeJson: before,
        afterJson: category,
        req,
    });
    res.json({ category });
}));
exports.adminCategoriesRouter.delete("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(deleteCategorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const actor = req.user;
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.category.findUnique({
        where: { id },
        include: {
            materials: {
                select: { id: true },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("Category not found", 404);
    let movedMaterialsCount = 0;
    let deletedMaterialsCount = 0;
    let targetCategoryId = null;
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            if (body.mode === "MOVE_CONTENT") {
                if (!body.targetCategoryId) {
                    throw new errors_1.AppError("targetCategoryId is required for MOVE_CONTENT mode", 422);
                }
                if (body.targetCategoryId === id) {
                    throw new errors_1.AppError("targetCategoryId must be different from deleting category", 422);
                }
                const targetCategory = await tx.category.findUnique({
                    where: { id: body.targetCategoryId },
                    select: { id: true },
                });
                if (!targetCategory) {
                    throw new errors_1.AppError("Target category not found", 404);
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
            }
            else if (before.materials.length > 0) {
                const deleted = await tx.material.deleteMany({
                    where: { categoryId: id },
                });
                deletedMaterialsCount = deleted.count;
            }
            await tx.category.delete({ where: { id } });
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("Category cannot be deleted because related records exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
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
}));
//# sourceMappingURL=categories.router.js.map