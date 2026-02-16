"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLocationsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const listRegionsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
});
const createRegionSchema = zod_1.z.object({
    slug: zod_1.z.string().trim().min(2).max(160),
    name: zod_1.z.string().trim().min(2).max(160),
    soatoId: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateRegionSchema = createRegionSchema.partial();
const listCitiesQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    regionId: zod_1.z.string().trim().optional(),
});
const createCitySchema = zod_1.z.object({
    regionId: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(2).max(160),
    name: zod_1.z.string().trim().min(2).max(160),
    soatoId: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateCitySchema = createCitySchema.partial();
const listDistrictsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    regionId: zod_1.z.string().trim().optional(),
    cityId: zod_1.z.string().trim().optional(),
});
const createDistrictSchema = zod_1.z.object({
    regionId: zod_1.z.string().trim().min(1),
    cityId: zod_1.z.string().trim().nullable().optional(),
    slug: zod_1.z.string().trim().min(2).max(160),
    name: zod_1.z.string().trim().min(2).max(160),
    soatoId: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateDistrictSchema = createDistrictSchema.partial();
const listSchoolsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    districtId: zod_1.z.string().trim().optional(),
    regionId: zod_1.z.string().trim().optional(),
    cityId: zod_1.z.string().trim().optional(),
});
const createSchoolSchema = zod_1.z.object({
    districtId: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(2).max(200),
    name: zod_1.z.string().trim().min(2).max(200),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateSchoolSchema = createSchoolSchema.partial();
const regionsRouter = (0, express_1.Router)();
const citiesRouter = (0, express_1.Router)();
const districtsRouter = (0, express_1.Router)();
const schoolsRouter = (0, express_1.Router)();
regionsRouter.get("/", (0, validate_1.validateQuery)(listRegionsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const regions = await prisma_1.prisma.region.findMany({
        where: {
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { slug: { contains: query.search, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: {
                    cities: true,
                    districts: true,
                    users: true,
                },
            },
        },
    });
    res.json({ regions });
}));
regionsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createRegionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const region = await prisma_1.prisma.region.create({
        data: {
            slug: body.slug,
            name: body.name,
            soatoId: body.soatoId,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "region",
        entityId: region.id,
        action: "create",
        beforeJson: null,
        afterJson: region,
        req,
    });
    res.status(201).json({ region });
}));
regionsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateRegionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const before = await prisma_1.prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("Region not found", 404);
    const region = await prisma_1.prisma.region.update({
        where: { id: req.params.id },
        data: {
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "region",
        entityId: region.id,
        action: "update",
        beforeJson: before,
        afterJson: region,
        req,
    });
    res.json({ region });
}));
regionsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("Region not found", 404);
    const region = await prisma_1.prisma.region.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "region",
        entityId: region.id,
        action: "archive",
        beforeJson: before,
        afterJson: region,
        req,
    });
    res.json({ region });
}));
regionsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("Region not found", 404);
    const region = await prisma_1.prisma.region.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "region",
        entityId: region.id,
        action: "unarchive",
        beforeJson: before,
        afterJson: region,
        req,
    });
    res.json({ region });
}));
regionsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.region.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    cities: true,
                    districts: true,
                    users: true,
                },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("Region not found", 404);
    try {
        await prisma_1.prisma.region.delete({
            where: { id },
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("Region cannot be deleted because linked cities, districts or users exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "region",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
citiesRouter.get("/", (0, validate_1.validateQuery)(listCitiesQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const cities = await prisma_1.prisma.city.findMany({
        where: {
            ...(query.status ? { status: query.status } : {}),
            ...(query.regionId ? { regionId: query.regionId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { slug: { contains: query.search, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        orderBy: { name: "asc" },
        include: {
            region: {
                select: { id: true, name: true },
            },
            _count: {
                select: {
                    districts: true,
                    users: true,
                },
            },
        },
    });
    res.json({ cities });
}));
citiesRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createCitySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const region = await prisma_1.prisma.region.findUnique({ where: { id: body.regionId }, select: { id: true } });
    if (!region)
        throw new errors_1.AppError("Region not found", 404);
    const city = await prisma_1.prisma.city.create({
        data: {
            regionId: body.regionId,
            slug: body.slug,
            name: body.name,
            soatoId: body.soatoId,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "city",
        entityId: city.id,
        action: "create",
        beforeJson: null,
        afterJson: city,
        req,
    });
    res.status(201).json({ city });
}));
citiesRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateCitySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const before = await prisma_1.prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("City not found", 404);
    if (body.regionId) {
        const region = await prisma_1.prisma.region.findUnique({ where: { id: body.regionId }, select: { id: true } });
        if (!region)
            throw new errors_1.AppError("Region not found", 404);
    }
    const city = await prisma_1.prisma.city.update({
        where: { id: req.params.id },
        data: {
            ...(body.regionId ? { regionId: body.regionId } : {}),
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "city",
        entityId: city.id,
        action: "update",
        beforeJson: before,
        afterJson: city,
        req,
    });
    res.json({ city });
}));
citiesRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("City not found", 404);
    const city = await prisma_1.prisma.city.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "city",
        entityId: city.id,
        action: "archive",
        beforeJson: before,
        afterJson: city,
        req,
    });
    res.json({ city });
}));
citiesRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("City not found", 404);
    const city = await prisma_1.prisma.city.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "city",
        entityId: city.id,
        action: "unarchive",
        beforeJson: before,
        afterJson: city,
        req,
    });
    res.json({ city });
}));
citiesRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.city.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    districts: true,
                    users: true,
                },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("City not found", 404);
    try {
        await prisma_1.prisma.city.delete({
            where: { id },
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("City cannot be deleted because linked districts or users exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "city",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
districtsRouter.get("/", (0, validate_1.validateQuery)(listDistrictsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const districts = await prisma_1.prisma.district.findMany({
        where: {
            ...(query.status ? { status: query.status } : {}),
            ...(query.regionId ? { regionId: query.regionId } : {}),
            ...(query.cityId ? { cityId: query.cityId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { slug: { contains: query.search, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        orderBy: { name: "asc" },
        include: {
            region: {
                select: { id: true, name: true },
            },
            city: {
                select: { id: true, name: true },
            },
            _count: {
                select: {
                    schools: true,
                    users: true,
                },
            },
        },
    });
    res.json({ districts });
}));
districtsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createDistrictSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const region = await prisma_1.prisma.region.findUnique({
        where: { id: body.regionId },
        select: { id: true },
    });
    if (!region)
        throw new errors_1.AppError("Region not found", 404);
    if (body.cityId) {
        const city = await prisma_1.prisma.city.findUnique({
            where: { id: body.cityId },
            select: { id: true, regionId: true },
        });
        if (!city)
            throw new errors_1.AppError("City not found", 404);
        if (city.regionId !== body.regionId)
            throw new errors_1.AppError("City is not in selected region", 400);
    }
    const district = await prisma_1.prisma.district.create({
        data: {
            regionId: body.regionId,
            cityId: body.cityId || null,
            slug: body.slug,
            name: body.name,
            soatoId: body.soatoId,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "district",
        entityId: district.id,
        action: "create",
        beforeJson: null,
        afterJson: district,
        req,
    });
    res.status(201).json({ district });
}));
districtsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateDistrictSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const before = await prisma_1.prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("District not found", 404);
    const nextRegionId = body.regionId || before.regionId;
    const nextCityId = body.cityId !== undefined ? body.cityId : before.cityId;
    if (body.regionId) {
        const region = await prisma_1.prisma.region.findUnique({
            where: { id: body.regionId },
            select: { id: true },
        });
        if (!region)
            throw new errors_1.AppError("Region not found", 404);
    }
    if (nextCityId) {
        const city = await prisma_1.prisma.city.findUnique({
            where: { id: nextCityId },
            select: { id: true, regionId: true },
        });
        if (!city)
            throw new errors_1.AppError("City not found", 404);
        if (city.regionId !== nextRegionId)
            throw new errors_1.AppError("City is not in selected region", 400);
    }
    const district = await prisma_1.prisma.district.update({
        where: { id: req.params.id },
        data: {
            ...(body.regionId ? { regionId: body.regionId } : {}),
            ...(body.cityId !== undefined ? { cityId: body.cityId || null } : {}),
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "district",
        entityId: district.id,
        action: "update",
        beforeJson: before,
        afterJson: district,
        req,
    });
    res.json({ district });
}));
districtsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("District not found", 404);
    const district = await prisma_1.prisma.district.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "district",
        entityId: district.id,
        action: "archive",
        beforeJson: before,
        afterJson: district,
        req,
    });
    res.json({ district });
}));
districtsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("District not found", 404);
    const district = await prisma_1.prisma.district.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "district",
        entityId: district.id,
        action: "unarchive",
        beforeJson: before,
        afterJson: district,
        req,
    });
    res.json({ district });
}));
districtsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.district.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    schools: true,
                    users: true,
                },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("District not found", 404);
    try {
        await prisma_1.prisma.district.delete({
            where: { id },
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("District cannot be deleted because linked schools or users exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "district",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
schoolsRouter.get("/", (0, validate_1.validateQuery)(listSchoolsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.districtId ? { districtId: query.districtId } : {}),
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { slug: { contains: query.search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    if (query.regionId || query.cityId) {
        where.district = {
            ...(query.regionId ? { regionId: query.regionId } : {}),
            ...(query.cityId ? { cityId: query.cityId } : {}),
        };
    }
    const schools = await prisma_1.prisma.school.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
            district: {
                select: {
                    id: true,
                    name: true,
                    region: {
                        select: { id: true, name: true },
                    },
                    city: {
                        select: { id: true, name: true },
                    },
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
    });
    res.json({ schools });
}));
schoolsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createSchoolSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const district = await prisma_1.prisma.district.findUnique({
        where: { id: body.districtId },
        select: { id: true },
    });
    if (!district)
        throw new errors_1.AppError("District not found", 404);
    const school = await prisma_1.prisma.school.create({
        data: {
            districtId: body.districtId,
            slug: body.slug,
            name: body.name,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "school",
        entityId: school.id,
        action: "create",
        beforeJson: null,
        afterJson: school,
        req,
    });
    res.status(201).json({ school });
}));
schoolsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateSchoolSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const before = await prisma_1.prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("School not found", 404);
    if (body.districtId) {
        const district = await prisma_1.prisma.district.findUnique({
            where: { id: body.districtId },
            select: { id: true },
        });
        if (!district)
            throw new errors_1.AppError("District not found", 404);
    }
    const school = await prisma_1.prisma.school.update({
        where: { id: req.params.id },
        data: {
            ...(body.districtId ? { districtId: body.districtId } : {}),
            ...(body.slug ? { slug: body.slug } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "school",
        entityId: school.id,
        action: "update",
        beforeJson: before,
        afterJson: school,
        req,
    });
    res.json({ school });
}));
schoolsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("School not found", 404);
    const school = await prisma_1.prisma.school.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "school",
        entityId: school.id,
        action: "archive",
        beforeJson: before,
        afterJson: school,
        req,
    });
    res.json({ school });
}));
schoolsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const before = await prisma_1.prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before)
        throw new errors_1.AppError("School not found", 404);
    const school = await prisma_1.prisma.school.update({
        where: { id: req.params.id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "school",
        entityId: school.id,
        action: "unarchive",
        beforeJson: before,
        afterJson: school,
        req,
    });
    res.json({ school });
}));
schoolsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.school.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    users: true,
                },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("School not found", 404);
    try {
        await prisma_1.prisma.school.delete({
            where: { id },
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("School cannot be deleted because linked users exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "school",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id });
}));
exports.adminLocationsRouter = (0, express_1.Router)();
exports.adminLocationsRouter.use("/regions", regionsRouter);
exports.adminLocationsRouter.use("/cities", citiesRouter);
exports.adminLocationsRouter.use("/districts", districtsRouter);
exports.adminLocationsRouter.use("/schools", schoolsRouter);
//# sourceMappingURL=locations.router.js.map