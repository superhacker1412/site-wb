import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, FolderPlus, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { statusBadge } from "@/pages/admin/admin-ui";
import { AdminCategory } from "@/pages/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DeleteCategoryConfirmButton from "@/components/admin/DeleteCategoryConfirmButton";

type CategoriesResponse = {
  categories: AdminCategory[];
};

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const adminMutation = useAdminMutation();

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/admin/categories"),
  });

  const filtered = useMemo(() => {
    const categories = categoriesQuery.data?.categories || [];
    if (!search.trim()) return categories;
    const query = search.trim().toLowerCase();
    return categories.filter((item) => {
      const haystack = `${item.name} ${item.slug} ${item.icon}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [categoriesQuery.data?.categories, search]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Kategoriyalar"
        description="Kategoriyalar ro'yxati va boshqaruvi."
        actions={
          <Button asChild>
            <Link to="/admin/categories/new">
              <FolderPlus className="mr-2 h-4 w-4" />
              Yangi kategoriya
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
            <Input className="pl-9" placeholder="Nomi yoki slug bo'yicha..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((category) => (
            <div key={category.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <p className="font-semibold">{category.name}</p>
                    {statusBadge(category.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    slug: {category.slug} | materiallar: {category._count?.materials || 0}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Urg'u rangi:</span>
                    <span className="h-4 w-8 rounded border" style={{ backgroundColor: category.color }} />
                    <span>{category.color}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/categories/${category.id}/edit`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={category.status === "ARCHIVED" ? "default" : "secondary"}
                    onClick={() =>
                      adminMutation.mutate({
                        path: `/admin/categories/${category.id}/${category.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                        method: "POST",
                      })
                    }
                    disabled={adminMutation.isPending}
                  >
                    {category.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                  </Button>
                  <DeleteCategoryConfirmButton
                    categoryId={category.id}
                    categoryName={category.name}
                    categories={categoriesQuery.data?.categories || []}
                    pending={adminMutation.isPending}
                    onConfirm={async (payload) => {
                      await adminMutation.mutateAsync({
                        path: `/admin/categories/${category.id}`,
                        method: "DELETE",
                        body: payload,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Kategoriya topilmadi.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
