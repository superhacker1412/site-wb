import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, PlusCircle, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminDirection } from "@/pages/admin/admin-types";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type DirectionsResponse = {
  directions: AdminDirection[];
};

export default function AdminDirectionsPage() {
  const [search, setSearch] = useState("");
  const adminMutation = useAdminMutation();

  const directionsQuery = useQuery({
    queryKey: ["admin", "directions"],
    queryFn: () => apiFetch<DirectionsResponse>("/admin/quiz/directions"),
  });

  const filtered = useMemo(() => {
    const items = directionsQuery.data?.directions || [];
    if (!search.trim()) return items;
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.name} ${item.slug} ${item.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [directionsQuery.data?.directions, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Test yo'nalishlari"
        description="Yo'nalishlar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/directions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yangi yo'nalish
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Qidiruv</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nomi, slug yoki tavsif..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((direction) => (
            <div key={direction.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{direction.icon}</span>
                    <p className="font-semibold">{direction.name}</p>
                    {statusBadge(direction.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{direction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    slug: {direction.slug} | savollar: {direction._count?.questions || 0}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/directions/${direction.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={direction.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/quiz/directions/${direction.id}/${direction.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {direction.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={direction.name}
                    pending={adminMutation.isPending}
                    description={`"${direction.name}" yo'nalishi o'chiriladi va uning barcha savollari ham o'chiriladi.`}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/quiz/directions/${direction.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Yo'nalish topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
