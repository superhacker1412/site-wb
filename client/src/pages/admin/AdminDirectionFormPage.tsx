import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminDirection } from "@/pages/admin/admin-types";
import { buildIconOptions, DIRECTION_ICON_OPTIONS } from "@/pages/admin/icon-options";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DirectionsResponse = {
  directions: AdminDirection[];
};

type DirectionFormState = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  status: "ACTIVE" | "ARCHIVED";
};

export default function AdminDirectionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DirectionFormState>({
    id: "",
    slug: "",
    name: "",
    icon: DIRECTION_ICON_OPTIONS[0].value,
    description: "",
    status: "ACTIVE",
  });

  const directionsQuery = useQuery({
    queryKey: ["admin", "directions"],
    queryFn: () => apiFetch<DirectionsResponse>("/admin/quiz/directions"),
  });

  const iconOptions = useMemo(() => buildIconOptions(DIRECTION_ICON_OPTIONS, form.icon), [form.icon]);

  useEffect(() => {
    if (!isEdit || !id || !directionsQuery.data?.directions) return;
    const direction = directionsQuery.data.directions.find((item) => item.id === id);
    if (!direction) return;
    setForm({
      id: direction.id,
      slug: direction.slug,
      name: direction.name,
      icon: direction.icon,
      description: direction.description,
      status: direction.status,
    });
  }, [directionsQuery.data?.directions, id, isEdit]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/quiz/directions/${id}` : "/admin/quiz/directions", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          ...(isEdit ? {} : { id: form.id || undefined }),
          slug: form.slug,
          name: form.name,
          icon: form.icon,
          description: form.description,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Yo'nalish yangilandi" : "Yo'nalish yaratildi" });
      navigate("/admin/directions");
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
      <AdminPageHeader
        title={isEdit ? "Yo'nalishni tahrirlash" : "Yangi yo'nalish"}
        description={isEdit ? "Mavjud yo'nalishni yangilang." : "Yangi yo'nalish qo'shing."}
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          {!isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="id">ID (ixtiyoriy)</Label>
              <Input id="id" value={form.id} onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={form.icon} onValueChange={(value) => setForm((prev) => ({ ...prev, icon: value }))}>
              <SelectTrigger id="icon">
                <SelectValue placeholder="Ikonka tanlang" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="mr-2">{option.value}</span>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Tavsif</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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

          <div className="md:col-span-2 flex items-center gap-3 rounded-lg border p-3">
            <div className="text-2xl">{form.icon || "\u{1F4D8}"}</div>
            <div>
              <p className="font-medium">{form.name || "Yo'nalish nomi"}</p>
              <p className="text-sm text-muted-foreground">/{form.slug || "slug"}</p>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/directions")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

