"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Badge } from "@/components/common/Badge";
import { DataTable } from "@/components/tables/DataTable";
import { Modal } from "@/components/modals/Modal";
import { ServicePermissionForm } from "@/components/permissions/ServicePermissionForm";
import {
  AccessSummary,
  ManageAccessDrawer,
} from "@/components/permissions/ManageAccessDrawer";
import { getServiceIcon } from "@/components/permissions/serviceIcons";
import { isActiveStatus } from "@/components/permissions/permissionDisplay";
import {
  createPermission,
  deletePermission,
  getPermissions,
  getUserPermissions,
  groupPermissionsByService,
  listPermissionUsersByRole,
  updatePermission,
  updateUserPermissions,
} from "@/services/permissionManagementApi";
import { PERMISSION_ROLE_OPTIONS } from "@/constants/permissionModules";
import { cn } from "@/lib/utils";
import type {
  CreatePermissionPayload,
  PermissionRoleType,
  PermissionUserOption,
  ServicePermission,
} from "@/types/permissions";

type MainTab = "services" | "users";
type CatalogView = "table" | "grouped";

export function PermissionManagementView() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<MainTab>("services");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [catalogView, setCatalogView] = useState<CatalogView>("table");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ServicePermission | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [disableTarget, setDisableTarget] = useState<ServicePermission | null>(
    null
  );
  const [disabling, setDisabling] = useState(false);

  const [roleTab, setRoleTab] = useState<PermissionRoleType>("ADMIN");
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("ALL");
  const [userService, setUserService] = useState("ALL");

  const [manageUser, setManageUser] = useState<PermissionUserOption | null>(
    null
  );
  const [manageOpen, setManageOpen] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ["permissions", "catalog"],
    queryFn: getPermissions,
  });
  const catalog = useMemo(
    () => catalogQuery.data ?? [],
    [catalogQuery.data]
  );
  const catalogLoading = catalogQuery.isLoading;
  const catalogError = catalogQuery.error
    ? catalogQuery.error instanceof Error
      ? catalogQuery.error.message
      : "Failed to load permissions"
    : null;

  const usersQuery = useQuery({
    queryKey: ["permissions", "users", roleTab],
    queryFn: () => listPermissionUsersByRole(roleTab),
    enabled: tab === "users",
  });
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const usersLoading = usersQuery.isLoading;
  const usersError = usersQuery.error
    ? usersQuery.error instanceof Error
      ? usersQuery.error.message
      : "Failed to load users"
    : null;

  const userIds = users.map((user) => user.id).join(",");
  const userAccessQuery = useQuery({
    queryKey: ["permissions", "user-access", roleTab, userIds],
    enabled: tab === "users" && users.length > 0,
    queryFn: async () => {
      const next: Record<string, string[]> = {};
      await Promise.all(
        users.map(async (user) => {
          try {
            next[user.id] = (await getUserPermissions(user.id)).permissionIds;
          } catch {
            next[user.id] = [];
          }
        })
      );
      return next;
    },
  });
  const userAccess = useMemo(
    () => userAccessQuery.data ?? {},
    [userAccessQuery.data]
  );
  const accessLoadingIds = useMemo(
    () => (userAccessQuery.isLoading ? users.map((user) => user.id) : []),
    [userAccessQuery.isLoading, users]
  );

  const manageQuery = useQuery({
    queryKey: ["permissions", "user", manageUser?.id],
    enabled: Boolean(manageOpen && manageUser?.id),
    queryFn: () => getUserPermissions(manageUser!.id),
  });

  const loadCatalog = () => catalogQuery.refetch();
  const loadUsers = () => usersQuery.refetch();

  const serviceTypes = useMemo(
    () =>
      Array.from(new Set(catalog.map((item) => item.serviceType))).sort(),
    [catalog]
  );

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (typeFilter !== "ALL" && item.serviceType !== typeFilter) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!query) return true;
      return [item.name, item.key, item.serviceType, item.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [catalog, search, statusFilter, typeFilter]);

  const kpis = useMemo(() => {
    const active = catalog.filter((item) => item.status === "ACTIVE").length;
    const assigned = catalog.reduce(
      (sum, item) => sum + (item.assignedUsersCount || 0),
      0
    );
    return {
      total: catalog.length,
      active,
      inactive: catalog.length - active,
      assigned,
    };
  }, [catalog]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (userStatus !== "ALL") {
        const active = isActiveStatus(user.status);
        if (userStatus === "ACTIVE" && !active) return false;
        if (userStatus === "INACTIVE" && active) return false;
      }
      if (userService !== "ALL") {
        const ids = new Set(userAccess[user.id] || []);
        const hasService = catalog.some(
          (item) => item.serviceType === userService && ids.has(item.id)
        );
        if (!hasService) return false;
      }
      if (!query) return true;
      return [user.name, user.mobile, user.email, user.userCode, user.role]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [catalog, userAccess, userSearch, userService, userStatus, users]);

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (item: ServicePermission) => {
    setFormMode("edit");
    setEditing(item);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: CreatePermissionPayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        await createPermission(payload);
        toast.success("Permission created successfully");
      } else if (editing) {
        await updatePermission(editing.id, payload);
        toast.success("Permission updated successfully");
      }
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save permission"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!disableTarget) return;
    setDisabling(true);
    try {
      await deletePermission(disableTarget.id);
      toast.success("Permission disabled successfully");
      setDisableTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to disable permission"
      );
    } finally {
      setDisabling(false);
    }
  };

  const handleEnable = useCallback(async (item: ServicePermission) => {
    try {
      await updatePermission(item.id, { status: "ACTIVE" });
      toast.success("Permission updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to enable permission"
      );
    }
  }, [queryClient]);

  const openManage = useCallback((user: PermissionUserOption) => {
    setManageUser(user);
    setManageOpen(true);
  }, []);

  const saveManage = async (permissionIds: string[]) => {
    if (!manageUser) return;
    setSavingAccess(true);
    try {
      await updateUserPermissions(manageUser.id, permissionIds);
      toast.success("Permissions updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setManageOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save permissions"
      );
    } finally {
      setSavingAccess(false);
    }
  };

  const catalogColumns = useMemo<ColumnDef<ServicePermission, unknown>[]>(
    () => [
      {
        accessorKey: "serviceType",
        header: "Service",
        cell: ({ row }) => {
          const Icon = getServiceIcon(row.original.serviceType);
          return (
            <span className="inline-flex items-center gap-2 font-medium">
              <Icon className="h-4 w-4 text-primary" />
              {row.original.serviceType}
            </span>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Permission",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="font-mono text-[11px] text-muted">
              {row.original.key}
            </p>
          </div>
        ),
      },
      { accessorKey: "serviceType", header: "Service Type", id: "type" },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "ACTIVE" ? "active" : "inactive"}
          >
            {row.original.status === "ACTIVE" ? "Active" : "Disabled"}
          </Badge>
        ),
      },
      {
        accessorKey: "assignedUsersCount",
        header: "Users Assigned",
        cell: ({ row }) => `${row.original.assignedUsersCount || 0} users`,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </Button>
            {row.original.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDisableTarget(row.original)}
              >
                Disable
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleEnable(row.original)}
              >
                Enable
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleEnable]
  );

  const userColumns = useMemo<ColumnDef<PermissionUserOption, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted">{row.original.userCode}</p>
          </div>
        ),
      },
      { accessorKey: "roleLabel", header: "Role" },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => row.original.mobile || "—",
      },
      {
        id: "services",
        header: "Assigned Services",
        enableSorting: false,
        cell: ({ row }) =>
          accessLoadingIds.includes(row.original.id) ? (
            <span className="text-xs text-muted">Loading…</span>
          ) : (
            <AccessSummary
              catalog={catalog}
              enabledIds={userAccess[row.original.id] || []}
            />
          ),
      },
      {
        id: "count",
        header: "Permission Count",
        cell: ({ row }) =>
          `${(userAccess[row.original.id] || []).length} permissions`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={isActiveStatus(row.original.status) ? "active" : "inactive"}>
            {row.original.status || "Unknown"}
          </Badge>
        ),
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" onClick={() => openManage(row.original)}>
            Manage Access
          </Button>
        ),
      },
    ],
    [accessLoadingIds, catalog, openManage, userAccess]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Settings"
        title="Permission Management"
        subtitle="Control service access for Admins, Master Distributors, Distributors and Retailers."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total Services"
          value={kpis.total}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <Kpi
          label="Active Services"
          value={kpis.active}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Kpi
          label="Inactive Services"
          value={kpis.inactive}
          icon={<Lock className="h-4 w-4" />}
        />
        <Kpi
          label="Total Assigned Permissions"
          value={kpis.assigned}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === "services"} onClick={() => setTab("services")}>
          Services
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          User Access
        </TabButton>
      </div>

      {tab === "services" ? (
        <Card padding={false} className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <Input
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service, key or description"
            />
            <Select
              label="Service Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              options={[
                { value: "ALL", label: "All types" },
                ...serviceTypes.map((item) => ({ value: item, label: item })),
              ]}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { value: "ALL", label: "All" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
            <div className="flex gap-2">
              <Button
                variant={catalogView === "table" ? "primary" : "outline"}
                size="sm"
                onClick={() => setCatalogView("table")}
              >
                Table
              </Button>
              <Button
                variant={catalogView === "grouped" ? "primary" : "outline"}
                size="sm"
                onClick={() => setCatalogView("grouped")}
              >
                Grouped
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadCatalog()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {catalogError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm text-red-700">{catalogError}</p>
              <Button className="mt-3" size="sm" onClick={() => void loadCatalog()}>
                Retry
              </Button>
            </div>
          ) : catalogView === "table" ? (
            <div className="hidden md:block">
              <DataTable
                data={filteredCatalog}
                columns={catalogColumns}
                hideSearch
                isLoading={catalogLoading}
                searchPlaceholder="Search services"
              />
            </div>
          ) : null}

          {catalogError ? null : catalogView === "table" ? (
            <div className="space-y-3 md:hidden">
              {catalogLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))
              ) : filteredCatalog.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  No permissions found
                </p>
              ) : (
                filteredCatalog.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted">
                          {item.serviceType}
                        </p>
                        <p className="font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="font-mono text-[11px] text-muted">
                          {item.key}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === "ACTIVE" ? "active" : "inactive"
                        }
                      >
                        {item.status === "ACTIVE" ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {item.description || "—"}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {item.assignedUsersCount || 0} users
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                      {item.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDisableTarget(item)}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleEnable(item)}
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : catalogLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No permissions found
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groupPermissionsByService(filteredCatalog).map((group) => {
                const Icon = getServiceIcon(group.serviceType);
                return (
                  <section
                    key={group.serviceType}
                    className="rounded-2xl border border-border"
                  >
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">
                        {group.serviceType}
                      </h3>
                    </div>
                    <ul className="divide-y divide-border">
                      {group.permissions.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted">
                              {item.description || item.key}
                            </p>
                          </div>
                          <Badge
                            variant={
                              item.status === "ACTIVE" ? "success" : "inactive"
                            }
                          >
                            {item.status === "ACTIVE" ? "Active" : "Disabled"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card padding={false} className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {PERMISSION_ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setRoleTab(role.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  roleTab === role.value
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-muted hover:text-foreground"
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Input
              label="Search User"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Name, mobile or code"
            />
            <Select
              label="Status"
              value={userStatus}
              onChange={(event) => setUserStatus(event.target.value)}
              options={[
                { value: "ALL", label: "All" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
            <Select
              label="Service"
              value={userService}
              onChange={(event) => setUserService(event.target.value)}
              options={[
                { value: "ALL", label: "All services" },
                ...serviceTypes.map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          {usersError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm text-red-700">{usersError}</p>
              <Button className="mt-3" size="sm" onClick={() => void loadUsers()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <DataTable
                  data={filteredUsers}
                  columns={userColumns}
                  hideSearch
                  isLoading={usersLoading}
                />
              </div>
              <div className="space-y-3 md:hidden">
                {usersLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))
                ) : filteredUsers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">
                    No users found
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-muted">{user.roleLabel}</p>
                          <p className="text-xs text-muted">
                            {user.mobile || "—"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            isActiveStatus(user.status) ? "active" : "inactive"
                          }
                        >
                          {user.status || "Unknown"}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <AccessSummary
                          catalog={catalog}
                          enabledIds={userAccess[user.id] || []}
                        />
                      </div>
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => openManage(user)}
                      >
                        Manage Access
                      </Button>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </Card>
      )}

      <ServicePermissionForm
        key={`${formMode}-${editing?.id || "new"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        mode={formMode}
        existing={editing}
        serviceTypes={serviceTypes}
        submitting={formSubmitting}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ManageAccessDrawer
        key={`${manageUser?.id || "none"}-${manageQuery.isLoading ? "loading" : "ready"}`}
        open={manageOpen}
        user={manageUser}
        catalog={catalog}
        enabledIds={manageQuery.data?.permissionIds || []}
        loading={manageQuery.isLoading}
        saving={savingAccess}
        error={
          manageQuery.error
            ? manageQuery.error instanceof Error
              ? manageQuery.error.message
              : "Failed to load user permissions"
            : null
        }
        onClose={() => setManageOpen(false)}
        onRetry={() => void manageQuery.refetch()}
        onSave={saveManage}
      />

      <Modal
        isOpen={Boolean(disableTarget)}
        onClose={() => setDisableTarget(null)}
        title="Disable Permission?"
        subtitle={disableTarget?.name}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDisableTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={disabling}
              onClick={() => void handleDisable()}
            >
              Disable Permission
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          Disabling this permission will prevent assigned users from using this
          service.
        </p>
      </Modal>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-[0px_4px_18px_rgba(112,144,176,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2 text-sm font-medium",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
