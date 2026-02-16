import { Prisma } from "@prisma/client";

export type QuizOptionType = "TEXT" | "IMAGE";

export type QuizOption = {
  type: QuizOptionType;
  text?: string;
  imagePath?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeImagePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function parseQuizOptionsJson(value: Prisma.JsonValue | null): QuizOption[] {
  if (!Array.isArray(value)) return [];

  const options: QuizOption[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) options.push({ type: "TEXT", text });
      continue;
    }

    if (!isRecord(item)) continue;

    const explicitType = normalizeText(item.type)?.toUpperCase();
    const text = normalizeText(item.text);
    const imagePath = normalizeImagePath(item.imagePath);

    if (explicitType === "IMAGE" || (!explicitType && imagePath)) {
      if (!imagePath) continue;
      options.push({
        type: "IMAGE",
        imagePath,
        ...(text ? { text } : {}),
      });
      continue;
    }

    if (text) {
      options.push({
        type: "TEXT",
        text,
      });
    }
  }

  return options;
}

export function optionLabel(option: QuizOption | undefined, index: number): string | null {
  if (!option) return null;
  if (option.type === "IMAGE") {
    return option.text || `Rasm ${index + 1}`;
  }
  return option.text || null;
}
