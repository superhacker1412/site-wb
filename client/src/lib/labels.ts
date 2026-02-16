export function roleLabel(role?: string | null): string {
  if (role === "SUPER_ADMIN") return "Bosh admin";
  if (role === "ADMIN") return "Admin";
  if (role === "USER") return "Foydalanuvchi";
  return role || "-";
}

export function statusLabel(status?: string | null): string {
  if (status === "ACTIVE") return "Faol";
  if (status === "ARCHIVED") return "Arxiv";
  return status || "-";
}
