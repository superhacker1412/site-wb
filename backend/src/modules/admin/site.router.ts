import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import { sanitizePlainText } from "../../lib/html-sanitizer";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody } from "../../middleware/validate";
import { DEFAULT_SITE_SETTINGS } from "../site/default-settings";
import { adminAudit } from "./helpers";

const updateAboutSchema = z.object({
  aboutTitle: z.string().trim().min(2).max(200).optional(),
  aboutSubtitle: z.string().trim().min(10).max(3000).optional(),
  aboutDescription: z.string().trim().min(10).max(12000).optional(),
  aboutMission: z.string().trim().min(10).max(12000).optional(),
  aboutAddress: z.string().trim().min(5).max(400).optional(),
  aboutPhone: z.string().trim().min(5).max(80).optional(),
  aboutEmail: z.string().trim().email().toLowerCase().optional(),
  aboutTelegram: z.string().trim().min(2).max(80).nullable().optional(),
  aboutWorkingHours: z.string().trim().min(2).max(120).nullable().optional(),
});

const footerPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "Footer link path must be relative path or absolute URL",
  });

const updateFooterSchema = z.object({
  footerBrand: z.string().trim().min(2).max(120).optional(),
  footerDescription: z.string().trim().min(10).max(3000).optional(),
  footerPagesTitle: z.string().trim().min(2).max(80).optional(),
  footerContactsTitle: z.string().trim().min(2).max(80).optional(),
  footerLinkHomeLabel: z.string().trim().min(1).max(80).optional(),
  footerLinkHomePath: footerPathSchema.optional(),
  footerLinkMaterialsLabel: z.string().trim().min(1).max(80).optional(),
  footerLinkMaterialsPath: footerPathSchema.optional(),
  footerLinkQuizLabel: z.string().trim().min(1).max(80).optional(),
  footerLinkQuizPath: footerPathSchema.optional(),
  footerLinkAboutLabel: z.string().trim().min(1).max(80).optional(),
  footerLinkAboutPath: footerPathSchema.optional(),
  footerAddress: z.string().trim().min(5).max(400).optional(),
  footerPhone: z.string().trim().min(5).max(80).optional(),
  footerEmail: z.string().trim().email().toLowerCase().optional(),
  footerTelegram: z.string().trim().min(2).max(80).nullable().optional(),
  footerWorkingHours: z.string().trim().min(2).max(120).nullable().optional(),
  footerCopyright: z.string().trim().min(2).max(200).optional(),
});

export const adminSiteRouter = Router();

adminSiteRouter.get(
  "/about",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSettings.findUnique({
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
      settings:
        settings || {
          ...DEFAULT_SITE_SETTINGS,
          createdAt: null,
          updatedAt: null,
          updatedById: null,
          updatedBy: null,
        },
    });
  }),
);

adminSiteRouter.get(
  "/footer",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSettings.findUnique({
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
      settings:
        settings || {
          ...DEFAULT_SITE_SETTINGS,
          createdAt: null,
          updatedAt: null,
          updatedById: null,
          updatedBy: null,
        },
    });
  }),
);

adminSiteRouter.patch(
  "/about",
  requireCsrf,
  validateBody(updateAboutSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const body = req.body as z.infer<typeof updateAboutSchema>;
    const sanitizedBody = {
      ...(body.aboutTitle !== undefined ? { aboutTitle: sanitizePlainText(body.aboutTitle) } : {}),
      ...(body.aboutSubtitle !== undefined ? { aboutSubtitle: sanitizePlainText(body.aboutSubtitle) } : {}),
      ...(body.aboutDescription !== undefined ? { aboutDescription: sanitizePlainText(body.aboutDescription) } : {}),
      ...(body.aboutMission !== undefined ? { aboutMission: sanitizePlainText(body.aboutMission) } : {}),
      ...(body.aboutAddress !== undefined ? { aboutAddress: sanitizePlainText(body.aboutAddress) } : {}),
      ...(body.aboutPhone !== undefined ? { aboutPhone: sanitizePlainText(body.aboutPhone) } : {}),
      ...(body.aboutEmail !== undefined ? { aboutEmail: sanitizePlainText(body.aboutEmail).toLowerCase() } : {}),
      ...(body.aboutTelegram !== undefined
        ? { aboutTelegram: body.aboutTelegram ? sanitizePlainText(body.aboutTelegram) : null }
        : {}),
      ...(body.aboutWorkingHours !== undefined
        ? { aboutWorkingHours: body.aboutWorkingHours ? sanitizePlainText(body.aboutWorkingHours) : null }
        : {}),
    };
    const before = await prisma.siteSettings.findUnique({ where: { id: "main" } });

    const settings = await prisma.siteSettings.upsert({
      where: { id: "main" },
      update: {
        ...sanitizedBody,
        updatedById: req.user.id,
      },
      create: {
        ...DEFAULT_SITE_SETTINGS,
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

    await adminAudit({
      adminId: req.user.id,
      entityType: "site_settings",
      entityId: settings.id,
      action: "update_about",
      beforeJson: before,
      afterJson: settings,
      req,
    });

    res.json({ settings });
  }),
);

adminSiteRouter.patch(
  "/footer",
  requireCsrf,
  validateBody(updateFooterSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const body = req.body as z.infer<typeof updateFooterSchema>;
    const sanitizedBody = {
      ...(body.footerBrand !== undefined ? { footerBrand: sanitizePlainText(body.footerBrand) } : {}),
      ...(body.footerDescription !== undefined ? { footerDescription: sanitizePlainText(body.footerDescription) } : {}),
      ...(body.footerPagesTitle !== undefined ? { footerPagesTitle: sanitizePlainText(body.footerPagesTitle) } : {}),
      ...(body.footerContactsTitle !== undefined
        ? { footerContactsTitle: sanitizePlainText(body.footerContactsTitle) }
        : {}),
      ...(body.footerLinkHomeLabel !== undefined
        ? { footerLinkHomeLabel: sanitizePlainText(body.footerLinkHomeLabel) }
        : {}),
      ...(body.footerLinkHomePath !== undefined ? { footerLinkHomePath: sanitizePlainText(body.footerLinkHomePath) } : {}),
      ...(body.footerLinkMaterialsLabel !== undefined
        ? { footerLinkMaterialsLabel: sanitizePlainText(body.footerLinkMaterialsLabel) }
        : {}),
      ...(body.footerLinkMaterialsPath !== undefined
        ? { footerLinkMaterialsPath: sanitizePlainText(body.footerLinkMaterialsPath) }
        : {}),
      ...(body.footerLinkQuizLabel !== undefined
        ? { footerLinkQuizLabel: sanitizePlainText(body.footerLinkQuizLabel) }
        : {}),
      ...(body.footerLinkQuizPath !== undefined ? { footerLinkQuizPath: sanitizePlainText(body.footerLinkQuizPath) } : {}),
      ...(body.footerLinkAboutLabel !== undefined
        ? { footerLinkAboutLabel: sanitizePlainText(body.footerLinkAboutLabel) }
        : {}),
      ...(body.footerLinkAboutPath !== undefined
        ? { footerLinkAboutPath: sanitizePlainText(body.footerLinkAboutPath) }
        : {}),
      ...(body.footerAddress !== undefined ? { footerAddress: sanitizePlainText(body.footerAddress) } : {}),
      ...(body.footerPhone !== undefined ? { footerPhone: sanitizePlainText(body.footerPhone) } : {}),
      ...(body.footerEmail !== undefined ? { footerEmail: sanitizePlainText(body.footerEmail).toLowerCase() } : {}),
      ...(body.footerTelegram !== undefined
        ? { footerTelegram: body.footerTelegram ? sanitizePlainText(body.footerTelegram) : null }
        : {}),
      ...(body.footerWorkingHours !== undefined
        ? { footerWorkingHours: body.footerWorkingHours ? sanitizePlainText(body.footerWorkingHours) : null }
        : {}),
      ...(body.footerCopyright !== undefined
        ? { footerCopyright: sanitizePlainText(body.footerCopyright) }
        : {}),
    };
    const before = await prisma.siteSettings.findUnique({ where: { id: "main" } });

    const settings = await prisma.siteSettings.upsert({
      where: { id: "main" },
      update: {
        ...sanitizedBody,
        updatedById: req.user.id,
      },
      create: {
        ...DEFAULT_SITE_SETTINGS,
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

    await adminAudit({
      adminId: req.user.id,
      entityType: "site_settings",
      entityId: settings.id,
      action: "update_footer",
      beforeJson: before,
      afterJson: settings,
      req,
    });

    res.json({ settings });
  }),
);
