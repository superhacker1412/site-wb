import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mammoth from "mammoth";

import { AppError } from "./errors";

const uploadsDir = path.resolve(process.cwd(), "uploads");
const uploadsDocImagesDir = path.join(uploadsDir, "doc-images");

function ensureDirs(): void {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(uploadsDocImagesDir, { recursive: true });
}

function extFromContentType(contentType: string | undefined): string {
  const ct = (contentType || "").toLowerCase();
  if (ct === "image/jpeg") return ".jpg";
  if (ct === "image/png") return ".png";
  if (ct === "image/gif") return ".gif";
  if (ct === "image/webp") return ".webp";
  if (ct === "image/avif") return ".avif";
  if (ct === "image/svg+xml") return ".svg";
  return "";
}

export async function convertDocxFileToHtmlAndSaveImages(params: {
  docxAbsolutePath: string;
}): Promise<{ html: string; warnings: string[] }> {
  ensureDirs();

  let docxBuffer: Buffer;
  try {
    docxBuffer = await fs.promises.readFile(params.docxAbsolutePath);
  } catch {
    throw new AppError("Failed to read uploaded document", 500);
  }

  // Basic DOCX sniff: it’s a zip container (PK..). Not perfect but avoids obvious garbage.
  if (docxBuffer.length < 4 || docxBuffer[0] !== 0x50 || docxBuffer[1] !== 0x4b) {
    throw new AppError("Invalid DOCX file", 422);
  }

  const warnings: string[] = [];
  const result = await mammoth.convertToHtml(
    { buffer: docxBuffer },
    {
      convertImage: mammoth.images.inline(async (image) => {
        const contentType = image.contentType;
        const ext = extFromContentType(contentType);
        if (!ext) {
          warnings.push(`Skipped image with unsupported content-type: ${contentType || "unknown"}`);
          return { src: "" };
        }

        const bytes = await image.read();
        const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        const absolutePath = path.join(uploadsDocImagesDir, filename);
        await fs.promises.writeFile(absolutePath, Buffer.from(bytes));
        return { src: `/uploads/doc-images/${filename}` };
      }),
    },
  );

  // Mammoth may include empty src="" for skipped images; strip those.
  const html = (result.value || "<p></p>").replace(/<img[^>]*src=(\"|\')\1[^>]*>/g, "");
  for (const msg of result.messages || []) warnings.push(msg.message);

  return { html, warnings };
}

