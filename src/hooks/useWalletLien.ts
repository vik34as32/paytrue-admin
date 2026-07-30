"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  applyWalletLien,
  fetchWalletLienById,
  fetchWalletLiens,
  releaseWalletLien,
  WalletLienApiError,
} from "@/services/walletLien.service";
import {
  ApplyWalletLienPayload,
  ReleaseWalletLienPayload,
  WalletLienListParams,
} from "@/types/walletLien";
import { ROUTES } from "@/constants";

export const walletLienKeys = {
  all: ["wallet-lien"] as const,
  list: (params: WalletLienListParams) =>
    [...walletLienKeys.all, "list", params] as const,
  detail: (id: string) => [...walletLienKeys.all, "detail", id] as const,
};

function handleLienError(error: unknown, router: ReturnType<typeof useRouter>) {
  const status =
    error instanceof WalletLienApiError ? error.status : undefined;
  const message =
    error instanceof Error ? error.message : "Something went wrong";

  if (
    status === 403 ||
    /permission|forbidden|unauthorized|403/i.test(message)
  ) {
    router.replace(ROUTES.unauthorized);
    return;
  }

  toast.error(message);
}

export function useWalletLiens(params: WalletLienListParams, enabled = true) {
  const router = useRouter();

  return useQuery({
    queryKey: walletLienKeys.list(params),
    queryFn: () => fetchWalletLiens(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
    throwOnError: false,
    meta: { onError: (e: unknown) => handleLienError(e, router) },
  });
}

export function useWalletLienDetails(id: string | null, enabled = true) {
  const router = useRouter();

  return useQuery({
    queryKey: walletLienKeys.detail(id || ""),
    queryFn: () => fetchWalletLienById(id!),
    enabled: enabled && !!id,
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });
}

export function useWalletLienMutations() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: walletLienKeys.all });
  };

  const applyMutation = useMutation({
    mutationFn: (payload: ApplyWalletLienPayload) => applyWalletLien(payload),
    onSuccess: async () => {
      toast.success("Lien applied successfully");
      await invalidate();
    },
    onError: (error) => handleLienError(error, router),
  });

  const releaseMutation = useMutation({
    mutationFn: (payload: ReleaseWalletLienPayload) =>
      releaseWalletLien(payload),
    onSuccess: async () => {
      toast.success("Lien released successfully");
      await invalidate();
    },
    onError: (error) => handleLienError(error, router),
  });

  return { applyMutation, releaseMutation, invalidate };
}
