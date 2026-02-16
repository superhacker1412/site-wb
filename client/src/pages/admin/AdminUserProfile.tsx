import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { roleLabel, statusLabel } from "@/lib/labels";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";

type ProfileResponse = {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    middleName?: string | null;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    status: "ACTIVE" | "ARCHIVED";
    region?: { id: string; name: string } | null;
    city?: { id: string; name: string } | null;
    district?: { id: string; name: string } | null;
    customDistrictName?: string | null;
    school?: { id: string; name: string } | null;
    customSchoolName?: string | null;
    gradeNumber?: number | null;
    gradeLetter?: string | null;
    createdAt: string;
  };
  directions: Array<{
    directionId: string;
    directionName: string;
    attemptsCount: number;
    bestPercentage: number;
    averagePercentage: number;
    lastSubmittedAt: string | null;
  }>;
  attempts: Array<{
    id: string;
    directionId: string;
    directionName: string;
    score: number;
    total: number;
    percentage: number;
    submittedAt: string;
    answers: Array<{
      id: string;
      questionId: string;
      questionText: string;
      selectedAnswerIndex: number;
      selectedAnswerText: string | null;
      correctAnswerIndex: number;
      correctAnswerText: string | null;
      isCorrect: boolean;
    }>;
  }>;
  actions: Array<{ id: string; type: string; at: string; meta?: Record<string, unknown> }>;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminUserProfile() {
  const { id } = useParams<{ id: string }>();

  const profileQuery = useQuery({
    queryKey: ["admin", "users", "profile", id],
    queryFn: () => apiFetch<ProfileResponse>(`/admin/users/profiles/${id}`),
    enabled: Boolean(id),
  });

  const average = useMemo(() => {
    const attempts = profileQuery.data?.attempts || [];
    if (attempts.length === 0) return 0;
    const total = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0);
    return Number((total / attempts.length).toFixed(2));
  }, [profileQuery.data?.attempts]);

  if (profileQuery.isLoading) {
    return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!profileQuery.data) {
    return (
      <div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Foydalanuvchi topilmadi</p>
            <Button asChild className="mt-4"><Link to="/admin/users">Foydalanuvchilar ro'yxatiga qaytish</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, directions, attempts, actions } = profileQuery.data;

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Foydalanuvchi profili" description="To'liq faoliyat: urinishlar, javoblar, yo'nalishlar va amallar." />
      <div className="flex gap-2">
        <Button variant="outline" asChild><Link to="/admin/users">Orqaga</Link></Button>
        {user.role !== "SUPER_ADMIN" && <Button asChild><Link to={`/admin/users/${user.id}/edit`}>Foydalanuvchini tahrirlash</Link></Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name} ({user.email})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-4">
          <div><span className="text-muted-foreground">Rol:</span> {roleLabel(user.role)}</div>
          <div><span className="text-muted-foreground">Status:</span> {statusLabel(user.status)}</div>
          <div><span className="text-muted-foreground">Urinishlar:</span> {attempts.length}</div>
          <div><span className="text-muted-foreground">O'rtacha ball:</span> {average}%</div>
          <div><span className="text-muted-foreground">Viloyat:</span> {user.region?.name || "-"}</div>
          <div><span className="text-muted-foreground">Shahar:</span> {user.city?.name || "-"}</div>
          <div><span className="text-muted-foreground">Tuman:</span> {user.district?.name || user.customDistrictName || "-"}</div>
          <div><span className="text-muted-foreground">Maktab:</span> {user.school?.name || user.customSchoolName || "-"}</div>
          <div>
            <span className="text-muted-foreground">Klass:</span>{" "}
            {user.gradeNumber ? `${user.gradeNumber}${user.gradeLetter || ""}` : "-"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Yo'nalishlar (qaysilarini yechgan)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {directions.map((direction) => (
            <div key={direction.directionId} className="rounded-md border p-3 text-sm">
              <div className="font-semibold">{direction.directionName}</div>
              <div className="text-muted-foreground">Urinishlar: {direction.attemptsCount} | Eng yaxshi: {direction.bestPercentage}% | O'rtacha: {direction.averagePercentage}%</div>
              <div className="text-muted-foreground">Oxirgi: {formatDate(direction.lastSubmittedAt)}</div>
            </div>
          ))}
          {directions.length === 0 && <p className="text-sm text-muted-foreground">Hali test ishlamagan.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Har bir urinish va javoblar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {attempts.map((attempt) => (
            <details key={attempt.id} className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {formatDate(attempt.submittedAt)} | {attempt.directionName} | {attempt.score}/{attempt.total} ({attempt.percentage}%)
              </summary>
              <div className="mt-3 space-y-2">
                {attempt.answers.map((answer) => (
                  <div key={answer.id} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{answer.questionText}</p>
                    <p className="text-muted-foreground">Tanlangan: {answer.selectedAnswerText || `#${answer.selectedAnswerIndex}`}</p>
                    <p className="text-muted-foreground">To'g'ri: {answer.correctAnswerText || `#${answer.correctAnswerIndex}`}</p>
                    <p className={answer.isCorrect ? "text-emerald-700" : "text-rose-700"}>{answer.isCorrect ? "To'g'ri" : "Noto'g'ri"}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {attempts.length === 0 && <p className="text-sm text-muted-foreground">Urinishlar topilmadi.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Barcha amallar</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {actions.map((action) => (
            <div key={action.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{action.type}</div>
              <div className="text-muted-foreground">{formatDate(action.at)}</div>
              <div className="text-muted-foreground">{action.meta ? JSON.stringify(action.meta) : ""}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
