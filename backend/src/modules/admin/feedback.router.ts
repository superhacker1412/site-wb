import { FeedbackStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody, validateQuery } from "../../middleware/validate";
import { adminAudit } from "./helpers";

const listFeedbackQuerySchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  take: z.coerce.number().int().min(1).max(300).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

const updateFeedbackSchema = z.object({
  status: z.nativeEnum(FeedbackStatus),
});

export const adminFeedbackRouter = Router();

adminFeedbackRouter.get(
  "/",
  validateQuery(listFeedbackQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listFeedbackQuerySchema>;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
              { subject: { contains: query.search, mode: "insensitive" as const } },
              { message: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, messages] = await Promise.all([
      prisma.feedbackMessage.count({ where }),
      prisma.feedbackMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.take,
        skip: query.skip,
        include: {
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    res.json({ total, messages });
  }),
);

adminFeedbackRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateFeedbackSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const id = req.params.id;
    const body = req.body as z.infer<typeof updateFeedbackSchema>;

    const before = await prisma.feedbackMessage.findUnique({ where: { id } });
    if (!before) throw new AppError("Feedback message not found", 404);

    const message = await prisma.feedbackMessage.update({
      where: { id },
      data: {
        status: body.status,
        reviewedAt: body.status === FeedbackStatus.NEW ? null : new Date(),
        reviewedById: body.status === FeedbackStatus.NEW ? null : req.user.id,
      },
      include: {
        reviewedBy: {
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
      entityType: "feedback_message",
      entityId: id,
      action: "update_status",
      beforeJson: before,
      afterJson: message,
      req,
    });

    res.json({ message });
  }),
);
