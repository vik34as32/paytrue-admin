"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getHierarchyDistributors,
  getHierarchyMasterDistributors,
  getHierarchyRetailers,
  getHierarchyTree,
  reassignDistributor,
  reassignRetailer,
} from "@/services/hierarchyManagementApi";
import {
  HierarchyListParams,
  HierarchyTreeParams,
  ReassignDistributorPayload,
  ReassignRetailerPayload,
} from "@/types/hierarchyManagement";
import { toastBackendSuccess } from "@/lib/toast";
import { getHierarchyFriendlyError } from "@/lib/hierarchy/permissions";
import { toast } from "sonner";

export const hierarchyKeys = {
  all: ["hierarchy-management"] as const,
  tree: (filters: HierarchyTreeParams) =>
    [...hierarchyKeys.all, "tree", filters] as const,
  masterDistributors: (params: HierarchyListParams) =>
    [...hierarchyKeys.all, "master-distributors", params] as const,
  distributors: (params: HierarchyListParams) =>
    [...hierarchyKeys.all, "distributors", params] as const,
  retailers: (params: HierarchyListParams) =>
    [...hierarchyKeys.all, "retailers", params] as const,
};

export function useHierarchyTree(
  filters: HierarchyTreeParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: hierarchyKeys.tree(filters),
    queryFn: () => getHierarchyTree(filters),
    enabled,
    staleTime: 20_000,
  });
}

export function useHierarchyMasterDistributors(
  params: HierarchyListParams,
  enabled = true
) {
  return useQuery({
    queryKey: hierarchyKeys.masterDistributors(params),
    queryFn: () => getHierarchyMasterDistributors(params),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useHierarchyDistributors(
  params: HierarchyListParams,
  enabled = true
) {
  return useQuery({
    queryKey: hierarchyKeys.distributors(params),
    queryFn: () => getHierarchyDistributors(params),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useHierarchyRetailers(
  params: HierarchyListParams,
  enabled = true
) {
  return useQuery({
    queryKey: hierarchyKeys.retailers(params),
    queryFn: () => getHierarchyRetailers(params),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

async function invalidateHierarchy(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.invalidateQueries({ queryKey: hierarchyKeys.all });
}

export function useReassignRetailer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      retailerId,
      payload,
    }: {
      retailerId: string;
      payload: ReassignRetailerPayload;
    }) => reassignRetailer(retailerId, payload),
    onSuccess: async (result) => {
      await invalidateHierarchy(queryClient);
      toastBackendSuccess(
        result,
        "Retailer Reassigned Successfully"
      );
    },
    onError: (error) => {
      toast.error(getHierarchyFriendlyError(error));
    },
    throwOnError: false,
  });
}

export function useReassignDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      distributorId,
      payload,
    }: {
      distributorId: string;
      payload: ReassignDistributorPayload;
    }) => reassignDistributor(distributorId, payload),
    onSuccess: async (result) => {
      await invalidateHierarchy(queryClient);
      toastBackendSuccess(
        result,
        "Distributor Reassigned Successfully"
      );
    },
    onError: (error) => {
      toast.error(getHierarchyFriendlyError(error));
    },
    throwOnError: false,
  });
}
