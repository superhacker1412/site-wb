"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFeedbackRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const listFeedbackQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.FeedbackStatus).optional(),
    search: zod_1.z.string().trim().min(1).max(200).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(300).default(100),
    skip: zod_1.z.coerce.number().int().min(0).default(0),
});
const updateFeedbackSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.FeedbackStatus),
});
exports.adminFeedbackRouter = (0, express_1.Router)();
exports.adminFeedbackRouter.get("/", (0, validate_1.validateQuery)(listFeedbackQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { email: { contains: query.search, mode: "insensitive" } },
                    { subject: { contains: query.search, mode: "insensitive" } },
                    { message: { contains: query.search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [total, messages] = await Promise.all([
        prisma_1.prisma.feedbackMessage.count({ where }),
        prisma_1.prisma.feedbackMessage.findMany({
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
}));
exports.adminFeedbackRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateFeedbackSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.feedbackMessage.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Feedback message not found", 404);
    const message = await prisma_1.prisma.feedbackMessage.update({
        where: { id },
        data: {
            status: body.status,
            reviewedAt: body.status === client_1.FeedbackStatus.NEW ? null : new Date(),
            reviewedById: body.status === client_1.FeedbackStatus.NEW ? null : req.user.id,
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
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "feedback_message",
        entityId: id,
        action: "update_status",
        beforeJson: before,
        afterJson: message,
        req,
    });
    res.json({ message });
}));
//# sourceMappingURL=feedback.router.js.map