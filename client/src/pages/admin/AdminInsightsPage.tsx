import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/labels";
import { formatDate, statusBadge } from "@/pages/admin/admin-ui";
import { InsightAction, InsightUser, InsightsResponse } from "@/pages/admin/admin-types";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FocusMode = "all" | "active" | "attempts" | "success";

function actionMeta(action: InsightAction): string {
  if (!action.meta) return "";
  if (action.type === "QUIZ_SUBMIT") {
    return `${String(action.meta.directionName || "-")} | ${String(action.meta.score || "-")}/${String(action.meta.total || "-")} (${String(action.meta.percentage || "-")}%)`;
  }
  if (action.type === "FAVORITE_MATERIAL_ADD") {
    return String(action.meta.materialTitle || action.meta.materialId || "");
  }
  if (action.type === "FAVORITE_DIRECTION_ADD") {
    return String(action.meta.directionName || action.meta.directionId || "");
  }
  if (action.type === "LOGIN") {
    return `IP: ${String(action.meta.ip || "-")}`;
  }
  return JSON.stringify(action.meta);
}

function passFilter(users: InsightUser[], mode: FocusMode): InsightUser[] {
  if (mode === "active") return users.filter((item) => item.status === "ACTIVE");
  if (mode === "attempts") return users.filter((item) => item.stats.attemptsCount > 0);
  if (mode === "success") return users.filter((item) => item.stats.successAttempts > 0);
  return users;
}

export default function AdminInsightsPage() {
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState<FocusMode>("all");

  const insightsQuery = useQuery({
    queryKey: ["admin", "users", "insights", search],
    queryFn: () => apiFetch<InsightsResponse>(`/admin/users/insights${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`),
  });

  const filteredUsers = useMemo(() => passFilter(insightsQuery.data?.users || [], focus), [insightsQuery.data?.users, focus]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Foydalanuvchi statistikasi"
        description="Har bir foydalanuvchi bo'yicha test urinishlari, faollik va to'liq amal ro'yxati."
      />

      <Card>
        <CardHeader>
          <CardTitle>Qidiruv va fokus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input placeholder="Ism yoki email bo'yicha qidiring..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button variant={focus === "all" ? "default" : "outline"} onClick={() => setFocus("all")}>
              Hammasi
            </Button>
            <Button variant={focus === "active" ? "default" : "outline"} onClick={() => setFocus("active")}>
              Faol
            </Button>
            <Button variant={focus === "attempts" ? "default" : "outline"} onClick={() => setFocus("attempts")}>
              Test topshirgan
            </Button>
            <Button variant={focus === "success" ? "default" : "outline"} onClick={() => setFocus("success")}>
              Muvaffaqiyatli
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Foydalanuvchilar</p>
                <p className="text-2xl font-bold">{insightsQuery.data?.users.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Faol</p>
                <p className="text-2xl font-bold">{(insightsQuery.data?.users || []).filter((item) => item.status === "ACTIVE").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Urinishlar</p>
                <p className="text-2xl font-bold">{(insightsQuery.data?.users || []).filter((item) => item.stats.attemptsCount > 0).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Amallar</p>
                <p className="text-2xl font-bold">{insightsQuery.data?.actions.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {user.name} ({user.email})
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {statusBadge(user.status)} <span className="ml-2">{roleLabel(user.role)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/users/${user.id}/profile`}>Profil</Link>
                  </Button>
                  {user.role !== "SUPER_ADMIN" ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/admin/users/${user.id}/edit`}>Tahrirlash</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3 xl:grid-cols-4">
                <div>Urinishlar: {user.stats.attemptsCount}</div>
                <div>Sessiyalar: {user.stats.sessionsCount}</div>
                <div>O'rtacha ball: {user.stats.averagePercentage}%</div>
                <div>Eng yaxshi ball: {user.stats.bestPercentage}%</div>
                <div>Muvaffaqiyatli urinish: {user.stats.successAttempts}</div>
                <div>Sevimli materiallar: {user.stats.favoriteMaterialsCount}</div>
                <div>Sevimli yo'nalishlar: {user.stats.favoriteDirectionsCount}</div>
                <div>Oxirgi kirish: {formatDate(user.stats.lastLoginAt)}</div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 ? <p className="text-sm text-muted-foreground">Mos foydalanuvchi topilmadi.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>To'liq amallar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(insightsQuery.data?.actions || []).map((action) => (
            <div key={action.id} className="rounded-lg border p-3">
              <div className="text-sm font-medium">
                {action.type}
                {action.user ? ` | ${action.user.name} (${action.user.email})` : ""}
              </div>
              <div className="text-xs text-muted-foreground">{formatDate(action.at)}</div>
              <div className="text-xs text-muted-foreground">{actionMeta(action)}</div>
            </div>
          ))}
          {insightsQuery.data?.actions.length === 0 ? <p className="text-sm text-muted-foreground">Amallar yo'q.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
