import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, MapPinned, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { AdminRegion } from "@/pages/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type RegionsResponse = {
  regions: AdminRegion[];
};

export default function AdminRegionsPage() {
  const [search, setSearch] = useState("");
  const adminMutation = useAdminMutation();

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<RegionsResponse>("/admin/locations/regions"),
  });

  const filtered = useMemo(() => {
    const regions = regionsQuery.data?.regions || [];
    if (!search.trim()) return regions;
    const query = search.trim().toLowerCase();
    return regions.filter((region) => `${region.name} ${region.slug}`.toLowerCase().includes(query));
  }, [regionsQuery.data?.regions, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Viloyatlar"
        description="Viloyatlar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/regions/new">
              <MapPinned className="mr-2 h-4 w-4" />
              Yangi viloyat
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
            <Input className="pl-9" placeholder="Nomi yoki slug bo'yicha..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((region) => (
            <div key={region.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{region.name}</p>
                    {statusBadge(region.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">slug: {region.slug}</p>
                  <p className="text-xs text-muted-foreground">
                    Shaharlar: {region._count?.cities || 0} | Tumanlar: {region._count?.districts || 0} | Foydalanuvchilar: {region._count?.users || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/regions/${region.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={region.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/locations/regions/${region.id}/${region.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {region.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={region.name}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/locations/regions/${region.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Viloyat topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
