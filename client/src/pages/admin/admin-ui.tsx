import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/labels";

export function statusBadge(status: string) {
  if (status === "ARCHIVED") return <Badge variant="secondary">{statusLabel(status)}</Badge>;
  return <Badge className="bg-emerald-600">{statusLabel(status)}</Badge>;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
