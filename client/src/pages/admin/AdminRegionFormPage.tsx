import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminRegion } from "@/pages/admin/admin-types";
import { slugify } from "@/pages/admin/location-helpers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RegionFormState = {
  name: string;
  slug: string;
  soatoId: string;
  status: "ACTIVE" | "ARCHIVED";
};

type RegionsResponse = {
  regions: AdminRegion[];
};

export default function AdminRegionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<RegionFormState>({
    name: "",
    slug: "",
    soatoId: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<RegionsResponse>("/admin/locations/regions"),
  });

  useEffect(() => {
    if (!isEdit || !id || !regionsQuery.data?.regions) return;
    const region = regionsQuery.data.regions.find((item) => item.id === id);
    if (!region) return;
    setForm({
      name: region.name,
      slug: region.slug,
      soatoId: region.soatoId ? String(region.soatoId) : "",
      status: region.status,
    });
    setSlugTouched(true);
  }, [id, isEdit, regionsQuery.data?.regions]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/locations/regions/${id}` : "/admin/locations/regions", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          name: form.name.trim(),
          slug: form.slug.trim(),
          soatoId: form.soatoId ? Number(form.soatoId) : undefined,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Viloyat yangilandi" : "Viloyat yaratildi" });
      navigate("/admin/regions");
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
      <AdminPageHeader title={isEdit ? "Viloyatni tahrirlash" : "Yangi viloyat"} description="Viloyat ma'lumotlarini kiriting." />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
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
            <Button variant="outline" onClick={() => navigate("/admin/regions")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
