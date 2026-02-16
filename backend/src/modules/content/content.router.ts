import { Router } from "express";
import { z } from "zod";
import { EntityStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import { validateQuery } from "../../middleware/validate";

const materialsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(EntityStatus).optional(),
});

const categoriesQuerySchema = z.object({
  status: z.nativeEnum(EntityStatus).optional(),
});

const regionsQuerySchema = z.object({
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const citiesQuerySchema = z.object({
  regionId: z.string().min(1),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const districtsQuerySchema = z.object({
  regionId: z.string().optional(),
  cityId: z.string().optional(),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const schoolsQuerySchema = z.object({
  districtId: z.string().min(1),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

export const contentRouter = Router();

contentRouter.get(
  "/categories",
  validateQuery(categoriesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof categoriesQuerySchema>;

    const categories = await prisma.category.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });

    res.json({ categories });
  }),
);

contentRouter.get(
  "/materials",
  validateQuery(materialsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof materialsQuerySchema>;

    const materials = await prisma.material.findMany({
      where: {
        ...(query.category ? { categoryId: query.category } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    });

    res.json({ materials });
  }),
);

contentRouter.get(
  "/materials/:id",
  asyncHandler(async (req, res) => {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!material) throw new AppError("Material not found", 404);
    res.json({ material });
  }),
);

contentRouter.get(
  "/locations/regions",
  validateQuery(regionsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof regionsQuerySchema>;

    const regions = await prisma.region.findMany({
      where: { status: query.status },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    res.json({ regions });
  }),
);

contentRouter.get(
  "/locations/cities",
  validateQuery(citiesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof citiesQuerySchema>;

    const cities = await prisma.city.findMany({
      where: {
        regionId: query.regionId,
        status: query.status,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        regionId: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    res.json({ cities });
  }),
);

contentRouter.get(
  "/locations/districts",
  validateQuery(districtsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof districtsQuerySchema>;

    let regionId = query.regionId;
    if (!regionId && query.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: query.cityId },
        select: { regionId: true },
      });
      if (city) {
        regionId = city.regionId;
      }
    }

    if (!regionId) {
      throw new AppError("regionId or cityId is required", 400);
    }

    const districts = await prisma.district.findMany({
      where: {
        regionId,
        status: query.status,
        ...(query.cityId
          ? {
              OR: [{ cityId: query.cityId }, { cityId: null }],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        regionId: true,
        cityId: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    res.json({ districts });
  }),
);

contentRouter.get(
  "/locations/schools",
  validateQuery(schoolsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof schoolsQuerySchema>;

    const schools = await prisma.school.findMany({
      where: {
        districtId: query.districtId,
        status: query.status,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        districtId: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    res.json({ schools });
  }),
);
