"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createService,
  deleteService,
  getActiveServices,
  getServiceById,
  getServiceTree,
  listServices,
  patchServiceStatus,
  updateService,
} from "@/services/serviceMasterApi";
import {
  ServiceFormPayload,
  ServiceListParams,
  ServiceStatus,
} from "@/types/serviceMaster";

export const serviceMasterKeys = {
  all: ["service-master"] as const,
  list: (params: ServiceListParams) =>
    [...serviceMasterKeys.all, "list", params] as const,
  tree: () => [...serviceMasterKeys.all, "tree"] as const,
  active: () => [...serviceMasterKeys.all, "active"] as const,
  detail: (id: string) => [...serviceMasterKeys.all, "detail", id] as const,
};

export function useServicesList(params: ServiceListParams, enabled = true) {
  return useQuery({
    queryKey: serviceMasterKeys.list(params),
    queryFn: () => listServices(params),
    enabled,
  });
}

export function useServiceTree(enabled = true) {
  return useQuery({
    queryKey: serviceMasterKeys.tree(),
    queryFn: getServiceTree,
    enabled,
  });
}

export function useActiveServices() {
  return useQuery({
    queryKey: serviceMasterKeys.active(),
    queryFn: getActiveServices,
    staleTime: 60_000,
  });
}

export function useServiceDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: serviceMasterKeys.detail(id || ""),
    queryFn: () => getServiceById(id!),
    enabled: enabled && !!id,
  });
}

export function useServiceMasterMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: serviceMasterKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: ServiceFormPayload) => createService(payload),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceFormPayload }) =>
      updateService(id, payload),
    onSuccess: invalidateAll,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      patchServiceStatus(id, status),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: invalidateAll,
  });

  return {
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
  };
}
