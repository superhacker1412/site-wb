import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { sanitizePlainText } from "../../lib/html-sanitizer";
import { feedbackRateLimiter } from "../../middleware/rate-limits";
import { validateBody } from "../../middleware/validate";
import { DEFAULT_SITE_SETTINGS } from "./default-settings";

const createFeedbackSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(5).max(40).optional(),
  subject: z.string().trim().min(2).max(160).optional(),
  message: z.string().trim().min(10).max(5000),
});

export const siteRouter = Router();

siteRouter.get(
  "/about",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });

    res.json({
      settings:
        settings || {
          ...DEFAULT_SITE_SETTINGS,
          createdAt: null,
          updatedAt: null,
          updatedById: null,
        },
    });
  }),
);

siteRouter.get(
  "/footer",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSettings.findUnique({
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
      settings:
        settings || {
          footerBrand: DEFAULT_SITE_SETTINGS.footerBrand,
          footerDescription: DEFAULT_SITE_SETTINGS.footerDescription,
          footerPagesTitle: DEFAULT_SITE_SETTINGS.footerPagesTitle,
          footerContactsTitle: DEFAULT_SITE_SETTINGS.footerContactsTitle,
          footerLinkHomeLabel: DEFAULT_SITE_SETTINGS.footerLinkHomeLabel,
          footerLinkHomePath: DEFAULT_SITE_SETTINGS.footerLinkHomePath,
          footerLinkMaterialsLabel: DEFAULT_SITE_SETTINGS.footerLinkMaterialsLabel,
          footerLinkMaterialsPath: DEFAULT_SITE_SETTINGS.footerLinkMaterialsPath,
          footerLinkQuizLabel: DEFAULT_SITE_SETTINGS.footerLinkQuizLabel,
          footerLinkQuizPath: DEFAULT_SITE_SETTINGS.footerLinkQuizPath,
          footerLinkAboutLabel: DEFAULT_SITE_SETTINGS.footerLinkAboutLabel,
          footerLinkAboutPath: DEFAULT_SITE_SETTINGS.footerLinkAboutPath,
          footerAddress: DEFAULT_SITE_SETTINGS.footerAddress,
          footerPhone: DEFAULT_SITE_SETTINGS.footerPhone,
          footerEmail: DEFAULT_SITE_SETTINGS.footerEmail,
          footerTelegram: DEFAULT_SITE_SETTINGS.footerTelegram,
          footerWorkingHours: DEFAULT_SITE_SETTINGS.footerWorkingHours,
          footerCopyright: DEFAULT_SITE_SETTINGS.footerCopyright,
        },
    });
  }),
);

siteRouter.post(
  "/feedback",
  feedbackRateLimiter,
  validateBody(createFeedbackSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createFeedbackSchema>;

    const name = sanitizePlainText(body.name);
    const email = sanitizePlainText(body.email).toLowerCase();
    const phone = body.phone ? sanitizePlainText(body.phone) : null;
    const subject = body.subject ? sanitizePlainText(body.subject) : null;
    const message = sanitizePlainText(body.message);

    const feedback = await prisma.feedbackMessage.create({
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
  }),
);
