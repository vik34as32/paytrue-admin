"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createServiceCharge,
  deleteServiceCharge,
  getServiceChargeById,
  listServiceChargeHistory,
  listServiceChargePlanHistory,
  listServiceCharges,
  pauseServiceCharge,
  resumeServiceCharge,
  runServiceChargeNow,
  toServiceChargeApiBodies,
  toServiceChargePayload,
  updateServiceCharge,
} from "@/services/serviceChargeApi";
import {
  ServiceChargeHistoryParams,
  ServiceChargeListParams,
  ServiceChargePlan,
} from "@/types/serviceCharge";
import { ServiceChargeFormValues } from "@/schemas/service-charge.schema";

export const serviceChargeKeys = {
  all: ["service-charges"] as const,
  lists: () => [...serviceChargeKeys.all, "list"] as const,
  list: (params: ServiceChargeListParams) =>
    [...serviceChargeKeys.lists(), params] as const,
  details: () => [...serviceChargeKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceChargeKeys.details(), id] as const,
  histories: () => [...serviceChargeKeys.all, "history"] as const,
  history: (params: ServiceChargeHistoryParams) =>
    [...serviceChargeKeys.histories(), params] as const,
  planHistory: (id: string, params: ServiceChargeHistoryParams) =>
    [...serviceChargeKeys.histories(), id, params] as const,
};

export function useServiceChargesList(
  params: ServiceChargeListParams,
  enabled = true
) {
  return useQuery({
    queryKey: serviceChargeKeys.list(params),
    queryFn: () => listServiceCharges(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useServiceChargeDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: serviceChargeKeys.detail(id || ""),
    queryFn: () => getServiceChargeById(id!),
    enabled: enabled && !!id,
    staleTime: 30_000,
  });
}

export function useServiceChargeHistory(
  params: ServiceChargeHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: serviceChargeKeys.history(params),
    queryFn: () => listServiceChargeHistory(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useServiceChargePlanHistory(
  id: string | null,
  params: ServiceChargeHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: serviceChargeKeys.planHistory(id || "", params),
    queryFn: () => listServiceChargePlanHistory(id!, params),
    enabled: enabled && !!id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useServiceChargeMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: serviceChargeKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: ServiceChargeFormValues) => {
      const bodies = toServiceChargeApiBodies({
        ...payload,
        executionMonth:
          payload.executionMonth === "" || payload.executionMonth == null
            ? null
            : Number(payload.executionMonth),
        endDate: payload.endDate || null,
      });
      const created: ServiceChargePlan[] = [];
      for (const body of bodies) {
        created.push(await createServiceCharge(body));
      }
      return created;
    },
    onSuccess: async (created) => {
      await invalidateAll();
      toast.success(
        created.length > 1
          ? `${created.length} service charge plans created`
          : "Service charge plan created"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create plan");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ServiceChargeFormValues;
    }) => {
      const mapped = {
        ...payload,
        executionMonth:
          payload.executionMonth === "" || payload.executionMonth == null
            ? null
            : Number(payload.executionMonth),
        endDate: payload.endDate || null,
      };
      const bodies = toServiceChargeApiBodies(mapped);
      return updateServiceCharge(
        id,
        bodies[0] || toServiceChargePayload(mapped)
      );
    },
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Service charge plan updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceCharge(id),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Service charge plan deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete plan");
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseServiceCharge(id),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Plan paused");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to pause plan");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeServiceCharge(id),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Plan resumed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resume plan");
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => runServiceChargeNow(id),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Charge run triggered");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to run charge");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    pauseMutation,
    resumeMutation,
    runMutation,
  };
}
