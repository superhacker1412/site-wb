import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminCategory, AdminMaterial } from "@/pages/admin/admin-types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploadField from "@/components/admin/ImageUploadField";

type MaterialsResponse = {
  materials: AdminMaterial[];
};

type CategoriesResponse = {
  categories: AdminCategory[];
};

type MaterialFormState = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  imagePath: string;
  contentHtml: string;
  status: "ACTIVE" | "ARCHIVED";
};

export default function AdminMaterialFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MaterialFormState>({
    id: "",
    categoryId: "",
    title: "",
    description: "",
    imagePath: "",
    contentHtml: "<p></p>",
    status: "ACTIVE",
  });

  const materialsQuery = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: () => apiFetch<MaterialsResponse>("/admin/materials"),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/admin/categories"),
  });

  useEffect(() => {
    if (!isEdit || !id || !materialsQuery.data?.materials) return;
    const material = materialsQuery.data.materials.find((item) => item.id === id);
    if (!material) return;
    setForm({
      id: material.id,
      categoryId: material.categoryId,
      title: material.title,
      description: material.description,
      imagePath: material.imagePath || "",
      contentHtml: material.contentHtml,
      status: material.status,
    });
  }, [id, isEdit, materialsQuery.data?.materials]);

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/materials/${id}` : "/admin/materials", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          ...(isEdit ? {} : { id: form.id || undefined }),
          categoryId: form.categoryId,
          title: form.title,
          description: form.description,
          imagePath: form.imagePath || null,
          contentHtml: form.contentHtml,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Material yangilandi" : "Material yaratildi" });
      navigate("/admin/materials");
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
        title={isEdit ? "Materialni tahrirlash" : "Yangi material"}
        description={isEdit ? "Mavjud materialni yangilang." : "Yangi material yarating."}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          {!isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="id">ID (ixtiyoriy)</Label>
              <Input id="id" value={form.id} onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Kategoriya</Label>
            <Select value={form.categoryId} onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Kategoriya tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(categoriesQuery.data?.categories || []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Sarlavha</Label>
            <Input id="title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Qisqa tavsif</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Rasm (oblozhka, max 10 MB)</Label>
            <ImageUploadField value={form.imagePath} onChange={(imagePath) => setForm((prev) => ({ ...prev, imagePath }))} />
          </div>

          <div className="space-y-2">
            <Label>Kontent (HTML)</Label>
            <RichTextEditor value={form.contentHtml} onChange={(contentHtml) => setForm((prev) => ({ ...prev, contentHtml }))} />
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

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/materials")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
