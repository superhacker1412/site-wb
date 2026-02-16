"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusUpdateData = statusUpdateData;
exports.adminAudit = adminAudit;
exports.isRelationConstraintError = isRelationConstraintError;
const client_1 = require("@prisma/client");
const audit_1 = require("../../lib/audit");
function statusUpdateData(status) {
    return {
        status,
        archivedAt: status === client_1.EntityStatus.ARCHIVED ? new Date() : null,
    };
}
async function adminAudit(params) {
    await (0, audit_1.writeAuditLog)({
        adminId: params.adminId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        beforeJson: params.beforeJson,
        afterJson: params.afterJson,
        req: params.req,
    });
}
function isRelationConstraintError(error) {
    return (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2003" || error.code === "P2014"));
}
//# sourceMappingURL=helpers.js.map