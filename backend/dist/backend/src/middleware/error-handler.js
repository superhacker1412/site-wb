"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const errors_1 = require("../lib/errors");
function notFound(_req, res) {
    res.status(404).json({ message: "Not found" });
}
function errorHandler(error, _req, res, _next) {
    const exposeDetails = env_1.env.NODE_ENV !== "production";
    if (error instanceof errors_1.AppError) {
        res.status(error.statusCode).json({
            message: error.message,
            ...(exposeDetails && error.details ? { details: error.details } : {}),
        });
        return;
    }
    if (error instanceof zod_1.ZodError) {
        res.status(422).json({
            message: "Validation failed",
            details: error.flatten(),
        });
        return;
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Resource already exists" });
            return;
        }
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
}
//# sourceMappingURL=error-handler.js.map