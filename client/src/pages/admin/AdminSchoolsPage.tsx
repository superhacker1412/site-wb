import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, School, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { AdminCity, AdminDistrict, AdminRegion, AdminSchool } from "@/pages/admin/admin-types";
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

type SchoolsResponse = {
  schools: AdminSchool[];
};

export default function AdminSchoolsPage() {
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState("ALL");
  const [cityId, setCityId] = useState("ALL");
  const [districtId, setDistrictId] = useState("ALL");
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
    enabled: regionId !== "ALL",
  });

  const schoolsQuery = useQuery({
    queryKey: ["admin", "locations", "schools", regionId, cityId, districtId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (regionId !== "ALL") params.set("regionId", regionId);
      if (cityId !== "ALL") params.set("cityId", cityId);
      if (districtId !== "ALL") params.set("districtId", districtId);
      const query = params.toString();
      return apiFetch<SchoolsResponse>(`/admin/locations/schools${query ? `?${query}` : ""}`);
    },
  });

  const filtered = useMemo(() => {
    const schools = schoolsQuery.data?.schools || [];
    if (!search.trim()) return schools;
    const query = search.trim().toLowerCase();
    return schools.filter((school) =>
      `${school.name} ${school.slug} ${school.district?.name || ""} ${school.district?.region?.name || ""}`.toLowerCase().includes(query),
    );
  }, [schoolsQuery.data?.schools, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Maktablar"
        description="Maktablar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/schools/new">
              <School className="mr-2 h-4 w-4" />
              Yangi maktab
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 lg:grid-cols-4">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nomi yoki slug bo'yicha..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <Select
            value={regionId}
            onValueChange={(value) => {
              setRegionId(value);
              setCityId("ALL");
              setDistrictId("ALL");
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

          <Select
            value={cityId}
            onValueChange={(value) => {
              setCityId(value);
              setDistrictId("ALL");
            }}
            disabled={regionId === "ALL"}
          >
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

          <Select value={districtId} onValueChange={setDistrictId} disabled={regionId === "ALL"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Barcha tuman</SelectItem>
              {(districtsQuery.data?.districts || []).map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
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
          {filtered.map((school) => (
            <div key={school.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{school.name}</p>
                    {statusBadge(school.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {school.district?.region?.name || "-"} / {school.district?.city?.name || school.district?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    slug: {school.slug} | Foydalanuvchilar: {school._count?.users || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/schools/${school.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={school.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/locations/schools/${school.id}/${school.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {school.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={school.name}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/locations/schools/${school.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Maktab topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
