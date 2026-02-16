"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDirectionsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const createDirectionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    slug: zod_1.z.string().min(2).max(120),
    name: zod_1.z.string().min(2).max(120),
    icon: zod_1.z.string().min(1).max(20),
    description: zod_1.z.string().min(3).max(1000),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateDirectionSchema = createDirectionSchema.partial();
exports.adminDirectionsRouter = (0, express_1.Router)();
exports.adminDirectionsRouter.get("/", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const directions = await prisma_1.prisma.quizDirection.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { questions: true },
            },
        },
    });
    res.json({ directions });
}));
exports.adminDirectionsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createDirectionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const direction = await prisma_1.prisma.quizDirection.create({
        data: {
            id: body.id,
            slug: body.slug,
            name: body.name,
            icon: body.icon,
            description: body.description,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_direction",
        entityId: direction.id,
        action: "create",
        beforeJson: null,
        afterJson: direction,
        req,
    });
    res.status(201).json({ direction });
}));
exports.adminDirectionsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateDirectionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.quizDirection.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Direction not found", 404);
    const direction = await prisma_1.prisma.quizDirection.update({
        where: { id },
        data: {
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.icon ? { icon: body.icon } : {}),
            ...(body.description ? { description: body.description } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_direction",
        entityId: direction.id,
        action: "update",
        beforeJson: before,
        afterJson: direction,
        req,
    });
    res.json({ direction });
}));
exports.adminDirectionsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizDirection.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Direction not found", 404);
    const direction = await prisma_1.prisma.quizDirection.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_direction",
        entityId: id,
        action: "archive",
        beforeJson: before,
        afterJson: direction,
        req,
    });
    res.json({ direction });
}));
exports.adminDirectionsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizDirection.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Direction not found", 404);
    const direction = await prisma_1.prisma.quizDirection.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_direction",
        entityId: id,
        action: "unarchive",
        beforeJson: before,
        afterJson: direction,
        req,
    });
    res.json({ direction });
}));
exports.adminDirectionsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizDirection.findUnique({
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
    if (!before)
        throw new errors_1.AppError("Direction not found", 404);
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            if (before._count.attempts > 0) {
                await tx.quizAttempt.deleteMany({
                    where: { directionId: id },
                });
            }
            await tx.quizDirection.delete({
                where: { id },
            });
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("Direction cannot be deleted because related records exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_direction",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
//# sourceMappingURL=directions.router.js.map