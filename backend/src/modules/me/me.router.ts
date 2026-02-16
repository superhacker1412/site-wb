import { Router } from "express";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import { authenticate } from "../../middleware/auth";
import { requireCsrf } from "../../middleware/csrf";

export const meRouter = Router();

meRouter.use(authenticate);

meRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const attempts = await prisma.quizAttempt.findMany({
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
  }),
);

meRouter.get(
  "/favorites/materials",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const favorites = await prisma.favoriteMaterial.findMany({
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
  }),
);

meRouter.post(
  "/favorites/materials/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const materialId = req.params.id;

    const material = await prisma.material.findUnique({ where: { id: materialId }, select: { id: true } });
    if (!material) throw new AppError("Material not found", 404);

    await prisma.favoriteMaterial.upsert({
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
  }),
);

meRouter.delete(
  "/favorites/materials/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const materialId = req.params.id;
    await prisma.favoriteMaterial.deleteMany({
      where: {
        userId: req.user.id,
        materialId,
      },
    });
    res.status(204).send();
  }),
);

meRouter.get(
  "/favorites/directions",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const favorites = await prisma.favoriteDirection.findMany({
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
  }),
);

meRouter.post(
  "/favorites/directions/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const directionId = req.params.id;

    const direction = await prisma.quizDirection.findUnique({
      where: { id: directionId },
      select: { id: true },
    });
    if (!direction) throw new AppError("Direction not found", 404);

    await prisma.favoriteDirection.upsert({
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
  }),
);

meRouter.delete(
  "/favorites/directions/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const directionId = req.params.id;

    await prisma.favoriteDirection.deleteMany({
      where: {
        userId: req.user.id,
        directionId,
      },
    });
    res.status(204).send();
  }),
);
