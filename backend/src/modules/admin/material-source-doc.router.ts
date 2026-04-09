import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { requireCsrf } from "../../middleware/csrf";
import { sanitizeRichHtml, hasMeaningfulHtmlContent } from "../../lib/html-sanitizer";
import { convertDocxFileToHtmlAndSaveImages } from "../../lib/docx-to-html";

const docsDir = path.resolve(process.cwd(), "uploads", "docs");
fs.mkdirSync(docsDir, { recursive: true });

const allowedDocxMimeTypes = new Set<string>([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Some browsers may send generic types; we still validate by extension + zip header later.
  "application/zip",
  "application/octet-stream",
]);

const uploader = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, docsDir),
    filename: (_req, file, cb) => {
      const original = file.originalname || "document.docx";
      const ext = path.extname(original).toLowerCase();
      if (ext !== ".docx") {
        cb(new AppError("Only .docx files are supported", 422), "");
        return;
      }
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedDocxMimeTypes.has((file.mimetype || "").toLowerCase())) {
      cb(new AppError("Unsupported document type (upload .docx)", 422));
      return;
    }
    cb(null, true);
  },
});

export const adminMaterialSourceDocRouter = Router();

adminMaterialSourceDocRouter.post(
  "/:id/source-doc",
  requireCsrf,
  uploader.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const file = req.file;
    if (!file) throw new AppError("File not provided", 422);

    // Extra sniff: DOCX is a zip container. This is intentionally lightweight.
    try {
      const fd = await fs.promises.open(file.path, "r");
      const header = Buffer.alloc(4);
      await fd.read(header, 0, 4, 0);
      await fd.close();
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        throw new AppError("Invalid DOCX file", 422);
      }
    } catch (e) {
      try {
        await fs.promises.unlink(file.path);
      } catch {
        // ignore
      }
      if (e instanceof AppError) throw e;
      throw new AppError("Failed to validate uploaded document", 500);
    }

    const before = await prisma.material.findUnique({ where: { id } });
    if (!before) throw new AppError("Material not found", 404);

    // Convert to HTML and store it into contentHtml so existing frontend works unchanged.
    let converted;
    try {
      converted = await convertDocxFileToHtmlAndSaveImages({ docxAbsolutePath: file.path });
    } catch (e) {
      // Best-effort cleanup of uploaded doc if conversion fails.
      try {
        await fs.promises.unlink(file.path);
      } catch {
        // ignore
      }
      throw e;
    }

    const sanitized = sanitizeRichHtml(converted.html);
    if (!hasMeaningfulHtmlContent(sanitized)) {
      throw new AppError("Document content is empty after sanitization", 422);
    }

    const relativePath = `/uploads/docs/${file.filename}`;

    const material = await prisma.material.update({
      where: { id },
      data: {
        sourceDocPath: relativePath,
        sourceDocOriginalName: file.originalname || null,
        sourceDocMimeType: file.mimetype || null,
        sourceDocUpdatedAt: new Date(),
        contentHtml: sanitized,
        updatedById: req.user.id,
      },
      include: { category: true },
    });

    res.status(201).json({
      material,
      sourceDoc: {
        relativePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        conversionWarnings: converted.warnings,
      },
    });
  }),
);

