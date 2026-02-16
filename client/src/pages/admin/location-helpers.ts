export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['`‘’ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
