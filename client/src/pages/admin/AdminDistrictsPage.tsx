import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, Map, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { AdminCity, AdminDistrict, AdminRegion } from "@/pages/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type RegionsResponse = {
  regions: AdminRegion[];
};

type CitiesResponse = {
  cities: AdminCity[];
};

type DistrictsResponse = {
  districts: AdminDistrict[];
};

export default function AdminDistrictsPage() {
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState("ALL");
  const [cityId, setCityId] = useState("ALL");
  const adminMutation = useAdminMutation();

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<RegionsResponse>("/admin/locations/regions"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", regionId],
    queryFn: () =>
      apiFetch<CitiesResponse>(`/admin/locations/cities${regionId !== "ALL" ? `?regionId=${encodeURIComponent(regionId)}` : ""}`),
    enabled: regionId !== "ALL",
  });

  const districtsQuery = useQuery({
    queryKey: ["admin", "locations", "districts", regionId, cityId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (regionId !== "ALL") params.set("regionId", regionId);
      if (cityId !== "ALL") params.set("cityId", cityId);
      const query = params.toString();
      return apiFetch<DistrictsResponse>(`/admin/locations/districts${query ? `?${query}` : ""}`);
    },
  });

  const filtered = useMemo(() => {
    const districts = districtsQuery.data?.districts || [];
    if (!search.trim()) return districts;
    const query = search.trim().toLowerCase();
    return districts.filter((district) =>
      `${district.name} ${district.slug} ${district.region?.name || ""} ${district.city?.name || ""}`.toLowerCase().includes(query),
    );
  }, [districtsQuery.data?.districts, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Tumanlar"
        description="Tumanlar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/districts/new">
              <Map className="mr-2 h-4 w-4" />
              Yangi tuman
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nomi yoki slug bo'yicha..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <Select
            value={regionId}
            onValueChange={(value) => {
              setRegionId(value);
              setCityId("ALL");
            }}
          >
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

          <Select value={cityId} onValueChange={setCityId} disabled={regionId === "ALL"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Barcha shahar</SelectItem>
              {(citiesQuery.data?.cities || []).map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
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
          {filtered.map((district) => (
            <div key={district.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{district.name}</p>
                    {statusBadge(district.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Viloyat: {district.region?.name || "-"} | Shahar: {district.city?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    slug: {district.slug} | Maktablar: {district._count?.schools || 0} | Foydalanuvchilar: {district._count?.users || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/districts/${district.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={district.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/locations/districts/${district.id}/${district.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {district.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={district.name}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/locations/districts/${district.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Tuman topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
