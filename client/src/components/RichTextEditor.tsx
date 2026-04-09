import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_ORIGIN } from "@/lib/api";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function normalizeEditorHtml(html: string): string {
  if (!html) return "<p></p>";
  return html
    .replace(/src="\/uploads\//g, `src="${API_ORIGIN}/uploads/`)
    .replace(/src='\/uploads\//g, `src='${API_ORIGIN}/uploads/`);
}

function normalizeStorageHtml(html: string): string {
  if (!html) return "<p></p>";
  const escapedOrigin = API_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html
    .replace(new RegExp(`src="${escapedOrigin}\\/uploads\\/`, "g"), 'src="/uploads/')
    .replace(new RegExp(`src='${escapedOrigin}\\/uploads\\/`, "g"), "src='/uploads/");
}

function getImageStyle(align: "left" | "center" | "right"): string {
  if (align === "left") return "display:block;margin:0 auto 0 0;max-width:100%;height:auto;";
  if (align === "right") return "display:block;margin:0 0 0 auto;max-width:100%;height:auto;";
  return "display:block;margin:0 auto;max-width:100%;height:auto;";
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [htmlOpen, setHtmlOpen] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");
  const insertImageInputRef = useRef<HTMLInputElement | null>(null);
  const replaceImageInputRef = useRef<HTMLInputElement | null>(null);
  const emittingRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt?: string;
    title?: string;
  } | null>(null);

  const uploadImage = useCallback(
    async (file: File): Promise<{ absoluteUrl: string; relativePath: string }> => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Faqat rasm faylini yuklash mumkin");
      }

      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error(`Rasm hajmi ${formatBytesToMb(MAX_IMAGE_BYTES)} dan oshmasligi kerak`);
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        setUploading(true);
        const response = await apiFetch<{ file: { relativePath: string } }>("/admin/uploads", {
          method: "POST",
          body: formData,
        });
        return {
          relativePath: response.file.relativePath,
          absoluteUrl: `${API_ORIGIN}${response.file.relativePath}`,
        };
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const initialContent = useMemo(() => normalizeEditorHtml(value), [value]);

  const syncSelectedImageState = useCallback((instance: TiptapEditor | null) => {
    if (!instance) {
      setSelectedImage(null);
      return;
    }

    const { selection } = instance.state;
    if (selection instanceof NodeSelection && selection.node.type.name === "image") {
      const attrs = selection.node.attrs as { src: string; alt?: string; title?: string };
      setSelectedImage(attrs);
      return;
    }

    setSelectedImage(null);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: getImageStyle("center"),
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-b-md border border-t-0 bg-background px-3 py-3 text-sm leading-6 outline-none prose prose-sm max-w-none prose-img:my-4 [&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-primary [&_img]:cursor-pointer [&_.docx-image-row]:grid [&_.docx-image-row]:grid-cols-2 [&_.docx-image-row]:gap-3 [&_.docx-image-row_img]:w-full [&_.docx-image-row_img]:h-auto",
      },
      handleClickOn(view, pos, node) {
        if (node.type.name !== "image") return false;
        const transaction = view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos));
        view.dispatch(transaction);
        return true;
      },
    },
    onUpdate({ editor: instance }) {
      emittingRef.current = true;
      onChange(normalizeStorageHtml(instance.getHTML()));
      emittingRef.current = false;
      syncSelectedImageState(instance);
    },
    onSelectionUpdate({ editor: instance }) {
      syncSelectedImageState(instance);
    },
    onCreate({ editor: instance }) {
      syncSelectedImageState(instance);
    },
  });

  useEffect(() => {
    if (!editor || emittingRef.current) return;
    const nextHtml = normalizeEditorHtml(value);
    if (editor.getHTML() === nextHtml) return;
    editor.commands.setContent(nextHtml, { emitUpdate: false });
  }, [editor, value]);

  const addOrEditLink = () => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    const rawUrl = window.prompt("Havolani kiriting", existing || "https://");
    if (rawUrl === null) return;
    if (!rawUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const setImageAlign = (align: "left" | "center" | "right") => {
    if (!editor) return;
    const updated = editor.chain().focus().updateAttributes("image", { style: getImageStyle(align) }).run();
    if (!updated) {
      toast({
        title: "Rasm tanlanmadi",
        description: "Avval rasmni bosing, keyin joylashuvni tanlang.",
      });
    }
  };

  const onSelectImage = async (file: File | undefined) => {
    if (!editor || !file) return;
    try {
      const { absoluteUrl } = await uploadImage(file);
      editor
        .chain()
        .focus()
        .setImage({
          src: absoluteUrl,
          alt: file.name,
          title: file.name,
          style: getImageStyle("center"),
        })
        .run();
      toast({ title: "Rasm muvaffaqiyatli qo'shildi" });
    } catch (error) {
      toast({
        title: "Rasm yuklashda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        variant: "destructive",
      });
    }
  };

  const onReplaceSelectedImage = async (file: File | undefined) => {
    if (!editor || !file) return;
    if (!selectedImage) {
      toast({
        title: "Rasm tanlanmadi",
        description: "Avval editor ichidan o'zgartirmoqchi bo'lgan rasmni bosing.",
      });
      return;
    }

    try {
      const { absoluteUrl } = await uploadImage(file);
      const updated = editor
        .chain()
        .focus()
        .updateAttributes("image", {
          src: absoluteUrl,
          alt: file.name,
          title: file.name,
        })
        .run();

      if (!updated) {
        toast({
          title: "Rasmni yangilab bo'lmadi",
          description: "Qayta rasmni tanlab urinib ko'ring.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Rasm yangilandi" });
    } catch (error) {
      toast({
        title: "Rasm yuklashda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        variant: "destructive",
      });
    }
  };

  if (!editor) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">Editor yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-muted/20">
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={addOrEditLink}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
          >
            <Link2Off className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertImageInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setHtmlDraft(editor.getHTML());
              setHtmlOpen(true);
            }}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("left")}>
            Img L
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("center")}>
            Img C
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("right")}>
            Img R
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <EditorContent editor={editor} />
        {selectedImage ? (
          <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 p-2">
            <p className="text-xs text-muted-foreground">Rasm tanlandi</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => replaceImageInputRef.current?.click()} disabled={uploading}>
              O'zgartirish
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("left")}>
              Left
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("center")}>
              Center
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlign("right")}>
              Right
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={htmlOpen} onOpenChange={setHtmlOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>HTML editor</DialogTitle>
            <DialogDescription>Bu yerda kontentni HTML ko'rinishida tahrirlashingiz mumkin.</DialogDescription>
          </DialogHeader>

          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            className="min-h-[360px] font-mono text-xs"
            placeholder="<p>...</p>"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHtmlOpen(false);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              onClick={() => {
                try {
                  editor.commands.setContent(normalizeEditorHtml(htmlDraft), { emitUpdate: true });
                  toast({ title: "HTML qo'llandi" });
                  setHtmlOpen(false);
                } catch (e) {
                  toast({
                    title: "HTML xatolik",
                    description: e instanceof Error ? e.message : "Amal bajarilmadi",
                    variant: "destructive",
                  });
                }
              }}
            >
              Qo'llash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={insertImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          await onSelectImage(file);
          event.target.value = "";
        }}
      />
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          await onReplaceSelectedImage(file);
          event.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        {placeholder ? `${placeholder}. ` : ""}
        Kontent rasmlari uchun limit: {formatBytesToMb(MAX_IMAGE_BYTES)}.
        {uploading ? " Rasm yuklanmoqda..." : ""}
      </p>
    </div>
  );
}
