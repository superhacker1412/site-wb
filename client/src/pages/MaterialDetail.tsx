import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_ORIGIN, toAssetUrl } from "@/lib/api";
import { Material } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favoriteMaterials, toggleFavoriteMaterial } = useAuth();
  const { toast } = useToast();

  const materialQuery = useQuery({
    queryKey: ["material", id],
    queryFn: () => apiFetch<{ material: Material }>(`/materials/${id}`),
    enabled: Boolean(id),
  });

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: () => apiFetch<{ materials: Material[] }>("/materials"),
  });

  const material = materialQuery.data?.material;
  const normalizedContentHtml = useMemo(() => {
    const html = material?.contentHtml || "";
    // Keep DB content portable and resolve backend-hosted uploads at render time.
    return html
      .replace(/src="\/uploads\//g, `src="${API_ORIGIN}/uploads/`)
      .replace(/src='\/uploads\//g, `src='${API_ORIGIN}/uploads/`);
  }, [material?.contentHtml]);

  if (materialQuery.isLoading) {
    return <div className="container py-16 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!material) {
    return (
      <div className="container py-20 text-center">
        <p className="text-xl text-muted-foreground">Material topilmadi</p>
        <Link to="/materiallar"><Button className="mt-4">Ortga qaytish</Button></Link>
      </div>
    );
  }

  const sameCategory = (materialsQuery.data?.materials || []).filter(
    (item) => item.categoryId === material.categoryId,
  );
  const index = sameCategory.findIndex((item) => item.id === material.id);
  const prev = index > 0 ? sameCategory[index - 1] : null;
  const next = index < sameCategory.length - 1 ? sameCategory[index + 1] : null;
  const isFavorite = favoriteMaterials.includes(material.id);

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Ortga
        </Button>
      </div>

      <article>
        {material.imagePath && (
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <img src={toAssetUrl(material.imagePath)} alt={material.title} className="w-full aspect-video object-cover" />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-accent uppercase">{material.category?.name}</span>
            {material.status === "ARCHIVED" && <Badge variant="secondary">Arxiv</Badge>}
          </div>
          <button
            onClick={async () => {
              try {
                await toggleFavoriteMaterial(material.id);
              } catch (error) {
                toast({
                  title: "Saqlashda xatolik",
                  description: error instanceof Error ? error.message : "Xatolik",
                  variant: "destructive",
                });
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            {isFavorite ? "Saqlangan" : "Saqlash"}
          </button>
        </div>

        <h1 className="mb-6 text-3xl font-bold md:text-4xl">{material.title}</h1>
        <div
          className="prose max-w-none prose-img:my-4 prose-table:w-full prose-table:table-auto prose-td:align-top prose-th:align-top"
          dangerouslySetInnerHTML={{ __html: normalizedContentHtml }}
        />
      </article>

      <div className="mt-12 flex justify-between border-t pt-6">
        {prev ? (
          <Link to={`/materiallar/${prev.id}`}>
            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Oldingi</Button>
          </Link>
        ) : <div />}
        {next ? (
          <Link to={`/materiallar/${next.id}`}>
            <Button variant="outline" className="gap-2">Keyingi <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
