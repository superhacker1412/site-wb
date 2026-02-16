import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ImageUploadFieldProps = {
  value?: string | null;
  onChange: (path: string) => void;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export default function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast({
        title: "Fayl juda katta",
        description: `Maksimal hajm: ${formatBytesToMb(MAX_IMAGE_BYTES)}`,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await apiFetch<{ file: { relativePath: string } }>("/admin/uploads", {
        method: "POST",
        body: formData,
      });
      onChange(response.file.relativePath);
      toast({ title: "Rasm yuklandi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Yuklashda xatolik";
      toast({ title: "Xatolik", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Rasm URL yoki /uploads/..."
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void handleUpload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={uploading}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Yuklanmoqda..." : "Yuklash"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Oblozhka rasmi uchun maksimal hajm: {formatBytesToMb(MAX_IMAGE_BYTES)}.</p>
    </div>
  );
}
