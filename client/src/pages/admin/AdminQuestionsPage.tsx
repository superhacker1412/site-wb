import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, PlusCircle, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminDirection, AdminQuestion } from "@/pages/admin/admin-types";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { statusBadge } from "@/pages/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type DirectionsResponse = {
  directions: AdminDirection[];
};

type QuestionsResponse = {
  questions: AdminQuestion[];
};

export default function AdminQuestionsPage() {
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const initialDirection = searchParams.get("directionId") || "ALL";
  const [directionFilter, setDirectionFilter] = useState(initialDirection);
  const adminMutation = useAdminMutation();

  const directionsQuery = useQuery({
    queryKey: ["admin", "directions"],
    queryFn: () => apiFetch<DirectionsResponse>("/admin/quiz/directions"),
  });

  const questionsQuery = useQuery({
    queryKey: ["admin", "questions", directionFilter],
    queryFn: () =>
      apiFetch<QuestionsResponse>(
        `/admin/quiz/questions${directionFilter !== "ALL" ? `?directionId=${encodeURIComponent(directionFilter)}` : ""}`,
      ),
  });

  const directionNameMap = useMemo(
    () => new Map((directionsQuery.data?.directions || []).map((item) => [item.id, item.name])),
    [directionsQuery.data?.directions],
  );

  const filtered = useMemo(() => {
    const items = questionsQuery.data?.questions || [];
    if (!search.trim()) return items;
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const directionName = directionNameMap.get(item.directionId || "") || "";
      const haystack = `${item.questionText} ${directionName} ${item.type}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [directionNameMap, questionsQuery.data?.questions, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Test savollari"
        description="Savollar ro'yxati, yo'nalish bo'yicha filtrlash va boshqaruv."
        actions={
          <Button asChild>
            <Link to={directionFilter !== "ALL" ? `/admin/questions/new?directionId=${directionFilter}` : "/admin/questions/new"}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yangi savol
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_250px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Savol matni yoki turi..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Barcha yo'nalishlar</SelectItem>
              {(directionsQuery.data?.directions || []).map((direction) => (
                <SelectItem key={direction.id} value={direction.id}>
                  {direction.icon} {direction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((question) => (
            <div key={question.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{question.questionText}</p>
                  <p className="text-xs text-muted-foreground">
                    {directionNameMap.get(question.directionId || "") || question.directionId} | {question.type} | tartib: {question.orderIndex}
                  </p>
                  <div className="mt-1 text-xs">{statusBadge(question.status)}</div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/questions/${question.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={question.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/quiz/questions/${question.id}/${question.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {question.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={question.questionText}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/quiz/questions/${question.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Savol topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
