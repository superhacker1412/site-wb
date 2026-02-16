"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const prisma_1 = require("./prisma");
async function writeAuditLog(payload) {
    await prisma_1.prisma.adminAuditLog.create({
        data: {
            adminId: payload.adminId,
            entityType: payload.entityType,
            entityId: payload.entityId,
            action: payload.action,
            beforeJson: payload.beforeJson,
            afterJson: payload.afterJson,
            ip: payload.req?.ip || null,
            userAgent: payload.req?.get("user-agent") || null,
        },
    });
}
//# sourceMappingURL=audit.js.map