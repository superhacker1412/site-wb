import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminCategory } from "@/pages/admin/admin-types";
import { buildIconOptions, CATEGORY_ICON_OPTIONS } from "@/pages/admin/icon-options";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CategoryFormState = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  status: "ACTIVE" | "ARCHIVED";
};

type CategoriesResponse = {
  categories: AdminCategory[];
};

export default function AdminCategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<CategoryFormState>({
    id: "",
    slug: "",
    name: "",
    icon: CATEGORY_ICON_OPTIONS[0].value,
    color: "#0ea5e9",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/admin/categories"),
  });

  const iconOptions = useMemo(() => buildIconOptions(CATEGORY_ICON_OPTIONS, form.icon), [form.icon]);

  useEffect(() => {
    if (!isEdit || !id || !categoriesQuery.data?.categories) return;
    const category = categoriesQuery.data.categories.find((item) => item.id === id);
    if (!category) return;
    setForm({
      id: category.id,
      slug: category.slug,
      name: category.name,
      icon: category.icon,
      color: category.color || "#0ea5e9",
      status: category.status,
    });
  }, [categoriesQuery.data?.categories, id, isEdit]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/categories/${id}` : "/admin/categories", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          ...(isEdit ? {} : { id: form.id || undefined }),
          slug: form.slug,
          name: form.name,
          icon: form.icon,
          color: form.color,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Kategoriya yangilandi" : "Kategoriya yaratildi" });
      navigate("/admin/categories");
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
        title={isEdit ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
        description={isEdit ? "Mavjud kategoriyani yangilang." : "Yangi kategoriya yarating."}
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

          <div className="space-y-2">
            <Label htmlFor="color">Accent color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              />
              <Input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#0ea5e9"}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                className="h-10 w-14 p-1"
              />
            </div>
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

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="text-2xl">{form.icon || "\u{1F4C1}"}</div>
            <div>
              <p className="font-medium">{form.name || "Kategoriya nomi"}</p>
              <p className="text-sm text-muted-foreground">/{form.slug || "slug"}</p>
            </div>
            <span className="ml-auto h-5 w-10 rounded border" style={{ backgroundColor: form.color }} />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/categories")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

