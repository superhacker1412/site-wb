import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AuditRecord } from "@/pages/admin/admin-types";
import { formatDate } from "@/pages/admin/admin-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuditResponse = {
  total: number;
  logs: AuditRecord[];
};

function stringifySafe(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminAuditPage() {
  const [entityType, setEntityType] = useState("");
  const [take, setTake] = useState("100");

  const auditQuery = useQuery({
    queryKey: ["admin", "audit", entityType, take],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("take", take);
      if (entityType.trim()) params.set("entityType", entityType.trim());
      return apiFetch<AuditResponse>(`/admin/audit?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Audit jurnali" description="Admin amallarining to'liq jurnali (oldin/keyin, ip, user-agent)." />

      <Card>
        <CardHeader>
          <CardTitle>Filtr</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_180px]">
          <Input placeholder="entityType (user, material, quiz_question...)" value={entityType} onChange={(event) => setEntityType(event.target.value)} />
          <Select value={take} onValueChange={setTake}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 ta</SelectItem>
              <SelectItem value="50">50 ta</SelectItem>
              <SelectItem value="100">100 ta</SelectItem>
              <SelectItem value="200">200 ta</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jurnal yozuvlari ({auditQuery.data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(auditQuery.data?.logs || []).map((log) => (
            <details key={log.id} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {log.admin.name} - {log.action} - {log.entityType}:{log.entityId}
              </summary>
              <div className="mt-2 space-y-2 text-sm">
                <p className="text-muted-foreground">{formatDate(log.createdAt)}</p>
                <p className="text-xs text-muted-foreground">IP: {log.ip || "-"} | UA: {log.userAgent || "-"}</p>
                <div className="grid gap-2 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Oldin</p>
                    <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-2 text-xs">{stringifySafe(log.beforeJson)}</pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Keyin</p>
                    <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-2 text-xs">{stringifySafe(log.afterJson)}</pre>
                  </div>
                </div>
              </div>
            </details>
          ))}
          {auditQuery.data?.logs.length === 0 ? <p className="text-sm text-muted-foreground">Audit yozuvlari yo'q.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
