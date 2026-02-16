"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSiteRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const html_sanitizer_1 = require("../../lib/html-sanitizer");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const default_settings_1 = require("../site/default-settings");
const helpers_1 = require("./helpers");
const updateAboutSchema = zod_1.z.object({
    aboutTitle: zod_1.z.string().trim().min(2).max(200).optional(),
    aboutSubtitle: zod_1.z.string().trim().min(10).max(3000).optional(),
    aboutDescription: zod_1.z.string().trim().min(10).max(12000).optional(),
    aboutMission: zod_1.z.string().trim().min(10).max(12000).optional(),
    aboutAddress: zod_1.z.string().trim().min(5).max(400).optional(),
    aboutPhone: zod_1.z.string().trim().min(5).max(80).optional(),
    aboutEmail: zod_1.z.string().trim().email().toLowerCase().optional(),
    aboutTelegram: zod_1.z.string().trim().min(2).max(80).nullable().optional(),
    aboutWorkingHours: zod_1.z.string().trim().min(2).max(120).nullable().optional(),
});
const footerPathSchema = zod_1.z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "Footer link path must be relative path or absolute URL",
});
const updateFooterSchema = zod_1.z.object({
    footerBrand: zod_1.z.string().trim().min(2).max(120).optional(),
    footerDescription: zod_1.z.string().trim().min(10).max(3000).optional(),
    footerPagesTitle: zod_1.z.string().trim().min(2).max(80).optional(),
    footerContactsTitle: zod_1.z.string().trim().min(2).max(80).optional(),
    footerLinkHomeLabel: zod_1.z.string().trim().min(1).max(80).optional(),
    footerLinkHomePath: footerPathSchema.optional(),
    footerLinkMaterialsLabel: zod_1.z.string().trim().min(1).max(80).optional(),
    footerLinkMaterialsPath: footerPathSchema.optional(),
    footerLinkQuizLabel: zod_1.z.string().trim().min(1).max(80).optional(),
    footerLinkQuizPath: footerPathSchema.optional(),
    footerLinkAboutLabel: zod_1.z.string().trim().min(1).max(80).optional(),
    footerLinkAboutPath: footerPathSchema.optional(),
    footerAddress: zod_1.z.string().trim().min(5).max(400).optional(),
    footerPhone: zod_1.z.string().trim().min(5).max(80).optional(),
    footerEmail: zod_1.z.string().trim().email().toLowerCase().optional(),
    footerTelegram: zod_1.z.string().trim().min(2).max(80).nullable().optional(),
    footerWorkingHours: zod_1.z.string().trim().min(2).max(120).nullable().optional(),
    footerCopyright: zod_1.z.string().trim().min(2).max(200).optional(),
});
exports.adminSiteRouter = (0, express_1.Router)();
exports.adminSiteRouter.get("/about", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const settings = await prisma_1.prisma.siteSettings.findUnique({
        where: { id: "main" },
        include: {
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    res.json({
        settings: settings || {
            ...default_settings_1.DEFAULT_SITE_SETTINGS,
            createdAt: null,
            updatedAt: null,
            updatedById: null,
            updatedBy: null,
        },
    });
}));
exports.adminSiteRouter.get("/footer", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const settings = await prisma_1.prisma.siteSettings.findUnique({
        where: { id: "main" },
        include: {
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    res.json({
        settings: settings || {
            ...default_settings_1.DEFAULT_SITE_SETTINGS,
            createdAt: null,
            updatedAt: null,
            updatedById: null,
            updatedBy: null,
        },
    });
}));
exports.adminSiteRouter.patch("/about", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateAboutSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const sanitizedBody = {
        ...(body.aboutTitle !== undefined ? { aboutTitle: (0, html_sanitizer_1.sanitizePlainText)(body.aboutTitle) } : {}),
        ...(body.aboutSubtitle !== undefined ? { aboutSubtitle: (0, html_sanitizer_1.sanitizePlainText)(body.aboutSubtitle) } : {}),
        ...(body.aboutDescription !== undefined ? { aboutDescription: (0, html_sanitizer_1.sanitizePlainText)(body.aboutDescription) } : {}),
        ...(body.aboutMission !== undefined ? { aboutMission: (0, html_sanitizer_1.sanitizePlainText)(body.aboutMission) } : {}),
        ...(body.aboutAddress !== undefined ? { aboutAddress: (0, html_sanitizer_1.sanitizePlainText)(body.aboutAddress) } : {}),
        ...(body.aboutPhone !== undefined ? { aboutPhone: (0, html_sanitizer_1.sanitizePlainText)(body.aboutPhone) } : {}),
        ...(body.aboutEmail !== undefined ? { aboutEmail: (0, html_sanitizer_1.sanitizePlainText)(body.aboutEmail).toLowerCase() } : {}),
        ...(body.aboutTelegram !== undefined
            ? { aboutTelegram: body.aboutTelegram ? (0, html_sanitizer_1.sanitizePlainText)(body.aboutTelegram) : null }
            : {}),
        ...(body.aboutWorkingHours !== undefined
            ? { aboutWorkingHours: body.aboutWorkingHours ? (0, html_sanitizer_1.sanitizePlainText)(body.aboutWorkingHours) : null }
            : {}),
    };
    const before = await prisma_1.prisma.siteSettings.findUnique({ where: { id: "main" } });
    const settings = await prisma_1.prisma.siteSettings.upsert({
        where: { id: "main" },
        update: {
            ...sanitizedBody,
            updatedById: req.user.id,
        },
        create: {
            ...default_settings_1.DEFAULT_SITE_SETTINGS,
            ...sanitizedBody,
            updatedById: req.user.id,
        },
        include: {
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "site_settings",
        entityId: settings.id,
        action: "update_about",
        beforeJson: before,
        afterJson: settings,
        req,
    });
    res.json({ settings });
}));
exports.adminSiteRouter.patch("/footer", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateFooterSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const sanitizedBody = {
        ...(body.footerBrand !== undefined ? { footerBrand: (0, html_sanitizer_1.sanitizePlainText)(body.footerBrand) } : {}),
        ...(body.footerDescription !== undefined ? { footerDescription: (0, html_sanitizer_1.sanitizePlainText)(body.footerDescription) } : {}),
        ...(body.footerPagesTitle !== undefined ? { footerPagesTitle: (0, html_sanitizer_1.sanitizePlainText)(body.footerPagesTitle) } : {}),
        ...(body.footerContactsTitle !== undefined
            ? { footerContactsTitle: (0, html_sanitizer_1.sanitizePlainText)(body.footerContactsTitle) }
            : {}),
        ...(body.footerLinkHomeLabel !== undefined
            ? { footerLinkHomeLabel: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkHomeLabel) }
            : {}),
        ...(body.footerLinkHomePath !== undefined ? { footerLinkHomePath: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkHomePath) } : {}),
        ...(body.footerLinkMaterialsLabel !== undefined
            ? { footerLinkMaterialsLabel: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkMaterialsLabel) }
            : {}),
        ...(body.footerLinkMaterialsPath !== undefined
            ? { footerLinkMaterialsPath: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkMaterialsPath) }
            : {}),
        ...(body.footerLinkQuizLabel !== undefined
            ? { footerLinkQuizLabel: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkQuizLabel) }
            : {}),
        ...(body.footerLinkQuizPath !== undefined ? { footerLinkQuizPath: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkQuizPath) } : {}),
        ...(body.footerLinkAboutLabel !== undefined
            ? { footerLinkAboutLabel: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkAboutLabel) }
            : {}),
        ...(body.footerLinkAboutPath !== undefined
            ? { footerLinkAboutPath: (0, html_sanitizer_1.sanitizePlainText)(body.footerLinkAboutPath) }
            : {}),
        ...(body.footerAddress !== undefined ? { footerAddress: (0, html_sanitizer_1.sanitizePlainText)(body.footerAddress) } : {}),
        ...(body.footerPhone !== undefined ? { footerPhone: (0, html_sanitizer_1.sanitizePlainText)(body.footerPhone) } : {}),
        ...(body.footerEmail !== undefined ? { footerEmail: (0, html_sanitizer_1.sanitizePlainText)(body.footerEmail).toLowerCase() } : {}),
        ...(body.footerTelegram !== undefined
            ? { footerTelegram: body.footerTelegram ? (0, html_sanitizer_1.sanitizePlainText)(body.footerTelegram) : null }
            : {}),
        ...(body.footerWorkingHours !== undefined
            ? { footerWorkingHours: body.footerWorkingHours ? (0, html_sanitizer_1.sanitizePlainText)(body.footerWorkingHours) : null }
            : {}),
        ...(body.footerCopyright !== undefined
            ? { footerCopyright: (0, html_sanitizer_1.sanitizePlainText)(body.footerCopyright) }
            : {}),
    };
    const before = await prisma_1.prisma.siteSettings.findUnique({ where: { id: "main" } });
    const settings = await prisma_1.prisma.siteSettings.upsert({
        where: { id: "main" },
        update: {
            ...sanitizedBody,
            updatedById: req.user.id,
        },
        create: {
            ...default_settings_1.DEFAULT_SITE_SETTINGS,
            ...sanitizedBody,
            updatedById: req.user.id,
        },
        include: {
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "site_settings",
        entityId: settings.id,
        action: "update_footer",
        beforeJson: before,
        afterJson: settings,
        req,
    });
    res.json({ settings });
}));
//# sourceMappingURL=site.router.js.map