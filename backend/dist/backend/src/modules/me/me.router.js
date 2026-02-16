"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const auth_1 = require("../../middleware/auth");
const csrf_1 = require("../../middleware/csrf");
exports.meRouter = (0, express_1.Router)();
exports.meRouter.use(auth_1.authenticate);
exports.meRouter.get("/history", (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const attempts = await prisma_1.prisma.quizAttempt.findMany({
        where: { userId: req.user.id },
        orderBy: { submittedAt: "desc" },
        include: {
            direction: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    res.json({
        history: attempts.map((attempt) => ({
            id: attempt.id,
            direction: attempt.directionId,
            directionName: attempt.direction.name,
            score: attempt.score,
            total: attempt.total,
            percentage: attempt.percentage,
            submittedAt: attempt.submittedAt,
        })),
    });
}));
exports.meRouter.get("/favorites/materials", (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const favorites = await prisma_1.prisma.favoriteMaterial.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            material: {
                include: { category: true },
            },
        },
    });
    res.json({
        ids: favorites.map((favorite) => favorite.materialId),
        items: favorites.map((favorite) => favorite.material),
    });
}));
exports.meRouter.post("/favorites/materials/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const materialId = req.params.id;
    const material = await prisma_1.prisma.material.findUnique({ where: { id: materialId }, select: { id: true } });
    if (!material)
        throw new errors_1.AppError("Material not found", 404);
    await prisma_1.prisma.favoriteMaterial.upsert({
        where: {
            userId_materialId: {
                userId: req.user.id,
                materialId,
            },
        },
        update: {},
        create: {
            userId: req.user.id,
            materialId,
        },
    });
    res.status(201).json({ success: true });
}));
exports.meRouter.delete("/favorites/materials/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const materialId = req.params.id;
    await prisma_1.prisma.favoriteMaterial.deleteMany({
        where: {
            userId: req.user.id,
            materialId,
        },
    });
    res.status(204).send();
}));
exports.meRouter.get("/favorites/directions", (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const favorites = await prisma_1.prisma.favoriteDirection.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            direction: true,
        },
    });
    res.json({
        ids: favorites.map((favorite) => favorite.directionId),
        items: favorites.map((favorite) => favorite.direction),
    });
}));
exports.meRouter.post("/favorites/directions/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const directionId = req.params.id;
    const direction = await prisma_1.prisma.quizDirection.findUnique({
        where: { id: directionId },
        select: { id: true },
    });
    if (!direction)
        throw new errors_1.AppError("Direction not found", 404);
    await prisma_1.prisma.favoriteDirection.upsert({
        where: {
            userId_directionId: {
                userId: req.user.id,
                directionId,
            },
        },
        update: {},
        create: {
            userId: req.user.id,
            directionId,
        },
    });
    res.status(201).json({ success: true });
}));
exports.meRouter.delete("/favorites/directions/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const directionId = req.params.id;
    await prisma_1.prisma.favoriteDirection.deleteMany({
        where: {
            userId: req.user.id,
            directionId,
        },
    });
    res.status(204).send();
}));
//# sourceMappingURL=me.router.js.map