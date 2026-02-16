import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Edit3, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { AdminCity, AdminRegion } from "@/pages/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type CitiesResponse = {
  cities: AdminCity[];
};

type RegionsResponse = {
  regions: AdminRegion[];
};

export default function AdminCitiesPage() {
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState("ALL");
  const adminMutation = useAdminMutation();

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<RegionsResponse>("/admin/locations/regions"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", regionId],
    queryFn: () =>
      apiFetch<CitiesResponse>(`/admin/locations/cities${regionId !== "ALL" ? `?regionId=${encodeURIComponent(regionId)}` : ""}`),
  });

  const filtered = useMemo(() => {
    const cities = citiesQuery.data?.cities || [];
    if (!search.trim()) return cities;
    const query = search.trim().toLowerCase();
    return cities.filter((city) => `${city.name} ${city.slug} ${city.region?.name || ""}`.toLowerCase().includes(query));
  }, [citiesQuery.data?.cities, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Shaharlar"
        description="Shaharlar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/cities/new">
              <Building2 className="mr-2 h-4 w-4" />
              Yangi shahar
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nomi yoki slug bo'yicha..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Barcha viloyat</SelectItem>
              {(regionsQuery.data?.regions || []).map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
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
          {filtered.map((city) => (
            <div key={city.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{city.name}</p>
                    {statusBadge(city.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Viloyat: {city.region?.name || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    slug: {city.slug} | Tumanlar: {city._count?.districts || 0} | Foydalanuvchilar: {city._count?.users || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/cities/${city.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={city.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/locations/cities/${city.id}/${city.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {city.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={city.name}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/locations/cities/${city.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Shahar topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
