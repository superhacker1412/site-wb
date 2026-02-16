import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, FilePlus2, Search } from "lucide-react";

import { apiFetch, toAssetUrl } from "@/lib/api";
import { statusBadge } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminCategory, AdminMaterial } from "@/pages/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type MaterialsResponse = {
  materials: AdminMaterial[];
};

type CategoriesResponse = {
  categories: AdminCategory[];
};

export default function AdminMaterialsPage() {
  const [search, setSearch] = useState("");
  const adminMutation = useAdminMutation();

  const materialsQuery = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: () => apiFetch<MaterialsResponse>("/admin/materials"),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/admin/categories"),
  });

  const categoryNameMap = useMemo(
    () => new Map((categoriesQuery.data?.categories || []).map((item) => [item.id, item.name])),
    [categoriesQuery.data?.categories],
  );

  const filtered = useMemo(() => {
    const items = materialsQuery.data?.materials || [];
    if (!search.trim()) return items;
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const categoryName = categoryNameMap.get(item.categoryId) || "";
      const haystack = `${item.title} ${item.description} ${categoryName}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [categoryNameMap, materialsQuery.data?.materials, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Materiallar"
        description="Materiallar ro'yxati, tahrirlash va arxiv boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/materials/new">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Yangi material
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
            <Input className="pl-9" placeholder="Sarlavha, tavsif yoki kategoriya..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((material) => (
            <div key={material.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {material.imagePath ? (
                    <img src={toAssetUrl(material.imagePath)} alt={material.title} className="h-16 w-24 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded-md border text-xs text-muted-foreground">Rasm yo'q</div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{material.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Kategoriya: {categoryNameMap.get(material.categoryId) || material.categoryId}
                    </div>
                    <div className="mt-1 text-xs">{statusBadge(material.status)}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/materials/${material.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={material.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/materials/${material.id}/${material.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {material.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteConfirmButton
                    entityTitle={material.title}
                    pending={adminMutation.isPending}
                    onConfirm={async () => {
                      await adminMutation.mutateAsync({
                        path: `/admin/materials/${material.id}`,
                        method: "DELETE",
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Material topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
