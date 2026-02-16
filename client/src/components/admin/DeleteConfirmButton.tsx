import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

type DeleteConfirmButtonProps = {
  entityTitle: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  pending?: boolean;
  size?: "default" | "sm";
  description?: string;
};

export default function DeleteConfirmButton({
  entityTitle,
  onConfirm,
  disabled,
  pending,
  size = "sm",
  description,
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={size} variant="destructive" disabled={disabled || pending}>
          <Trash2 className="mr-2 h-4 w-4" />
          O'chirish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>O'chirishni tasdiqlaysizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            {description || `"${entityTitle}" butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={async (event) => {
              event.preventDefault();
              try {
                await onConfirm();
                setOpen(false);
              } catch {
                // Error toast is handled in mutation hook.
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
