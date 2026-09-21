"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRoleAccess } from "@/hooks/useAuth";
import {
  getMyPermissionsCatalog,
  getMyUserPermissions,
  groupPermissionsByService,
} from "@/services/permissionManagementApi";
import { isHrefGranted } from "@/lib/permissions/navAccess";
import type { ServicePermission } from "@/types/permissions";

interface PermissionAccessValue {
  isSuperAdmin: boolean;
  loaded: boolean;
  enforced: boolean;
  permissionKeys: string[];
  permissionIds: string[];
  catalog: ServicePermission[];
  hasPermissionKey: (key: string) => boolean;
  isHrefAllowed: (href: string) => boolean;
  notifyLocked: () => void;
}

const PermissionAccessContext = createContext<PermissionAccessValue | null>(
  null
);

export function PermissionAccessProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSuperAdmin } = useRoleAccess();
  const adminId = !isSuperAdmin && user?.role === "admin" ? user.id : "";

  const accessQuery = useQuery({
    queryKey: ["my-permissions", adminId],
    enabled: Boolean(adminId),
    queryFn: async () => {
      const [mine, all] = await Promise.allSettled([
        getMyUserPermissions(adminId),
        getMyPermissionsCatalog(),
      ]);
      let permissionIds: string[] = [];
      let permissionKeys: string[] = [];
      let catalog: ServicePermission[] = [];
      let enforced = false;

      if (mine.status === "fulfilled") {
        enforced = true;
        permissionIds = mine.value.permissionIds;
        permissionKeys = mine.value.permissions
          .map((item) => item.key)
          .filter(Boolean);
      }
      if (all.status === "fulfilled") {
        catalog = all.value;
        if (!permissionKeys.length && permissionIds.length) {
          permissionKeys = all.value
            .filter((item) => permissionIds.includes(item.id))
            .map((item) => item.key);
        }
      } else if (mine.status === "fulfilled") {
        catalog = mine.value.permissions;
      }

      return { permissionIds, permissionKeys, catalog, enforced };
    },
  });

  const permissionKeys = useMemo(
    () => accessQuery.data?.permissionKeys ?? [],
    [accessQuery.data]
  );
  const permissionIds = useMemo(
    () => accessQuery.data?.permissionIds ?? [],
    [accessQuery.data]
  );
  const catalog = useMemo(
    () => accessQuery.data?.catalog ?? [],
    [accessQuery.data]
  );
  const enforced = Boolean(accessQuery.data?.enforced);
  const loaded = isSuperAdmin || !adminId || !accessQuery.isLoading;

  const hasPermissionKey = useCallback(
    (key: string) => {
      if (isSuperAdmin) return true;
      const needle = key.trim().toUpperCase();
      return permissionKeys.some((item) => item.toUpperCase() === needle);
    },
    [isSuperAdmin, permissionKeys]
  );

  const isHrefAllowed = useCallback(
    (href: string) => {
      if (isSuperAdmin) return true;
      if (!enforced) return true;
      return isHrefGranted(href, permissionKeys);
    },
    [enforced, isSuperAdmin, permissionKeys]
  );

  const notifyLocked = useCallback(() => {
    toast.message("Access to this service has not been granted.", {
      description: "You don't have permission to use this service.",
    });
  }, []);

  const value = useMemo(
    () => ({
      isSuperAdmin,
      loaded,
      enforced,
      permissionKeys,
      permissionIds,
      catalog,
      hasPermissionKey,
      isHrefAllowed,
      notifyLocked,
    }),
    [
      catalog,
      enforced,
      hasPermissionKey,
      isHrefAllowed,
      isSuperAdmin,
      loaded,
      notifyLocked,
      permissionIds,
      permissionKeys,
    ]
  );

  return (
    <PermissionAccessContext.Provider value={value}>
      {children}
    </PermissionAccessContext.Provider>
  );
}

export function usePermissionAccess() {
  const context = useContext(PermissionAccessContext);
  if (!context) {
    return {
      isSuperAdmin: false,
      loaded: true,
      enforced: false,
      permissionKeys: [] as string[],
      permissionIds: [] as string[],
      catalog: [] as ServicePermission[],
      hasPermissionKey: () => true,
      isHrefAllowed: () => true,
      notifyLocked: () => undefined,
      groups: [],
    };
  }
  return {
    ...context,
    groups: groupPermissionsByService(context.catalog),
  };
}
