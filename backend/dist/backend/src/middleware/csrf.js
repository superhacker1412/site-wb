"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCsrf = requireCsrf;
const env_1 = require("../config/env");
const errors_1 = require("../lib/errors");
const security_1 = require("../lib/security");
const allowedOrigins = new Set(env_1.env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean));
function requireCsrf(req, _res, next) {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
        next();
        return;
    }
    const cookieToken = req.cookies?.[security_1.CSRF_COOKIE];
    const headerToken = req.get("x-csrf-token");
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        next(new errors_1.AppError("Invalid CSRF token", 403));
        return;
    }
    const origin = req.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
        next(new errors_1.AppError("Invalid request origin", 403));
        return;
    }
    next();
}
//# sourceMappingURL=csrf.js.map