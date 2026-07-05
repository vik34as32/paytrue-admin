import { superAdminClient } from "@/lib/api/client";
import { getAdmins as getAdminsPaginated } from "@/services/superAdminApi";
import {
  CreateAdminPayload,
  AdminRecord,
  ListQueryParams,
  PaginatedApiData,
} from "@/types/superAdmin";
import { ApiResponse } from "@/types";

/** POST /auth/register — super admin creates an ADMIN user */
export async function createAdmin(payload: CreateAdminPayload) {
  const { data } = await superAdminClient.post<ApiResponse<AdminRecord>>(
    "/auth/register",
    payload
  );
  return data.data;
}

export async function getAdmins(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<AdminRecord>> {
  return getAdminsPaginated(params);
}

export async function getAllAdmins(): Promise<AdminRecord[]> {
  const result = await getAdminsPaginated({ page: 1, pageSize: 500 });
  return result.data;
}

export function getAdminDisplayName(admin: AdminRecord): string {
  if (admin.name) return admin.name;
  const full = [admin.firstName, admin.lastName].filter(Boolean).join(" ");
  return full || admin.email || "—";
}

export function getAdminBalance(admin: AdminRecord): number {
  return Number(
    admin.currentWalletBalance ??
    admin.walletBalance ??
    admin.balance ??
    admin.wallet?.balance ??
    0
  );
}

export function getAdminId(admin: AdminRecord): string {
  return admin.adminId || admin.id;
}
