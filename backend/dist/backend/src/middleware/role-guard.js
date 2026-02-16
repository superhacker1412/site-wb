"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errors_1 = require("../lib/errors");
function requireRole(role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.AppError("Unauthorized", 401));
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            next(new errors_1.AppError("Forbidden", 403));
            return;
        }
        next();
    };
}
//# sourceMappingURL=role-guard.js.map