"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const validate_1 = require("../../middleware/validate");
const auditQuerySchema = zod_1.z.object({
    take: zod_1.z.coerce.number().int().min(1).max(200).default(50),
    skip: zod_1.z.coerce.number().int().min(0).default(0),
    entityType: zod_1.z.string().optional(),
});
exports.adminAuditRouter = (0, express_1.Router)();
exports.adminAuditRouter.get("/", (0, validate_1.validateQuery)(auditQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { take, skip, entityType } = auditQuerySchema.parse(req.query);
    const where = entityType ? { entityType } : undefined;
    const [total, logs] = await Promise.all([
        prisma_1.prisma.adminAuditLog.count({ where }),
        prisma_1.prisma.adminAuditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            include: {
                admin: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
    ]);
    res.json({ total, logs });
}));
//# sourceMappingURL=audit.router.js.map