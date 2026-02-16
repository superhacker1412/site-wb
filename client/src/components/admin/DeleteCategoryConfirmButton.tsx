import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DeleteMode = "DELETE_WITH_CONTENT" | "MOVE_CONTENT";

type DeleteCategoryConfirmButtonProps = {
  categoryId: string;
  categoryName: string;
  categories: Array<{ id: string; name: string }>;
  pending?: boolean;
  onConfirm: (payload: { mode: DeleteMode; targetCategoryId?: string }) => Promise<void>;
};

export default function DeleteCategoryConfirmButton({
  categoryId,
  categoryName,
  categories,
  pending,
  onConfirm,
}: DeleteCategoryConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DeleteMode>("DELETE_WITH_CONTENT");
  const [targetCategoryId, setTargetCategoryId] = useState("");

  const targetCategories = useMemo(
    () => categories.filter((item) => item.id !== categoryId),
    [categories, categoryId],
  );
  const needsTarget = mode === "MOVE_CONTENT";
  const confirmDisabled = pending || (needsTarget && !targetCategoryId);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setMode("DELETE_WITH_CONTENT");
          setTargetCategoryId("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={pending}>
          <Trash2 className="mr-2 h-4 w-4" />
          O'chirish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kategoriyani o'chirishni tasdiqlang</AlertDialogTitle>
          <AlertDialogDescription>
            "{categoryName}" kategoriyasi o'chiriladi. Kontent bilan nima qilishni tanlang.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>O'chirish turi</Label>
            <Select
              value={mode}
              onValueChange={(value) => {
                setMode(value as DeleteMode);
                if (value !== "MOVE_CONTENT") {
                  setTargetCategoryId("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DELETE_WITH_CONTENT">Kategoriyani kontent bilan o'chirish</SelectItem>
                <SelectItem value="MOVE_CONTENT">Kategoriyani o'chirib, kontentni boshqa kategoriyaga ko'chirish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "MOVE_CONTENT" ? (
            <div className="space-y-2">
              <Label>Kontentni ko'chirish kategoriyasi</Label>
              <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {targetCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetCategories.length === 0 ? (
                <p className="text-xs text-destructive">
                  Ko'chirish uchun boshqa kategoriya yo'q. Avval yangi kategoriya yarating.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled}
            onClick={async (event) => {
              event.preventDefault();
              try {
                await onConfirm({
                  mode,
                  ...(mode === "MOVE_CONTENT" ? { targetCategoryId } : {}),
                });
                setOpen(false);
              } catch {
                // Error toast handled by mutation hook.
              }
            }}
          >
            {pending ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
