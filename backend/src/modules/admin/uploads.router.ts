import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Router } from "express";
import multer from "multer";

import { requireCsrf } from "../../middleware/csrf";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";

const uploadDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
  ["image/bmp", ".bmp"],
  ["image/svg+xml", ".svg"],
]);

const uploader = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = allowedMimeTypes.get(file.mimetype);
      if (!ext) {
        cb(new AppError("Unsupported image format", 422), "");
        return;
      }
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new AppError("Only image files are allowed", 422));
      return;
    }
    cb(null, true);
  },
});

export const adminUploadsRouter = Router();

adminUploadsRouter.post(
  "/",
  requireCsrf,
  uploader.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw new AppError("File not provided", 422);

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
  }),
);
