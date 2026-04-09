import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { apiFetch, toAssetUrl } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { AdminDirection, AdminQuestion } from "@/pages/admin/admin-types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploadField from "@/components/admin/ImageUploadField";

type DirectionsResponse = {
  directions: AdminDirection[];
};

type QuestionsResponse = {
  questions: AdminQuestion[];
};

type AnswerMode = "TEXT_OPTIONS" | "IMAGE_OPTIONS" | "YES_NO";

type QuestionOptionDraft = {
  id: string;
  text: string;
  imagePath: string;
};

type QuestionOptionPayload =
  | { type: "TEXT"; text: string }
  | { type: "IMAGE"; imagePath: string };

type QuestionFormState = {
  directionId: string;
  answerMode: AnswerMode;
  questionText: string;
  questionImagePath: string;
  options: QuestionOptionDraft[];
  correctAnswerIndex: number;
  explanationHtml: string;
  status: "ACTIVE" | "ARCHIVED";
};

const YES_NO_VALUES = ["Ha", "Yo'q"] as const;
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

function createOptionDraft(initial?: Partial<QuestionOptionDraft>): QuestionOptionDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: initial?.text || "",
    imagePath: initial?.imagePath || "",
  };
}

function ensureMinTwoOptions(options: QuestionOptionDraft[]): QuestionOptionDraft[] {
  const next = [...options];
  while (next.length < 2) {
    next.push(createOptionDraft());
  }
  return next;
}

function answerModeFromQuestionType(type: AdminQuestion["type"]): AnswerMode {
  if (type === "IMAGE") return "IMAGE_OPTIONS";
  if (type === "TRUE_FALSE") return "YES_NO";
  return "TEXT_OPTIONS";
}

function questionTypeFromAnswerMode(mode: AnswerMode): AdminQuestion["type"] {
  if (mode === "IMAGE_OPTIONS") return "IMAGE";
  if (mode === "YES_NO") return "TRUE_FALSE";
  return "CHOICE";
}

function normalizeExistingOptions(mode: AnswerMode, options: AdminQuestion["options"]): QuestionOptionDraft[] {
  if (mode === "YES_NO") {
    return YES_NO_VALUES.map((value) => createOptionDraft({ text: value }));
  }

  const mapped = options.map((option) =>
    createOptionDraft({
      text: option.type === "TEXT" ? option.text || "" : option.text || "",
      imagePath: option.type === "IMAGE" ? option.imagePath || "" : "",
    }),
  );

  return ensureMinTwoOptions(mapped.length > 0 ? mapped : []);
}

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export default function AdminQuestionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const presetDirectionId = searchParams.get("directionId") || "";

  const [saving, setSaving] = useState(false);
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionFormState>({
    directionId: presetDirectionId,
    answerMode: "TEXT_OPTIONS",
    questionText: "",
    questionImagePath: "",
    options: ensureMinTwoOptions([]),
    correctAnswerIndex: 0,
    explanationHtml: "<p></p>",
    status: "ACTIVE",
  });

  const directionsQuery = useQuery({
    queryKey: ["admin", "directions"],
    queryFn: () => apiFetch<DirectionsResponse>("/admin/quiz/directions"),
  });

  const questionsQuery = useQuery({
    queryKey: ["admin", "questions", "form"],
    queryFn: () => apiFetch<QuestionsResponse>("/admin/quiz/questions"),
  });

  useEffect(() => {
    if (!isEdit || !id || !questionsQuery.data?.questions) return;
    const question = questionsQuery.data.questions.find((item) => item.id === id);
    if (!question) return;

    const answerMode = answerModeFromQuestionType(question.type);
    const options = normalizeExistingOptions(answerMode, question.options || []);
    setForm({
      directionId: question.directionId || "",
      answerMode,
      questionText: question.questionText,
      questionImagePath: question.imagePath || "",
      options,
      correctAnswerIndex: Math.min(question.correctAnswerIndex || 0, Math.max(options.length - 1, 0)),
      explanationHtml: question.explanationHtml,
      status: question.status,
    });
  }, [id, isEdit, questionsQuery.data?.questions]);

  const canAddOrRemove = form.answerMode !== "YES_NO";
  const optionsCount = form.options.length;

  const changeAnswerMode = (nextMode: AnswerMode) => {
    setForm((prev) => {
      if (nextMode === "YES_NO") {
        return {
          ...prev,
          answerMode: nextMode,
          options: YES_NO_VALUES.map((value) => createOptionDraft({ text: value })),
          correctAnswerIndex: prev.correctAnswerIndex > 1 ? 0 : prev.correctAnswerIndex,
        };
      }

      const baseOptions = ensureMinTwoOptions(
        prev.options.map((option) =>
          createOptionDraft({
            text: nextMode === "TEXT_OPTIONS" ? option.text : "",
            imagePath: nextMode === "IMAGE_OPTIONS" ? option.imagePath : "",
          }),
        ),
      );

      return {
        ...prev,
        answerMode: nextMode,
        options: baseOptions,
        correctAnswerIndex: Math.min(prev.correctAnswerIndex, Math.max(baseOptions.length - 1, 0)),
      };
    });
  };

  const setOptionText = (index: number, text: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    }));
  };

  const setOptionImagePath = (index: number, imagePath: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, imagePath } : option,
      ),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, createOptionDraft()],
    }));
  };

  const removeOption = (index: number) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev;
      const nextOptions = prev.options.filter((_, optionIndex) => optionIndex !== index);
      let nextCorrectAnswerIndex = prev.correctAnswerIndex;

      if (index === prev.correctAnswerIndex) {
        nextCorrectAnswerIndex = 0;
      } else if (index < prev.correctAnswerIndex) {
        nextCorrectAnswerIndex = prev.correctAnswerIndex - 1;
      }

      return {
        ...prev,
        options: nextOptions,
        correctAnswerIndex: nextCorrectAnswerIndex,
      };
    });
  };

  const uploadOptionImage = async (index: number, file: File | undefined) => {
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
      setUploadingOptionIndex(index);
      const response = await apiFetch<{ file: { relativePath: string } }>("/admin/uploads", {
        method: "POST",
        body: formData,
      });
      setOptionImagePath(index, response.file.relativePath);
      toast({ title: "Variant rasmi yuklandi" });
    } catch (error) {
      toast({
        title: "Rasm yuklashda xatolik",
        description: error instanceof Error ? error.message : "Xatolik",
        variant: "destructive",
      });
    } finally {
      setUploadingOptionIndex(null);
    }
  };

  const payloadOptions = useMemo<QuestionOptionPayload[]>(() => {
    if (form.answerMode === "YES_NO") {
      return YES_NO_VALUES.map((value) => ({ type: "TEXT", text: value }));
    }

    if (form.answerMode === "IMAGE_OPTIONS") {
      return form.options.map((option) => ({
        type: "IMAGE",
        imagePath: option.imagePath.trim(),
      }));
    }

    return form.options.map((option) => ({
      type: "TEXT",
      text: option.text.trim(),
    }));
  }, [form.answerMode, form.options]);

  const onSubmit = async () => {
    if (!form.directionId) {
      toast({ title: "Yo'nalish tanlang", variant: "destructive" });
      return;
    }

    if (optionsCount < 2) {
      toast({ title: "Kamida 2 ta variant bo'lishi kerak", variant: "destructive" });
      return;
    }

    if (form.answerMode === "TEXT_OPTIONS" && payloadOptions.some((option) => option.type === "TEXT" && !option.text)) {
      toast({ title: "Barcha matnli variantlarni to'ldiring", variant: "destructive" });
      return;
    }

    if (form.answerMode === "IMAGE_OPTIONS" && payloadOptions.some((option) => option.type === "IMAGE" && !option.imagePath)) {
      toast({ title: "Barcha variantlarga rasm yuklang", variant: "destructive" });
      return;
    }

    if (form.correctAnswerIndex < 0 || form.correctAnswerIndex >= optionsCount) {
      toast({ title: "To'g'ri javobni belgilang", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      await apiFetch(isEdit ? `/admin/quiz/questions/${id}` : "/admin/quiz/questions", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          directionId: form.directionId,
          type: questionTypeFromAnswerMode(form.answerMode),
          questionText: form.questionText,
          options: payloadOptions,
          imagePath: form.questionImagePath || null,
          correctAnswerIndex: form.correctAnswerIndex,
          explanationHtml: form.explanationHtml,
          status: form.status,
        },
      });
      toast({ title: isEdit ? "Savol yangilandi" : "Savol yaratildi" });
      navigate("/admin/questions");
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
        title={isEdit ? "Savolni tahrirlash" : "Yangi savol"}
        description={isEdit ? "Mavjud savolni yangilang." : "Yangi test savoli yarating."}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Yo'nalish</Label>
              <Select value={form.directionId} onValueChange={(value) => setForm((prev) => ({ ...prev, directionId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Yo'nalish tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {(directionsQuery.data?.directions || []).map((direction) => (
                    <SelectItem key={direction.id} value={direction.id}>
                      {direction.icon} {direction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Variant turi</Label>
              <Select value={form.answerMode} onValueChange={(value) => changeAnswerMode(value as AnswerMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT_OPTIONS">Javoblar matn bo'yicha</SelectItem>
                  <SelectItem value="IMAGE_OPTIONS">Javoblar rasm bo'yicha</SelectItem>
                  <SelectItem value="YES_NO">Ha / Yo'q</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">Savol matni</Label>
            <Input
              id="questionText"
              value={form.questionText}
              onChange={(event) => setForm((prev) => ({ ...prev, questionText: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Savol rasmi (ixtiyoriy)</Label>
            <ImageUploadField
              value={form.questionImagePath}
              onChange={(questionImagePath) => setForm((prev) => ({ ...prev, questionImagePath }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Variantlar (to'g'ri javobni belgilang)</Label>
              {canAddOrRemove ? (
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Variant qo'shish
                </Button>
              ) : null}
            </div>

            <RadioGroup
              value={String(form.correctAnswerIndex)}
              onValueChange={(value) => setForm((prev) => ({ ...prev, correctAnswerIndex: Number(value) }))}
              className="space-y-2"
            >
              {form.options.map((option, index) => (
                <div key={option.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={String(index)} id={`opt-${option.id}`} />
                    <Label htmlFor={`opt-${option.id}`} className="text-sm font-medium">
                      Variant {index + 1}
                    </Label>
                    {canAddOrRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={form.options.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  {form.answerMode === "TEXT_OPTIONS" || form.answerMode === "YES_NO" ? (
                    <Input
                      value={option.text}
                      readOnly={form.answerMode === "YES_NO"}
                      onChange={(event) => setOptionText(index, event.target.value)}
                      placeholder={`Variant ${index + 1} matni`}
                    />
                  ) : null}

                  {form.answerMode === "IMAGE_OPTIONS" ? (
                    <div className="space-y-2">
                      {option.imagePath ? (
                        <img
                          src={toAssetUrl(option.imagePath)}
                          alt={`Variant ${index + 1}`}
                          className="h-16 w-16 rounded-md border object-cover"
                        />
                      ) : null}
                      <Input
                        value={option.imagePath}
                        onChange={(event) => setOptionImagePath(index, event.target.value)}
                        placeholder="/uploads/... yoki URL"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={uploadingOptionIndex === index}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            void uploadOptionImage(index, file);
                            event.target.value = "";
                          }}
                        />
                      </div>
                      {uploadingOptionIndex === index ? (
                        <p className="text-xs text-muted-foreground">Rasm yuklanmoqda...</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Variant rasmi uchun limit: {formatBytesToMb(MAX_IMAGE_BYTES)}.
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </RadioGroup>
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

          <div className="space-y-2">
            <Label>Izoh (HTML)</Label>
            <RichTextEditor value={form.explanationHtml} onChange={(explanationHtml) => setForm((prev) => ({ ...prev, explanationHtml }))} />
          </div>

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/questions")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
