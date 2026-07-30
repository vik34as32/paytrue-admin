"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserVerification,
  rejectUser,
  verifyUser,
} from "@/services/idVerificationApi";
import {
  RejectUserPayload,
  UserVerificationInfo,
  VerifyUserPayload,
} from "@/types/idVerification";
import { toastBackendError, toastBackendSuccess } from "@/lib/toast";

export const verificationKeys = {
  all: ["verification"] as const,
  detail: (userId: string) =>
    [...verificationKeys.all, "detail", userId] as const,
  users: ["users"] as const,
  userDetails: ["user-details"] as const,
};

export function useVerification(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: verificationKeys.detail(userId || ""),
    queryFn: () => getUserVerification(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 15_000,
  });
}

async function invalidateVerificationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: verificationKeys.all }),
    queryClient.invalidateQueries({ queryKey: verificationKeys.detail(userId) }),
    queryClient.invalidateQueries({ queryKey: verificationKeys.users }),
    queryClient.invalidateQueries({ queryKey: verificationKeys.userDetails }),
  ]);
}

export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: VerifyUserPayload;
    }) => verifyUser(userId, payload),
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({
        queryKey: verificationKeys.detail(userId),
      });
      const previous = queryClient.getQueryData<UserVerificationInfo>(
        verificationKeys.detail(userId)
      );

      if (previous) {
        queryClient.setQueryData<UserVerificationInfo>(
          verificationKeys.detail(userId),
          {
            ...previous,
            status: "VERIFIED",
          }
        );
      }

      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          verificationKeys.detail(variables.userId),
          context.previous
        );
      }
      toastBackendError(error, "Failed to verify user");
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        verificationKeys.detail(variables.userId),
        result.verification.status === "PENDING"
          ? { ...result.verification, status: "VERIFIED" as const }
          : result.verification
      );
      toastBackendSuccess(result.message, "User verified successfully");
    },
    onSettled: async (_data, _error, variables) => {
      await invalidateVerificationQueries(queryClient, variables.userId);
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: RejectUserPayload;
    }) => rejectUser(userId, payload),
    onMutate: async ({ userId, payload }) => {
      await queryClient.cancelQueries({
        queryKey: verificationKeys.detail(userId),
      });
      const previous = queryClient.getQueryData<UserVerificationInfo>(
        verificationKeys.detail(userId)
      );

      if (previous) {
        queryClient.setQueryData<UserVerificationInfo>(
          verificationKeys.detail(userId),
          {
            ...previous,
            status: "REJECTED",
            reason: payload.reason,
          }
        );
      }

      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          verificationKeys.detail(variables.userId),
          context.previous
        );
      }
      toastBackendError(error, "Failed to reject user");
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        verificationKeys.detail(variables.userId),
        result.verification.status === "PENDING"
          ? {
              ...result.verification,
              status: "REJECTED" as const,
              reason: variables.payload.reason,
            }
          : result.verification
      );
      toastBackendSuccess(result.message, "User rejected successfully");
    },
    onSettled: async (_data, _error, variables) => {
      await invalidateVerificationQueries(queryClient, variables.userId);
    },
  });
}
