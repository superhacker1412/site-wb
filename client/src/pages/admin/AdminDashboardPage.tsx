import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { Activity, BookOpenText, CheckCircle2, Percent, PlusCircle, Users } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/pages/admin/admin-ui";
import { DashboardResponse } from "@/pages/admin/admin-types";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Period = "7d" | "30d" | "90d" | "all";

const periodOptions: Period[] = ["7d", "30d", "90d", "all"];

const kpiMeta = [
  { key: "totalUsers", title: "Jami foydalanuvchi", icon: Users, href: "/admin/users", suffix: "" },
  { key: "activeUsers", title: "Faol foydalanuvchi", icon: CheckCircle2, href: "/admin/insights", suffix: "" },
  { key: "totalAttempts", title: "Urinishlar", icon: Activity, href: "/admin/insights", suffix: "" },
  { key: "averageScore", title: "O'rtacha ball", icon: Percent, href: "/admin/insights", suffix: "%" },
  { key: "successRate", title: "Muvaffaqiyat", icon: Percent, href: "/admin/insights", suffix: "%" },
] as const;

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard", period],
    queryFn: () => apiFetch<DashboardResponse>(`/admin/dashboard?period=${period}&granularity=day`),
  });

  if (dashboardQuery.isLoading) {
    return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!dashboardQuery.data) {
    return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Boshqaruv paneli ma'lumotlari topilmadi.</div>;
  }

  const { kpi, charts, latest } = dashboardQuery.data;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Boshqaruv paneli"
        description="Asosiy KPI, grafiklar va oxirgi faolliklar."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/materials">
                <BookOpenText className="mr-2 h-4 w-4" />
                Materiallar
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/materials/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yangi material
              </Link>
            </Button>
            {periodOptions.map((item) => (
              <Button key={item} size="sm" variant={period === item ? "default" : "outline"} onClick={() => setPeriod(item)}>
                {item}
              </Button>
            ))}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiMeta.map((item) => {
          const Icon = item.icon;
          const value = kpi[item.key];
          return (
            <Link key={item.key} to={item.href}>
              <Card className="h-full border-primary/10 transition hover:border-primary/40 hover:shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    {item.title}
                    <Icon className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">
                  {value}
                  {item.suffix}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kunlar bo'yicha urinishlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  data: charts.attemptsByDay.map((row) => new Date(row.day).toLocaleDateString()),
                },
                yAxis: { type: "value" },
                series: [
                  {
                    type: "line",
                    smooth: true,
                    data: charts.attemptsByDay.map((row) => row.attempts),
                    lineStyle: { width: 3 },
                    areaStyle: {},
                  },
                ],
              }}
              style={{ height: 320 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kunlar bo'yicha muvaffaqiyat</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  data: charts.successByDay.map((row) => new Date(row.day).toLocaleDateString()),
                },
                yAxis: { type: "value" },
                series: [
                  {
                    type: "bar",
                    data: charts.successByDay.map((row) => Number(row.avgPercentage.toFixed(2))),
                  },
                ],
              }}
              style={{ height: 320 }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yo'nalishlar bo'yicha urinishlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: { trigger: "item" },
                series: [
                  {
                    type: "pie",
                    radius: ["35%", "70%"],
                    data: charts.attemptsByDirection.map((row) => ({
                      value: row.attempts,
                      name: row.directionName,
                    })),
                  },
                ],
              }}
              style={{ height: 320 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategoriyalar bo'yicha materiallar</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  data: charts.materialsByCategory.map((row) => row.categoryName),
                  axisLabel: { rotate: 20 },
                },
                yAxis: { type: "value" },
                series: [
                  {
                    type: "bar",
                    data: charts.materialsByCategory.map((row) => row.materials),
                  },
                ],
              }}
              style={{ height: 320 }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Yangi foydalanuvchilar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latest.newUsers.map((user) => (
              <div key={user.id} className="rounded-md border p-2 text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</div>
              </div>
            ))}
            {latest.newUsers.length === 0 ? <p className="text-sm text-muted-foreground">Ma'lumot yo'q.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oxirgi urinishlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latest.latestAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-md border p-2 text-sm">
                <div className="font-medium">{attempt.user.name}</div>
                <div className="text-muted-foreground">
                  {attempt.direction.name}: {attempt.score}/{attempt.total} ({attempt.percentage}%)
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(attempt.submittedAt)}</div>
              </div>
            ))}
            {latest.latestAttempts.length === 0 ? <p className="text-sm text-muted-foreground">Hali urinishlar yo'q.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oxirgi admin amallari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latest.recentAdminActions.map((item) => (
              <div key={item.id} className="rounded-md border p-2 text-sm">
                <div className="font-medium">
                  {item.admin.name} - {item.action}
                </div>
                <div className="text-muted-foreground">
                  {item.entityType}:{item.entityId}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</div>
              </div>
            ))}
            {latest.recentAdminActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hali audit yozuvlari yo'q.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
