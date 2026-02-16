import { Router } from "express";
import { EntityStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody, validateQuery } from "../../middleware/validate";
import { adminAudit, isRelationConstraintError, statusUpdateData } from "./helpers";

const listRegionsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(EntityStatus).optional(),
});

const createRegionSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(160),
  soatoId: z.number().int().positive().optional(),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateRegionSchema = createRegionSchema.partial();

const listCitiesQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(EntityStatus).optional(),
  regionId: z.string().trim().optional(),
});

const createCitySchema = z.object({
  regionId: z.string().trim().min(1),
  slug: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(160),
  soatoId: z.number().int().positive().optional(),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateCitySchema = createCitySchema.partial();

const listDistrictsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(EntityStatus).optional(),
  regionId: z.string().trim().optional(),
  cityId: z.string().trim().optional(),
});

const createDistrictSchema = z.object({
  regionId: z.string().trim().min(1),
  cityId: z.string().trim().nullable().optional(),
  slug: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(160),
  soatoId: z.number().int().positive().optional(),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateDistrictSchema = createDistrictSchema.partial();

const listSchoolsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(EntityStatus).optional(),
  districtId: z.string().trim().optional(),
  regionId: z.string().trim().optional(),
  cityId: z.string().trim().optional(),
});

const createSchoolSchema = z.object({
  districtId: z.string().trim().min(1),
  slug: z.string().trim().min(2).max(200),
  name: z.string().trim().min(2).max(200),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateSchoolSchema = createSchoolSchema.partial();

const regionsRouter = Router();
const citiesRouter = Router();
const districtsRouter = Router();
const schoolsRouter = Router();

regionsRouter.get(
  "/",
  validateQuery(listRegionsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listRegionsQuerySchema>;
    const regions = await prisma.region.findMany({
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
  }),
);

regionsRouter.post(
  "/",
  requireCsrf,
  validateBody(createRegionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createRegionSchema>;

    const region = await prisma.region.create({
      data: {
        slug: body.slug,
        name: body.name,
        soatoId: body.soatoId,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "region",
      entityId: region.id,
      action: "create",
      beforeJson: null,
      afterJson: region,
      req,
    });

    res.status(201).json({ region });
  }),
);

regionsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateRegionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof updateRegionSchema>;

    const before = await prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("Region not found", 404);

    const region = await prisma.region.update({
      where: { id: req.params.id },
      data: {
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "region",
      entityId: region.id,
      action: "update",
      beforeJson: before,
      afterJson: region,
      req,
    });

    res.json({ region });
  }),
);

regionsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("Region not found", 404);

    const region = await prisma.region.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "region",
      entityId: region.id,
      action: "archive",
      beforeJson: before,
      afterJson: region,
      req,
    });

    res.json({ region });
  }),
);

regionsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.region.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("Region not found", 404);

    const region = await prisma.region.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "region",
      entityId: region.id,
      action: "unarchive",
      beforeJson: before,
      afterJson: region,
      req,
    });

    res.json({ region });
  }),
);

regionsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.region.findUnique({
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
    if (!before) throw new AppError("Region not found", 404);

    try {
      await prisma.region.delete({
        where: { id },
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "Region cannot be deleted because linked cities, districts or users exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "region",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);

citiesRouter.get(
  "/",
  validateQuery(listCitiesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listCitiesQuerySchema>;

    const cities = await prisma.city.findMany({
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
  }),
);

citiesRouter.post(
  "/",
  requireCsrf,
  validateBody(createCitySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createCitySchema>;

    const region = await prisma.region.findUnique({ where: { id: body.regionId }, select: { id: true } });
    if (!region) throw new AppError("Region not found", 404);

    const city = await prisma.city.create({
      data: {
        regionId: body.regionId,
        slug: body.slug,
        name: body.name,
        soatoId: body.soatoId,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "city",
      entityId: city.id,
      action: "create",
      beforeJson: null,
      afterJson: city,
      req,
    });

    res.status(201).json({ city });
  }),
);

citiesRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateCitySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof updateCitySchema>;

    const before = await prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("City not found", 404);

    if (body.regionId) {
      const region = await prisma.region.findUnique({ where: { id: body.regionId }, select: { id: true } });
      if (!region) throw new AppError("Region not found", 404);
    }

    const city = await prisma.city.update({
      where: { id: req.params.id },
      data: {
        ...(body.regionId ? { regionId: body.regionId } : {}),
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "city",
      entityId: city.id,
      action: "update",
      beforeJson: before,
      afterJson: city,
      req,
    });

    res.json({ city });
  }),
);

citiesRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("City not found", 404);

    const city = await prisma.city.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "city",
      entityId: city.id,
      action: "archive",
      beforeJson: before,
      afterJson: city,
      req,
    });

    res.json({ city });
  }),
);

citiesRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.city.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("City not found", 404);

    const city = await prisma.city.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "city",
      entityId: city.id,
      action: "unarchive",
      beforeJson: before,
      afterJson: city,
      req,
    });

    res.json({ city });
  }),
);

citiesRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.city.findUnique({
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
    if (!before) throw new AppError("City not found", 404);

    try {
      await prisma.city.delete({
        where: { id },
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "City cannot be deleted because linked districts or users exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "city",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);

districtsRouter.get(
  "/",
  validateQuery(listDistrictsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listDistrictsQuerySchema>;

    const districts = await prisma.district.findMany({
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
  }),
);

districtsRouter.post(
  "/",
  requireCsrf,
  validateBody(createDistrictSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createDistrictSchema>;

    const region = await prisma.region.findUnique({
      where: { id: body.regionId },
      select: { id: true },
    });
    if (!region) throw new AppError("Region not found", 404);

    if (body.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: body.cityId },
        select: { id: true, regionId: true },
      });
      if (!city) throw new AppError("City not found", 404);
      if (city.regionId !== body.regionId) throw new AppError("City is not in selected region", 400);
    }

    const district = await prisma.district.create({
      data: {
        regionId: body.regionId,
        cityId: body.cityId || null,
        slug: body.slug,
        name: body.name,
        soatoId: body.soatoId,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "district",
      entityId: district.id,
      action: "create",
      beforeJson: null,
      afterJson: district,
      req,
    });

    res.status(201).json({ district });
  }),
);

districtsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateDistrictSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof updateDistrictSchema>;

    const before = await prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("District not found", 404);

    const nextRegionId = body.regionId || before.regionId;
    const nextCityId = body.cityId !== undefined ? body.cityId : before.cityId;

    if (body.regionId) {
      const region = await prisma.region.findUnique({
        where: { id: body.regionId },
        select: { id: true },
      });
      if (!region) throw new AppError("Region not found", 404);
    }

    if (nextCityId) {
      const city = await prisma.city.findUnique({
        where: { id: nextCityId },
        select: { id: true, regionId: true },
      });
      if (!city) throw new AppError("City not found", 404);
      if (city.regionId !== nextRegionId) throw new AppError("City is not in selected region", 400);
    }

    const district = await prisma.district.update({
      where: { id: req.params.id },
      data: {
        ...(body.regionId ? { regionId: body.regionId } : {}),
        ...(body.cityId !== undefined ? { cityId: body.cityId || null } : {}),
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.soatoId !== undefined ? { soatoId: body.soatoId } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "district",
      entityId: district.id,
      action: "update",
      beforeJson: before,
      afterJson: district,
      req,
    });

    res.json({ district });
  }),
);

districtsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("District not found", 404);

    const district = await prisma.district.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "district",
      entityId: district.id,
      action: "archive",
      beforeJson: before,
      afterJson: district,
      req,
    });

    res.json({ district });
  }),
);

districtsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.district.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("District not found", 404);

    const district = await prisma.district.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "district",
      entityId: district.id,
      action: "unarchive",
      beforeJson: before,
      afterJson: district,
      req,
    });

    res.json({ district });
  }),
);

districtsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.district.findUnique({
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
    if (!before) throw new AppError("District not found", 404);

    try {
      await prisma.district.delete({
        where: { id },
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "District cannot be deleted because linked schools or users exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "district",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);

schoolsRouter.get(
  "/",
  validateQuery(listSchoolsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listSchoolsQuerySchema>;

    const where: Prisma.SchoolWhereInput = {
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

    const schools = await prisma.school.findMany({
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
  }),
);

schoolsRouter.post(
  "/",
  requireCsrf,
  validateBody(createSchoolSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createSchoolSchema>;

    const district = await prisma.district.findUnique({
      where: { id: body.districtId },
      select: { id: true },
    });
    if (!district) throw new AppError("District not found", 404);

    const school = await prisma.school.create({
      data: {
        districtId: body.districtId,
        slug: body.slug,
        name: body.name,
        ...statusUpdateData(body.status),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "school",
      entityId: school.id,
      action: "create",
      beforeJson: null,
      afterJson: school,
      req,
    });

    res.status(201).json({ school });
  }),
);

schoolsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateSchoolSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof updateSchoolSchema>;

    const before = await prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("School not found", 404);

    if (body.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: body.districtId },
        select: { id: true },
      });
      if (!district) throw new AppError("District not found", 404);
    }

    const school = await prisma.school.update({
      where: { id: req.params.id },
      data: {
        ...(body.districtId ? { districtId: body.districtId } : {}),
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "school",
      entityId: school.id,
      action: "update",
      beforeJson: before,
      afterJson: school,
      req,
    });

    res.json({ school });
  }),
);

schoolsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("School not found", 404);

    const school = await prisma.school.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "school",
      entityId: school.id,
      action: "archive",
      beforeJson: before,
      afterJson: school,
      req,
    });

    res.json({ school });
  }),
);

schoolsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const before = await prisma.school.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError("School not found", 404);

    const school = await prisma.school.update({
      where: { id: req.params.id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });

    await adminAudit({
      adminId: req.user.id,
      entityType: "school",
      entityId: school.id,
      action: "unarchive",
      beforeJson: before,
      afterJson: school,
      req,
    });

    res.json({ school });
  }),
);

schoolsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
    if (!before) throw new AppError("School not found", 404);

    try {
      await prisma.school.delete({
        where: { id },
      });
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "School cannot be deleted because linked users exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "school",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: null,
      req,
    });

    res.json({ deleted: true, id });
  }),
);

export const adminLocationsRouter = Router();

adminLocationsRouter.use("/regions", regionsRouter);
adminLocationsRouter.use("/cities", citiesRouter);
adminLocationsRouter.use("/districts", districtsRouter);
adminLocationsRouter.use("/schools", schoolsRouter);
