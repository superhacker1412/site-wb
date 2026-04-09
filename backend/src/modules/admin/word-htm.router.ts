import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Router } from "express";
import multer from "multer";
import * as cheerio from "cheerio";

import { requireCsrf } from "../../middleware/csrf";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";

const uploadDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedImageMimeTypes = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
  ["image/bmp", ".bmp"],
  ["image/svg+xml", ".svg"],
]);

function normalizeWordImgSrc(src: string): string {
  let s = (src || "").trim();
  if (!s) return "";
  s = s.replace(/\\/g, "/");
  s = s.split("#")[0]?.split("?")[0] || s;
  s = s.replace(/^\.\//, "");
  s = s.replace(/^file:\/\/\/+/i, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore
  }
  return s;
}

function basenameLower(src: string): string {
  const normalized = normalizeWordImgSrc(src);
  const base = normalized.split("/").pop() || normalized;
  return base.toLowerCase();
}

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1500,
  },
});

export const adminWordHtmRouter = Router();

adminWordHtmRouter.post(
  "/import",
  requireCsrf,
  uploader.any(),
  asyncHandler(async (req, res) => {
    const files = (req.files || []) as Express.Multer.File[];
    const htm = files.find((f) => f.fieldname === "htm") || null;
    if (!htm) throw new AppError("HTM file not provided", 422);

    const assets = files.filter((f) => f.fieldname === "assets");

    const assetSrcByBaseLower = new Map<string, string>();
    let assetsSaved = 0;

    for (const file of assets) {
      const ext = allowedImageMimeTypes.get(file.mimetype);
      if (!ext) {
        // Word *.files can contain non-images (css, xml). Ignore.
        continue;
      }

      const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
      const absolutePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(absolutePath, file.buffer);

      assetsSaved += 1;
      assetSrcByBaseLower.set((file.originalname || "").toLowerCase(), `/uploads/${filename}`);
    }

    const htmlText = htm.buffer.toString("utf-8");
    const $ = cheerio.load(htmlText);

    // Safer: drop obvious executable tags in admin preview.
    $("script, iframe").remove();

    const body = $("body");
    const bodyHtml = (body.length ? body.html() : $.root().html()) || "";

    const $body = cheerio.load(bodyHtml);
    const imgs = $body("img").toArray();
    let replaced = 0;

    for (const el of imgs) {
      const current = $body(el).attr("src") || "";
      const normalized = normalizeWordImgSrc(current);
      if (!normalized) continue;
      if (/^https?:\/\//i.test(normalized) || normalized.startsWith("data:") || normalized.startsWith("/uploads/")) continue;

      const base = basenameLower(normalized);
      const mapped = assetSrcByBaseLower.get(base);
      if (!mapped) continue;

      $body(el).attr("src", mapped);
      replaced += 1;
    }

    const resultHtml = $body.root().html() || "<p></p>";

    res.status(200).json({
      html: resultHtml,
      images: {
        totalInHtml: imgs.length,
        assetsProvided: assets.length,
        assetsSaved,
        replaced,
      },
    });
  }),
);

