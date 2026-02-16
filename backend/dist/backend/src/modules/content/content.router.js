"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const validate_1 = require("../../middleware/validate");
const materialsQuerySchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
});
const categoriesQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
});
const regionsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const citiesQuerySchema = zod_1.z.object({
    regionId: zod_1.z.string().min(1),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const districtsQuerySchema = zod_1.z.object({
    regionId: zod_1.z.string().optional(),
    cityId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const schoolsQuerySchema = zod_1.z.object({
    districtId: zod_1.z.string().min(1),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
exports.contentRouter = (0, express_1.Router)();
exports.contentRouter.get("/categories", (0, validate_1.validateQuery)(categoriesQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const categories = await prisma_1.prisma.category.findMany({
        where: query.status ? { status: query.status } : undefined,
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { materials: true },
            },
        },
    });
    res.json({ categories });
}));
exports.contentRouter.get("/materials", (0, validate_1.validateQuery)(materialsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const materials = await prisma_1.prisma.material.findMany({
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
}));
exports.contentRouter.get("/materials/:id", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const material = await prisma_1.prisma.material.findUnique({
        where: { id: req.params.id },
        include: { category: true },
    });
    if (!material)
        throw new errors_1.AppError("Material not found", 404);
    res.json({ material });
}));
exports.contentRouter.get("/locations/regions", (0, validate_1.validateQuery)(regionsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const regions = await prisma_1.prisma.region.findMany({
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
}));
exports.contentRouter.get("/locations/cities", (0, validate_1.validateQuery)(citiesQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const cities = await prisma_1.prisma.city.findMany({
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
}));
exports.contentRouter.get("/locations/districts", (0, validate_1.validateQuery)(districtsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    let regionId = query.regionId;
    if (!regionId && query.cityId) {
        const city = await prisma_1.prisma.city.findUnique({
            where: { id: query.cityId },
            select: { regionId: true },
        });
        if (city) {
            regionId = city.regionId;
        }
    }
    if (!regionId) {
        throw new errors_1.AppError("regionId or cityId is required", 400);
    }
    const districts = await prisma_1.prisma.district.findMany({
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
}));
exports.contentRouter.get("/locations/schools", (0, validate_1.validateQuery)(schoolsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const schools = await prisma_1.prisma.school.findMany({
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
}));
//# sourceMappingURL=content.router.js.map