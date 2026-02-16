"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuizOptionsJson = parseQuizOptionsJson;
exports.optionLabel = optionLabel;
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function normalizeText(value) {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
function normalizeImagePath(value) {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
function parseQuizOptionsJson(value) {
    if (!Array.isArray(value))
        return [];
    const options = [];
    for (const item of value) {
        if (typeof item === "string") {
            const text = item.trim();
            if (text)
                options.push({ type: "TEXT", text });
            continue;
        }
        if (!isRecord(item))
            continue;
        const explicitType = normalizeText(item.type)?.toUpperCase();
        const text = normalizeText(item.text);
        const imagePath = normalizeImagePath(item.imagePath);
        if (explicitType === "IMAGE" || (!explicitType && imagePath)) {
            if (!imagePath)
                continue;
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
function optionLabel(option, index) {
    if (!option)
        return null;
    if (option.type === "IMAGE") {
        return option.text || `Rasm ${index + 1}`;
    }
    return option.text || null;
}
//# sourceMappingURL=quiz-options.js.map