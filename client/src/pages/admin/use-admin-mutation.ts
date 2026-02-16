import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type MutationPayload = {
  path: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export function useAdminMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ path, method, body }: MutationPayload) => apiFetch(path, { method, body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Amal bajarilmadi",
        variant: "destructive",
      });
    },
  });
}
