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
  const [docImagesTotal, setDocImagesTotal] = useState<number>(0);
  const [docLastSummary, setDocLastSummary] = useState<string>("");
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const htmInputRef = useRef<HTMLInputElement | null>(null);
  const htmFolderInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedHtmFile, setSelectedHtmFile] = useState<File | null>(null);
  const [selectedHtmFolderFiles, setSelectedHtmFolderFiles] = useState<FileList | null>(null);
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

  const decodeText = (buffer: ArrayBuffer): string => {
    // Word “Web Page, Filtered” often uses windows-1251.
    try {
      // @ts-expect-error - some TS libdefs omit legacy encodings, runtime supports it in modern browsers.
      return new TextDecoder("windows-1251").decode(buffer);
    } catch {
      return new TextDecoder("utf-8").decode(buffer);
    }
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

  const importWordHtm = async (htmFile: File, folderFiles: FileList): Promise<string> => {
    const htmBuffer = await htmFile.arrayBuffer();
    const htmlText = decodeText(htmBuffer);

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const normalizeWordImgSrc = (src: string): string => {
      let s = (src || "").trim();
      if (!s) return "";
      s = s.replace(/\\/g, "/");
      // Strip query/hash
      s = s.split("#")[0]?.split("?")[0] || s;
      // Remove leading "./"
      s = s.replace(/^\.\//, "");
      // Some exports may include file:///
      s = s.replace(/^file:\/\/\/+/i, "");
      // Decode URI-encoded paths if possible
      try {
        s = decodeURIComponent(s);
      } catch {
        // ignore
      }
      return s;
    };

    const fileMap = new Map<string, File>();
    const fileMapLower = new Map<string, File>();
    const fileByBaseLower = new Map<string, File>();
    Array.from(folderFiles).forEach((f) => {
      // When selecting a directory, browsers provide webkitRelativePath.
      const rel = (f as any).webkitRelativePath as string | undefined;
      if (rel) {
        const normalizedRel = rel.replace(/\\/g, "/");
        fileMap.set(normalizedRel, f);
        fileMapLower.set(normalizedRel.toLowerCase(), f);
      }
      fileMap.set(f.name, f);
      fileMapLower.set(f.name.toLowerCase(), f);
      fileByBaseLower.set(f.name.toLowerCase(), f);
    });

    const imgs = Array.from(doc.querySelectorAll("img"));
    setDocImagesTotal(imgs.length);
    setDocUploadedImagesCount(0);
    setDocProgressText(`HTM import: rasmlar topildi: ${imgs.length}`);

    let uploaded = 0;
    for (const img of imgs) {
      const srcRaw = img.getAttribute("src") || "";
      const src = normalizeWordImgSrc(srcRaw);
      if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:") || src.startsWith("/uploads/")) {
        continue;
      }

      // Word exports like "1-Dars.files/image001.jpg". Try exact match, then basename.
      const normalized = src.replace(/\\/g, "/");
      const normalizedLower = normalized.toLowerCase();
      const basename = normalized.split("/").pop() || normalized;
      const basenameLower = basename.toLowerCase();
      const file =
        fileMap.get(normalized) ||
        fileMapLower.get(normalizedLower) ||
        fileMap.get(basename) ||
        fileMapLower.get(basenameLower) ||
        fileByBaseLower.get(basenameLower) ||
        Array.from(folderFiles).find((f) => {
          const rel = ((f as any).webkitRelativePath as string | undefined) || "";
          return rel.replace(/\\/g, "/").toLowerCase().endsWith("/" + basenameLower);
        }) ||
        null;

      if (!file) continue;

      setDocProgressText(`Rasmlar yuklanmoqda... (${uploaded}/${imgs.length})`);
      try {
        const relativePath = await uploadImageToBackend(file, file.name);
        img.setAttribute("src", relativePath);
        uploaded += 1;
        setDocUploadedImagesCount(uploaded);
        setDocProgressText(`Rasmlar yuklanmoqda... (yuklandi: ${uploaded}/${imgs.length})`);
      } catch {
        // leave src as-is if upload fails
      }
    }

    const bodyInner = doc.body?.innerHTML || "<p></p>";
    setDocLastSummary(`HTM import tugadi. Rasmlar: ${uploaded}/${imgs.length}`);
    return bodyInner;
  };

  const improveImportedHtmlLayout = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const isMeaningfulTextForImageRow = (text: string): boolean => {
        // Treat Word separators like commas/nbsp/bullets as "not meaningful"
        const normalized = (text || "")
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          // remove common separators
          .replace(/[,\.;:|·•]+/g, "")
          // remove leftover spaces
          .replace(/\s+/g, "");
        return normalized.length > 0;
      };

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
        if (isMeaningfulTextForImageRow(text)) return;

        const wrapper = doc.createElement("div");
        const cols = Math.min(imgs.length, 4);
        wrapper.className = `docx-image-row docx-image-row--${cols}`;
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
                  setDocLastSummary("");
                  setDocUploadedImagesCount(0);
                  setDocImagesTotal(0);
                  setDocProgressText("DOCX import boshlanmoqda...");
                  const html = await convertDocxToHtml(file);
                  const improved = improveImportedHtmlLayout(html);
                  setForm((prev) => ({ ...prev, contentHtml: improved }));
                  setDocLastSummary(`DOCX import tugadi. Rasmlar yuklandi: ${docUploadedImagesCount}`);
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
                {docProgressText || "Import qilinmoqda..."}{" "}
                {docImagesTotal > 0 ? `(rasmlar: ${docUploadedImagesCount}/${docImagesTotal})` : docUploadedImagesCount > 0 ? `(rasmlar: ${docUploadedImagesCount})` : ""}
              </div>
            ) : null}
            {!docConverting && docLastSummary ? (
              <div className="text-sm text-muted-foreground">{docLastSummary}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Word HTM (Web Page) import</Label>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">1) .htm fayl</div>
                <Input
                  ref={htmInputRef}
                  type="file"
                  accept=".htm,.html,text/html"
                  onChange={(event) => {
                    const htm = event.target.files?.[0] || null;
                    setSelectedHtmFile(htm);
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">2) .files papka (rasmlar)</div>
                <input
                  ref={htmFolderInputRef}
                  type="file"
                  multiple
                  // @ts-expect-error - non-standard attribute supported by Chromium-based browsers.
                  webkitdirectory=""
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  onChange={(event) => {
                    setSelectedHtmFolderFiles(event.target.files && event.target.files.length > 0 ? event.target.files : null);
                  }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Word'da <b>Save As → Web Page, Filtered (*.htm)</b> qiling. Keyin .htm fayl va yonidagi <code>*.files</code> papkani tanlang.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={docConverting || !selectedHtmFile || !selectedHtmFolderFiles || selectedHtmFolderFiles.length === 0}
                onClick={async () => {
                  if (!selectedHtmFile || !selectedHtmFolderFiles || selectedHtmFolderFiles.length === 0) return;
                  try {
                    setDocConverting(true);
                    setDocLastSummary("");
                    setDocUploadedImagesCount(0);
                    setDocImagesTotal(0);
                    setDocProgressText("HTM import boshlanmoqda...");
                    const html = await importWordHtm(selectedHtmFile, selectedHtmFolderFiles);
                    const improved = improveImportedHtmlLayout(html);
                    setForm((prev) => ({ ...prev, contentHtml: improved }));
                    toast({ title: "HTM import qilindi", description: "Kontent (HTML) maydoniga joylandi." });
                  } catch (error) {
                    toast({
                      title: "HTM import xatolik",
                      description: error instanceof Error ? error.message : "Amal bajarilmadi",
                      variant: "destructive",
                    });
                  } finally {
                    setDocConverting(false);
                    setDocProgressText("");
                  }
                }}
              >
                Obработать
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={docConverting}
                onClick={() => {
                  setSelectedHtmFile(null);
                  setSelectedHtmFolderFiles(null);
                  if (htmInputRef.current) htmInputRef.current.value = "";
                  if (htmFolderInputRef.current) htmFolderInputRef.current.value = "";
                  setDocLastSummary("");
                  setDocProgressText("");
                  setDocImagesTotal(0);
                  setDocUploadedImagesCount(0);
                }}
              >
                Tozalash
              </Button>
            </div>

            {docConverting ? (
              <div className="text-sm text-muted-foreground">
                {docProgressText || "Import qilinmoqda..."}{" "}
                {docImagesTotal > 0 ? `(rasmlar: ${docUploadedImagesCount}/${docImagesTotal})` : docUploadedImagesCount > 0 ? `(rasmlar: ${docUploadedImagesCount})` : ""}
              </div>
            ) : null}
            {!docConverting && docLastSummary ? (
              <div className="text-sm text-muted-foreground">{docLastSummary}</div>
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
