import { createAuthenticatedClient, ADMIN_API_BASE } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";

/** Super Admin authenticated client for `/api/v1/admin/*` service APIs */
export const superAdminServicesClient = createAuthenticatedClient(
  STORAGE_KEYS.SUPER_ADMIN_TOKEN,
  "/super-admin/login",
  ADMIN_API_BASE
);
