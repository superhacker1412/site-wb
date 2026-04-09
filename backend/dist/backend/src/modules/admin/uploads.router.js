"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUploadsRouter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const csrf_1 = require("../../middleware/csrf");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const uploadDir = path_1.default.resolve(process.cwd(), "uploads");
fs_1.default.mkdirSync(uploadDir, { recursive: true });
const allowedMimeTypes = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["image/gif", ".gif"],
    ["image/avif", ".avif"],
    ["image/bmp", ".bmp"],
    ["image/svg+xml", ".svg"],
]);
const uploader = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const ext = allowedMimeTypes.get(file.mimetype);
            if (!ext) {
                cb(new errors_1.AppError("Unsupported image format", 422), "");
                return;
            }
            cb(null, `${Date.now()}-${crypto_1.default.randomUUID()}${ext}`);
        },
    }),
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            cb(new errors_1.AppError("Only image files are allowed", 422));
            return;
        }
        cb(null, true);
    },
});
exports.adminUploadsRouter = (0, express_1.Router)();
exports.adminUploadsRouter.post("/", csrf_1.requireCsrf, uploader.single("file"), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new errors_1.AppError("File not provided", 422);
    const relativePath = `/uploads/${file.filename}`;
    const absoluteUrl = `${req.protocol}://${req.get("host")}${relativePath}`;
    res.status(201).json({
        file: {
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            relativePath,
            absoluteUrl,
        },
    });
}));
//# sourceMappingURL=uploads.router.js.map