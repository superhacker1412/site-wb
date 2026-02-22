import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Search, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, toAssetUrl } from "@/lib/api";
import { Category, Material } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Materials() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [search, setSearch] = useState("");
  const { favoriteMaterials, toggleFavoriteMaterial } = useAuth();
  const { toast } = useToast();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/categories"),
  });

  const materialsQuery = useQuery({
    queryKey: ["materials", activeCategory, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (search.trim()) params.set("search", search.trim());
      return apiFetch<{ materials: Material[] }>(`/materials?${params.toString()}`);
    },
  });

  const categories = categoriesQuery.data?.categories || [];
  const materials = materialsQuery.data?.materials || [];

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const activeCategoryObj = categories.find((category) => category.id === activeCategory);

  const setCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) params.set("category", categoryId);
    else params.delete("category");
    setSearchParams(params);
  };

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold" data-aos="fade-up">Materiallar</h1>
      <p className="mb-8 text-muted-foreground" data-aos="fade-up" data-aos-delay="70">O'quv materiallari va qiziqarli maqolalar</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" data-aos="fade-up" data-aos-delay="110">
        <Button variant={activeCategory === "" ? "default" : "outline"} size="sm" onClick={() => setCategory("")}>Hammasi</Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(category.id)}
          >
            {category.icon} {category.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" data-aos="fade-right">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Kategoriyalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
             

              {categories.map((category) => {
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategory(category.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span>{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
               <button
                type="button"
                onClick={() => setCategory("")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeCategory === ""
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <BookOpen className="h-4 w-4" />
                Hammasi
              </button>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4" data-aos="fade-up" data-aos-delay="120">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Qidirish..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Topilgan materiallar: {materials.length}</span>
                {activeCategoryObj ? (
                  <Badge variant="outline">{activeCategoryObj.icon} {activeCategoryObj.name}</Badge>
                ) : (
                  <Badge variant="outline">Barcha kategoriyalar</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <p className="text-lg">Hech narsa topilmadi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {materials.map((material, index) => (
                <Card
                  key={material.id}
                  className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                  data-aos="fade-up"
                  data-aos-delay={Math.min(index * 60, 300)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    {material.imagePath ? (
                      <img
                        src={toAssetUrl(material.imagePath)}
                        alt={material.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">Rasm yo'q</div>
                    )}
                    <button
                      onClick={async (event) => {
                        event.preventDefault();
                        try {
                          await toggleFavoriteMaterial(material.id);
                        } catch (error) {
                          toast({
                            title: "Saqlab bo'lmadi",
                            description: error instanceof Error ? error.message : "Xatolik yuz berdi",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="absolute right-3 top-3 rounded-full bg-background/80 p-2 backdrop-blur transition-colors hover:bg-background"
                    >
                      <Star className={cn("h-4 w-4", favoriteMaterials.includes(material.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    </button>
                  </div>

                  <CardContent className="space-y-2 p-5">
                    <div className="text-xs font-medium uppercase text-accent">
                      {categoryMap.get(material.categoryId)?.name || material.categoryId}
                    </div>
                    <h3 className="text-lg font-semibold leading-tight">{material.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>
                    {material.status === "ARCHIVED" ? <Badge variant="secondary">Arxiv</Badge> : null}
                    <Link to={`/materiallar/${material.id}`}>
                      <Button variant="outline" size="sm" className="w-full">O'qish</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
