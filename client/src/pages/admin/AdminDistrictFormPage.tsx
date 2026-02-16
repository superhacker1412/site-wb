import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminCity, AdminDistrict, AdminRegion } from "@/pages/admin/admin-types";
import { slugify } from "@/pages/admin/location-helpers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DistrictFormState = {
  regionId: string;
  cityId: string;
  name: string;
  slug: string;
  soatoId: string;
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

const EMPTY_CITY = "__none__";

export default function AdminDistrictFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<DistrictFormState>({
    regionId: "",
    cityId: EMPTY_CITY,
    name: "",
    slug: "",
    soatoId: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<{ regions: AdminRegion[] }>("/admin/locations/regions"),
  });

  const districtsQuery = useQuery({
    queryKey: ["admin", "locations", "districts", "all"],
    queryFn: () => apiFetch<DistrictsResponse>("/admin/locations/districts"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", form.regionId],
    queryFn: () =>
      apiFetch<CitiesResponse>(`/admin/locations/cities${form.regionId ? `?regionId=${encodeURIComponent(form.regionId)}` : ""}`),
    enabled: Boolean(form.regionId),
  });

  useEffect(() => {
    if (!isEdit || !id || !districtsQuery.data?.districts) return;
    const district = districtsQuery.data.districts.find((item) => item.id === id);
    if (!district) return;
    setForm({
      regionId: district.regionId,
      cityId: district.cityId || EMPTY_CITY,
      name: district.name,
      slug: district.slug,
      soatoId: district.soatoId ? String(district.soatoId) : "",
      status: district.status,
    });
    setSlugTouched(true);
  }, [districtsQuery.data?.districts, id, isEdit]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/locations/districts/${id}` : "/admin/locations/districts", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          regionId: form.regionId,
          cityId: form.cityId === EMPTY_CITY ? null : form.cityId,
          name: form.name.trim(),
          slug: form.slug.trim(),
          soatoId: form.soatoId ? Number(form.soatoId) : undefined,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Tuman yangilandi" : "Tuman yaratildi" });
      navigate("/admin/districts");
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
      <AdminPageHeader title={isEdit ? "Tumanni tahrirlash" : "Yangi tuman"} description="Tuman ma'lumotlarini kiriting." />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Viloyat</Label>
            <Select value={form.regionId} onValueChange={(value) => setForm((prev) => ({ ...prev, regionId: value, cityId: EMPTY_CITY }))}>
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
              onValueChange={(value) => setForm((prev) => ({ ...prev, cityId: value }))}
              disabled={!form.regionId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_CITY}>Shaharsiz</SelectItem>
                {(citiesQuery.data?.cities || []).map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nomi</Label>
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
            <Label htmlFor="soatoId">SOATO ID (ixtiyoriy)</Label>
            <Input
              id="soatoId"
              value={form.soatoId}
              onChange={(event) => setForm((prev) => ({ ...prev, soatoId: event.target.value }))}
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
            <Button variant="outline" onClick={() => navigate("/admin/districts")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
