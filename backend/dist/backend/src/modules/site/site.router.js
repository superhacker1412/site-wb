"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const html_sanitizer_1 = require("../../lib/html-sanitizer");
const rate_limits_1 = require("../../middleware/rate-limits");
const validate_1 = require("../../middleware/validate");
const default_settings_1 = require("./default-settings");
const createFeedbackSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().trim().email().toLowerCase(),
    phone: zod_1.z.string().trim().min(5).max(40).optional(),
    subject: zod_1.z.string().trim().min(2).max(160).optional(),
    message: zod_1.z.string().trim().min(10).max(5000),
});
exports.siteRouter = (0, express_1.Router)();
exports.siteRouter.get("/about", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const settings = await prisma_1.prisma.siteSettings.findUnique({ where: { id: "main" } });
    res.json({
        settings: settings || {
            ...default_settings_1.DEFAULT_SITE_SETTINGS,
            createdAt: null,
            updatedAt: null,
            updatedById: null,
        },
    });
}));
exports.siteRouter.get("/footer", (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const settings = await prisma_1.prisma.siteSettings.findUnique({
        where: { id: "main" },
        select: {
            footerBrand: true,
            footerDescription: true,
            footerPagesTitle: true,
            footerContactsTitle: true,
            footerLinkHomeLabel: true,
            footerLinkHomePath: true,
            footerLinkMaterialsLabel: true,
            footerLinkMaterialsPath: true,
            footerLinkQuizLabel: true,
            footerLinkQuizPath: true,
            footerLinkAboutLabel: true,
            footerLinkAboutPath: true,
            footerAddress: true,
            footerPhone: true,
            footerEmail: true,
            footerTelegram: true,
            footerWorkingHours: true,
            footerCopyright: true,
        },
    });
    res.json({
        settings: settings || {
            footerBrand: default_settings_1.DEFAULT_SITE_SETTINGS.footerBrand,
            footerDescription: default_settings_1.DEFAULT_SITE_SETTINGS.footerDescription,
            footerPagesTitle: default_settings_1.DEFAULT_SITE_SETTINGS.footerPagesTitle,
            footerContactsTitle: default_settings_1.DEFAULT_SITE_SETTINGS.footerContactsTitle,
            footerLinkHomeLabel: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkHomeLabel,
            footerLinkHomePath: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkHomePath,
            footerLinkMaterialsLabel: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkMaterialsLabel,
            footerLinkMaterialsPath: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkMaterialsPath,
            footerLinkQuizLabel: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkQuizLabel,
            footerLinkQuizPath: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkQuizPath,
            footerLinkAboutLabel: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkAboutLabel,
            footerLinkAboutPath: default_settings_1.DEFAULT_SITE_SETTINGS.footerLinkAboutPath,
            footerAddress: default_settings_1.DEFAULT_SITE_SETTINGS.footerAddress,
            footerPhone: default_settings_1.DEFAULT_SITE_SETTINGS.footerPhone,
            footerEmail: default_settings_1.DEFAULT_SITE_SETTINGS.footerEmail,
            footerTelegram: default_settings_1.DEFAULT_SITE_SETTINGS.footerTelegram,
            footerWorkingHours: default_settings_1.DEFAULT_SITE_SETTINGS.footerWorkingHours,
            footerCopyright: default_settings_1.DEFAULT_SITE_SETTINGS.footerCopyright,
        },
    });
}));
exports.siteRouter.post("/feedback", rate_limits_1.feedbackRateLimiter, (0, validate_1.validateBody)(createFeedbackSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    const name = (0, html_sanitizer_1.sanitizePlainText)(body.name);
    const email = (0, html_sanitizer_1.sanitizePlainText)(body.email).toLowerCase();
    const phone = body.phone ? (0, html_sanitizer_1.sanitizePlainText)(body.phone) : null;
    const subject = body.subject ? (0, html_sanitizer_1.sanitizePlainText)(body.subject) : null;
    const message = (0, html_sanitizer_1.sanitizePlainText)(body.message);
    const feedback = await prisma_1.prisma.feedbackMessage.create({
        data: {
            name,
            email,
            phone,
            subject,
            message,
        },
        select: {
            id: true,
            status: true,
            createdAt: true,
        },
    });
    res.status(201).json({
        message: "Xabaringiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
        feedback,
    });
}));
//# sourceMappingURL=site.router.js.map