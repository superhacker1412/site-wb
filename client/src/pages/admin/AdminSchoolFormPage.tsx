import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminCity, AdminDistrict, AdminRegion, AdminSchool } from "@/pages/admin/admin-types";
import { slugify } from "@/pages/admin/location-helpers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SchoolFormState = {
  regionId: string;
  cityId: string;
  districtId: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "ARCHIVED";
};

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

const CITY_EMPTY = "__none__";

export default function AdminSchoolFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<SchoolFormState>({
    regionId: "",
    cityId: CITY_EMPTY,
    districtId: "",
    name: "",
    slug: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<RegionsResponse>("/admin/locations/regions"),
  });

  const schoolsQuery = useQuery({
    queryKey: ["admin", "locations", "schools", "all"],
    queryFn: () => apiFetch<SchoolsResponse>("/admin/locations/schools"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", form.regionId],
    queryFn: () =>
      apiFetch<CitiesResponse>(`/admin/locations/cities${form.regionId ? `?regionId=${encodeURIComponent(form.regionId)}` : ""}`),
    enabled: Boolean(form.regionId),
  });

  const districtsQuery = useQuery({
    queryKey: ["admin", "locations", "districts", form.regionId, form.cityId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("regionId", form.regionId);
      if (form.cityId !== CITY_EMPTY) params.set("cityId", form.cityId);
      return apiFetch<DistrictsResponse>(`/admin/locations/districts?${params.toString()}`);
    },
    enabled: Boolean(form.regionId),
  });

  useEffect(() => {
    if (!isEdit || !id || !schoolsQuery.data?.schools) return;
    const school = schoolsQuery.data.schools.find((item) => item.id === id);
    if (!school || !school.district) return;

    setForm({
      regionId: school.district.region?.id || "",
      cityId: school.district.city?.id || CITY_EMPTY,
      districtId: school.district.id,
      name: school.name,
      slug: school.slug,
      status: school.status,
    });
    setSlugTouched(true);
  }, [id, isEdit, schoolsQuery.data?.schools]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/locations/schools/${id}` : "/admin/locations/schools", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          districtId: form.districtId,
          name: form.name.trim(),
          slug: form.slug.trim(),
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Maktab yangilandi" : "Maktab yaratildi" });
      navigate("/admin/schools");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Amal bajarilmadi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title={isEdit ? "Maktabni tahrirlash" : "Yangi maktab"} description="Maktab ma'lumotlarini kiriting." />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Viloyat</Label>
            <Select
              value={form.regionId}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  regionId: value,
                  cityId: CITY_EMPTY,
                  districtId: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Viloyatni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(regionsQuery.data?.regions || []).map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shahar (ixtiyoriy)</Label>
            <Select
              value={form.cityId}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  cityId: value,
                  districtId: "",
                }))
              }
              disabled={!form.regionId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CITY_EMPTY}>Shaharsiz</SelectItem>
                {(citiesQuery.data?.cities || []).map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tuman</Label>
            <Select value={form.districtId} onValueChange={(value) => setForm((prev) => ({ ...prev, districtId: value }))} disabled={!form.regionId}>
              <SelectTrigger>
                <SelectValue placeholder="Tumanni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(districtsQuery.data?.districts || []).map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Maktab nomi</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => {
                const nextName = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  name: nextName,
                  slug: slugTouched ? prev.slug : slugify(nextName),
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: event.target.value }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as "ACTIVE" | "ARCHIVED" }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Faol</SelectItem>
                <SelectItem value="ARCHIVED">Arxiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/schools")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
