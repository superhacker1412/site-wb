import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import mammoth from "mammoth";

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
  const [docConverting, setDocConverting] = useState(false);
  const [docProgressText, setDocProgressText] = useState<string>("");
  const [docUploadedImagesCount, setDocUploadedImagesCount] = useState(0);
  const docInputRef = useRef<HTMLInputElement | null>(null);
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

  const fileFromContentType = (contentType: string | undefined): { ext: string; mime: string } => {
    const ct = (contentType || "").toLowerCase();
    if (ct === "image/jpeg") return { ext: "jpg", mime: "image/jpeg" };
    if (ct === "image/png") return { ext: "png", mime: "image/png" };
    if (ct === "image/gif") return { ext: "gif", mime: "image/gif" };
    if (ct === "image/webp") return { ext: "webp", mime: "image/webp" };
    if (ct === "image/avif") return { ext: "avif", mime: "image/avif" };
    if (ct === "image/bmp") return { ext: "bmp", mime: "image/bmp" };
    if (ct === "image/svg+xml") return { ext: "svg", mime: "image/svg+xml" };
    return { ext: "png", mime: "image/png" };
  };

  const fileFromMagicBytes = (bytes: Uint8Array): { ext: string; mime: string } | null => {
    // PNG
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { ext: "png", mime: "image/png" };
    }

    // JPEG
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { ext: "jpg", mime: "image/jpeg" };
    }

    // GIF
    if (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    ) {
      return { ext: "gif", mime: "image/gif" };
    }

    // WEBP: "RIFF" .... "WEBP"
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { ext: "webp", mime: "image/webp" };
    }

    // BMP: "BM"
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return { ext: "bmp", mime: "image/bmp" };
    }

    return null;
  };

  const toBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const uploadImageToBackend = async (blob: Blob, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", new File([blob], filename, { type: blob.type || "application/octet-stream" }));
    const response = await apiFetch<{ file: { relativePath: string } }>("/admin/uploads", {
      method: "POST",
      body: formData,
    });
    return response.file.relativePath;
  };

  const convertDocxToHtml = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    setDocProgressText("DOCX o'qilmoqda va HTML ga o'girilmoqda...");
    let uploadedImages = 0;

    const mammothAny = mammoth as unknown as {
      convertToHtml: typeof mammoth.convertToHtml;
      images: { inline: (cb: (image: any) => Promise<{ src: string }>) => any };
    };

    const result = await mammothAny.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammothAny.images.inline(async (image) => {
          setDocProgressText((prev) => prev || "Rasmlar yuklanmoqda...");
          const bytes = (await image.read()) as ArrayBuffer | Uint8Array;
          const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
          const byMagic = fileFromMagicBytes(uint8);
          const byType = fileFromContentType(image?.contentType as string | undefined);
          const chosen = byMagic || byType;

          // Try uploading to backend for supported browser-image formats.
          // If upload fails or the format is not accepted by backend, fall back to data URL (still visible).
          try {
            const blob = new Blob([uint8], { type: chosen.mime });
            const relativePath = await uploadImageToBackend(blob, `docx-image.${chosen.ext}`);
            uploadedImages += 1;
            setDocUploadedImagesCount(uploadedImages);
            setDocProgressText(`Rasmlar yuklanmoqda... (yuklandi: ${uploadedImages})`);
            return { src: relativePath };
          } catch {
            const contentType = (image?.contentType as string | undefined) || chosen.mime || "application/octet-stream";
            const base64 = toBase64(uint8);
            uploadedImages += 1;
            setDocUploadedImagesCount(uploadedImages);
            setDocProgressText(`Rasmlar tayyorlanmoqda... (yuklandi: ${uploadedImages})`);
            return { src: `data:${contentType};base64,${base64}` };
          }
        }),
      },
    );

    return result.value || "<p></p>";
  };

  const improveImportedHtmlLayout = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Ensure images are responsive by default.
      doc.querySelectorAll("img").forEach((img) => {
        const existing = img.getAttribute("style") || "";
        const needsMax = !/max-width\s*:/i.test(existing);
        const needsHeight = !/height\s*:/i.test(existing);
        const nextStyle = [
          existing.trim(),
          needsMax ? "max-width:100%;" : "",
          needsHeight ? "height:auto;" : "",
        ]
          .filter(Boolean)
          .join(existing.trim() ? ";" : "");
        if (nextStyle.trim()) img.setAttribute("style", nextStyle);
      });

      // 1) If a paragraph contains 2+ images and no meaningful text -> turn into a grid row.
      doc.querySelectorAll("p").forEach((p) => {
        const imgs = Array.from(p.querySelectorAll("img"));
        if (imgs.length < 2) return;
        const text = (p.textContent || "").replace(/\s+/g, " ").trim();
        if (text.length > 0) return;

        const wrapper = doc.createElement("div");
        wrapper.className = "docx-image-row";
        imgs.forEach((img) => {
          // Ensure images behave like tiles; CSS handles the actual layout.
          const existing = img.getAttribute("style") || "";
          if (!/width\s*:/i.test(existing)) {
            img.setAttribute("style", `${existing}${existing.trim() ? ";" : ""}width:100%;height:auto;`);
          }
          wrapper.appendChild(img);
        });

        p.replaceWith(wrapper);
      });

      // 2) If a paragraph contains an image + text, float the image left (Word-like).
      doc.querySelectorAll("p").forEach((p) => {
        const imgs = Array.from(p.querySelectorAll("img"));
        if (imgs.length !== 1) return;
        const img = imgs[0];
        const text = (p.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) return;

        const existing = img.getAttribute("style") || "";
        if (!/float\s*:/i.test(existing)) {
          img.setAttribute(
            "style",
            `${existing}${existing.trim() ? ";" : ""}float:left;margin:0 12px 12px 0;max-width:50%;height:auto;`,
          );
        }
      });

      return doc.body.innerHTML || html;
    } catch {
      return html;
    }
  };

  const onSubmit = async () => {
    try {
      setSaving(true);
      await apiFetch<{ material: AdminMaterial }>(isEdit ? `/admin/materials/${id}` : "/admin/materials", {
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
      setDocConverting(false);
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
            <Label>Word fayl (.docx)</Label>
            <Input
              ref={docInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (event) => {
                const file = event.target.files?.[0] || null;
                if (!file) return;
                try {
                  setDocConverting(true);
                  setDocUploadedImagesCount(0);
                  setDocProgressText("DOCX import boshlanmoqda...");
                  const html = await convertDocxToHtml(file);
                  const improved = improveImportedHtmlLayout(html);
                  setForm((prev) => ({ ...prev, contentHtml: improved }));
                  toast({ title: "DOCX import qilindi", description: "Kontent (HTML) maydoniga joylandi." });
                } catch (error) {
                  toast({
                    title: "DOCX import xatolik",
                    description: error instanceof Error ? error.message : "Amal bajarilmadi",
                    variant: "destructive",
                  });
                } finally {
                  setDocConverting(false);
                  setDocProgressText("");
                  event.target.value = "";
                }
              }}
            />
            <div className="text-sm text-muted-foreground">
              DOCX tanlasangiz, kontent avtomatik HTML ga o'giriladi va editorga joylanadi (rasmlar ham).
            </div>
            {docConverting ? (
              <div className="text-sm text-muted-foreground">
                {docProgressText || "Import qilinmoqda..."} {docUploadedImagesCount > 0 ? `(rasmlar: ${docUploadedImagesCount})` : ""}
              </div>
            ) : null}
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
            <Button onClick={onSubmit} disabled={saving || docConverting}>
              {saving || docConverting ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
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
