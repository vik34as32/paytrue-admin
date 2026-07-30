"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Empty,
  Modal,
  Progress,
  Select,
  Skeleton,
  Switch,
  Tag,
} from "antd";
import {
  CheckSquareOutlined,
  BorderOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  CopyOutlined,
  SnippetsOutlined,
  UserSwitchOutlined,
  SaveOutlined,
  ReloadOutlined,
  CloseOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  BankOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileProtectOutlined,
  AppstoreOutlined,
  DownOutlined,
  RightOutlined,
  CrownOutlined,
  ShopOutlined,
  UserOutlined,
  LoginOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { CommissionAntdProvider } from "@/components/commission/CommissionAntdProvider";
import {
  PERMISSION_ROLE_OPTIONS,
  PERMISSION_STATUS_OPTIONS,
  getAllPermissionSlugs,
} from "@/constants/permissionModules";
import {
  getUserPermissionState,
  listPermissionModuleOptions,
  listPermissionModules,
  listPermissionUsersByRole,
  saveUserPermissionState,
} from "@/services/permissionManagementApi";
import { cn, formatDate } from "@/lib/utils";
import type {
  PermissionFiltersValue,
  PermissionModuleDef,
  PermissionRoleType,
  PermissionStatusFilter,
  PermissionUserOption,
} from "@/types/permissions";

const EMPTY_FILTERS: PermissionFiltersValue = {
  role: "",
  userId: "",
  module: "",
  status: "ALL",
};

const CLIPBOARD_PREFIX = "paytrue-permissions:";

const MODULE_ICON: Record<string, ReactNode> = {
  common_dashboard: <AppstoreOutlined />,
  common_wallet: <WalletOutlined />,
  common_profile: <UserOutlined />,
  common_fund_request: <BankOutlined />,
  common_reports: <FileProtectOutlined />,
  common_login_methods: <LoginOutlined />,
  common_notifications: <BellOutlined />,
  admin_users: <TeamOutlined />,
  admin_wallet: <WalletOutlined />,
  admin_fund: <BankOutlined />,
  admin_bank: <BankOutlined />,
  admin_commission: <ThunderboltOutlined />,
  admin_services: <AppstoreOutlined />,
  md_network: <TeamOutlined />,
  md_wallet: <WalletOutlined />,
  md_fund: <BankOutlined />,
  md_transactions: <FileProtectOutlined />,
  dd_network: <TeamOutlined />,
  dd_wallet: <WalletOutlined />,
  dd_fund: <BankOutlined />,
  dd_transactions: <FileProtectOutlined />,
  rt_aeps: <SafetyCertificateOutlined />,
  rt_dmt: <BankOutlined />,
  rt_upi_atm: <MobileOutlined />,
  rt_recharge: <MobileOutlined />,
  rt_bbps: <ThunderboltOutlined />,
  rt_matm: <ShopOutlined />,
  rt_other_services: <AppstoreOutlined />,
};

const ROLE_ACCENT: Record<
  PermissionRoleType,
  { gradient: string; soft: string; chip: string; icon: ReactNode }
> = {
  ADMIN: {
    gradient: "from-[#4318FF] to-[#6B8CFF]",
    soft: "bg-[#4318FF]/8 text-[#4318FF] border-[#4318FF]/20",
    chip: "geekblue",
    icon: <CrownOutlined />,
  },
  MASTER_DISTRIBUTOR: {
    gradient: "from-[#0E9F6E] to-[#31C48D]",
    soft: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    chip: "green",
    icon: <TeamOutlined />,
  },
  DISTRIBUTOR: {
    gradient: "from-[#1C64F2] to-[#3F83F8]",
    soft: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    chip: "blue",
    icon: <ShopOutlined />,
  },
  RETAILER: {
    gradient: "from-[#E3A008] to-[#FACA15]",
    soft: "bg-amber-500/10 text-amber-700 border-amber-500/25",
    chip: "gold",
    icon: <MobileOutlined />,
  },
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function PermissionManagementContent() {
  const { message, modal } = App.useApp();

  const [draftFilters, setDraftFilters] =
    useState<PermissionFiltersValue>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<PermissionFiltersValue>(EMPTY_FILTERS);

  const [users, setUsers] = useState<PermissionUserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<PermissionUserOption | null>(
    null
  );
  const [enabledSlugs, setEnabledSlugs] = useState<string[]>([]);
  const [baselineSlugs, setBaselineSlugs] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [findUserOpen, setFindUserOpen] = useState(true);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneRole, setCloneRole] = useState<PermissionRoleType | "">("");
  const [cloneUsers, setCloneUsers] = useState<PermissionUserOption[]>([]);
  const [cloneUserId, setCloneUserId] = useState<string>("");
  const [cloneLoading, setCloneLoading] = useState(false);

  const activeRole = selectedUser?.role || draftFilters.role || "";

  const modules = useMemo(
    () => (activeRole ? listPermissionModules(activeRole) : []),
    [activeRole]
  );
  const moduleOptions = useMemo(
    () => listPermissionModuleOptions(activeRole || undefined),
    [activeRole]
  );
  const allSlugs = useMemo(() => getAllPermissionSlugs(modules), [modules]);

  useEffect(() => {
    setExpandedKeys(modules.map((module) => module.key));
  }, [modules]);

  const isDirty = useMemo(() => {
    if (!selectedUser) return false;
    if (enabledSlugs.length !== baselineSlugs.length) return true;
    const baseline = new Set(baselineSlugs);
    return enabledSlugs.some((slug) => !baseline.has(slug));
  }, [baselineSlugs, enabledSlugs, selectedUser]);

  const loadUsersForRole = useCallback(async (role: PermissionRoleType | "") => {
    if (!role) {
      setUsers([]);
      setUsersError(null);
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
    try {
      const list = await listPermissionUsersByRole(role);
      setUsers(list);
    } catch (err) {
      setUsers([]);
      setUsersError(
        err instanceof Error ? err.message : "Failed to load users"
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsersForRole(draftFilters.role);
  }, [draftFilters.role, loadUsersForRole]);

  useEffect(() => {
    if (!cloneRole) {
      setCloneUsers([]);
      return;
    }
    setCloneLoading(true);
    void listPermissionUsersByRole(cloneRole)
      .then(setCloneUsers)
      .catch(() => setCloneUsers([]))
      .finally(() => setCloneLoading(false));
  }, [cloneRole]);

  const loadUserPermissions = useCallback(
    async (user: PermissionUserOption) => {
      setPermissionsLoading(true);
      setPermissionsError(null);
      try {
        const state = await getUserPermissionState(user.id, user.role);
        const allowed = new Set(
          getAllPermissionSlugs(listPermissionModules(user.role))
        );
        const slugs = state.enabledSlugs.filter((slug) => allowed.has(slug));
        setEnabledSlugs(slugs);
        setBaselineSlugs(slugs);
      } catch (err) {
        setEnabledSlugs([]);
        setBaselineSlugs([]);
        setPermissionsError(
          err instanceof Error ? err.message : "Failed to load permissions"
        );
      } finally {
        setPermissionsLoading(false);
      }
    },
    []
  );

  const handleSearch = async () => {
    if (!draftFilters.role) {
      message.warning("Please select a role");
      return;
    }
    if (!draftFilters.userId) {
      message.warning("Please select a user");
      return;
    }

    const user = users.find((item) => item.id === draftFilters.userId) || null;
    if (!user) {
      message.error("Selected user not found");
      return;
    }

    setAppliedFilters({ ...draftFilters });
    setSelectedUser(user);
    setFindUserOpen(false);
    await loadUserPermissions(user);
  };

  const handleResetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSelectedUser(null);
    setEnabledSlugs([]);
    setBaselineSlugs([]);
    setPermissionsError(null);
    setUsers([]);
    setFindUserOpen(true);
  };

  const toggleSlug = (slug: string, checked: boolean) => {
    setEnabledSlugs((prev) => {
      if (checked) return prev.includes(slug) ? prev : [...prev, slug];
      return prev.filter((item) => item !== slug);
    });
  };

  const setModuleEnabled = (module: PermissionModuleDef, enabled: boolean) => {
    const moduleSlugs = module.permissions.map((item) => item.slug);
    setEnabledSlugs((prev) => {
      const without = prev.filter((slug) => !moduleSlugs.includes(slug));
      return enabled ? [...without, ...moduleSlugs] : without;
    });
  };

  const enableAll = () => setEnabledSlugs([...allSlugs]);
  const disableAll = () => setEnabledSlugs([]);
  const expandAll = () => setExpandedKeys(modules.map((module) => module.key));
  const collapseAll = () => setExpandedKeys([]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleCopy = async () => {
    if (!selectedUser) return;
    const payload = `${CLIPBOARD_PREFIX}${JSON.stringify(enabledSlugs)}`;
    try {
      await navigator.clipboard.writeText(payload);
      message.success("Permissions copied");
    } catch {
      message.error("Unable to copy permissions");
    }
  };

  const handlePaste = async () => {
    if (!selectedUser) return;
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text.startsWith(CLIPBOARD_PREFIX)) {
        message.warning("Clipboard does not contain permission data");
        return;
      }
      const parsed = JSON.parse(
        text.slice(CLIPBOARD_PREFIX.length)
      ) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Invalid payload");
      const valid = new Set(allSlugs);
      const next = parsed
        .filter((item): item is string => typeof item === "string")
        .filter((slug) => valid.has(slug));
      setEnabledSlugs(next);
      message.success("Permissions pasted");
    } catch {
      message.error("Unable to paste permissions");
    }
  };

  const roleTitle =
    PERMISSION_ROLE_OPTIONS.find((option) => option.value === activeRole)
      ?.label || "Role";

  const handleCloneApply = async () => {
    if (!selectedUser || !cloneUserId) {
      message.warning("Select a source user to clone from");
      return;
    }
    const source = cloneUsers.find((user) => user.id === cloneUserId);
    if (!source) return;
    try {
      const state = await getUserPermissionState(source.id, source.role);
      const allowed = new Set(allSlugs);
      const next = state.enabledSlugs.filter((slug) => allowed.has(slug));
      setEnabledSlugs(next);
      setCloneOpen(false);
      setCloneRole("");
      setCloneUserId("");
      message.success(
        `Permissions cloned from ${source.name} (${next.length} applicable to ${roleTitle})`
      );
    } catch {
      message.error("Unable to clone permissions");
    }
  };

  const handleSave = () => {
    if (!selectedUser) return;

    modal.confirm({
      title: "Update Permissions",
      content: `Are you sure you want to update permissions for ${selectedUser.name}?`,
      okText: "Yes, Update",
      cancelText: "Cancel",
      okButtonProps: { type: "primary", className: "!h-10 !rounded-xl" },
      cancelButtonProps: { className: "!h-10 !rounded-xl" },
      centered: true,
      onOk: async () => {
        setSaving(true);
        try {
          const saved = await saveUserPermissionState(
            selectedUser.id,
            enabledSlugs
          );
          setEnabledSlugs(saved.enabledSlugs);
          setBaselineSlugs(saved.enabledSlugs);
          message.success("Permissions updated successfully.");
        } catch {
          message.error("Unable to update permissions.");
          throw new Error("save failed");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleResetPermissions = () => {
    setEnabledSlugs([...baselineSlugs]);
    message.info("Changes discarded");
  };

  const filteredModules = useMemo(() => {
    const moduleFilter = appliedFilters.module;
    const status = appliedFilters.status as PermissionStatusFilter;
    const enabledSet = new Set(enabledSlugs);

    return modules
      .filter((module) => !moduleFilter || module.key === moduleFilter)
      .map((module) => {
        const permissions = module.permissions.filter((permission) => {
          const enabled = enabledSet.has(permission.slug);
          if (status === "ENABLED") return enabled;
          if (status === "DISABLED") return !enabled;
          return true;
        });
        return { ...module, permissions };
      })
      .filter((module) => module.permissions.length > 0 || status === "ALL");
  }, [appliedFilters.module, appliedFilters.status, enabledSlugs, modules]);

  const filteredCommonModules = useMemo(
    () => filteredModules.filter((module) => module.section !== "role"),
    [filteredModules]
  );
  const filteredRoleModules = useMemo(
    () => filteredModules.filter((module) => module.section === "role"),
    [filteredModules]
  );

  const enabledCount = enabledSlugs.filter((slug) =>
    allSlugs.includes(slug)
  ).length;
  const totalCount = allSlugs.length;
  const coverage =
    totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

  const userSelectOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.name}${user.mobile ? ` — ${user.mobile}` : ""}${
          user.userCode ? ` (${user.userCode})` : ""
        }`,
      })),
    [users]
  );

  const accent = activeRole
    ? ROLE_ACCENT[activeRole as PermissionRoleType]
    : null;

  return (
    <div className="page-container relative space-y-6 pb-8">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden rounded-b-[40px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(67,24,255,0.14),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(5,205,153,0.10),transparent_45%),linear-gradient(180deg,#f4f7fe_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.18),transparent_50%),linear-gradient(180deg,#0a0f1e_0%,transparent_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(27,37,89,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(27,37,89,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_-28px_rgba(67,24,255,0.35)] backdrop-blur-xl dark:border-border dark:bg-card/80"
      >
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-[#4318FF]/20 to-[#05CD99]/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Dashboard / Permission Management
              </p>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4318FF] to-[#6B8CFF] text-2xl text-white shadow-lg shadow-[#4318FF]/30">
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Permission Management
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Enterprise access control for Admin, Master Distributor,
                    Distributor & Retailer — toggle any fintech feature in one
                    click.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                "Role-based catalogs",
                "Common + specific",
                "Live TRUE / FALSE",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary"
                >
                  {chip}
                </span>
              ))}
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                className="!h-10 !rounded-xl !font-semibold shadow-md shadow-primary/25"
                onClick={() => setFindUserOpen(true)}
              >
                Find User
              </Button>
              {isDirty ? (
                <Tag color="orange" className="m-0 rounded-full px-3 py-0.5">
                  Unsaved changes
                </Tag>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      <Modal
        open={findUserOpen}
        onCancel={() => setFindUserOpen(false)}
        footer={null}
        width={920}
        centered
        destroyOnClose
        className="permission-find-user-modal"
        styles={{
          body: { paddingTop: 8 },
        }}
        title={
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SearchOutlined />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Find User</p>
              <p className="text-[11px] font-normal text-muted">
                Select role → user → load permission matrix
              </p>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 pt-2 md:grid-cols-2">
          <FilterField label="Role">
            <Select
              className="w-full permission-select"
              size="large"
              placeholder="Select role"
              value={draftFilters.role || undefined}
              allowClear
              options={PERMISSION_ROLE_OPTIONS.map((option) => ({
                value: option.value,
                label: (
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-xs",
                        ROLE_ACCENT[option.value].soft
                      )}
                    >
                      {ROLE_ACCENT[option.value].icon}
                    </span>
                    {option.label}
                  </span>
                ),
              }))}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  role: (value as PermissionRoleType) || "",
                  userId: "",
                }))
              }
            />
          </FilterField>

          <FilterField label="User">
            <Select
              className="w-full"
              size="large"
              showSearch
              allowClear
              placeholder={
                !draftFilters.role
                  ? "Select role first"
                  : usersLoading
                    ? "Loading users..."
                    : "Search name / mobile / code"
              }
              disabled={!draftFilters.role || usersLoading}
              loading={usersLoading}
              optionFilterProp="label"
              value={draftFilters.userId || undefined}
              options={userSelectOptions}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  userId: value || "",
                }))
              }
              notFoundContent={
                usersError ? "Failed to load users" : "No users found"
              }
            />
          </FilterField>

          <FilterField label="Module">
            <Select
              className="w-full"
              size="large"
              placeholder="All modules"
              value={draftFilters.module || ""}
              options={moduleOptions}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  module: value || "",
                }))
              }
            />
          </FilterField>

          <FilterField label="Status">
            <Select
              className="w-full"
              size="large"
              value={draftFilters.status}
              options={[...PERMISSION_STATUS_OPTIONS]}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  status: value as PermissionStatusFilter,
                }))
              }
            />
          </FilterField>
        </div>

        {usersError ? (
          <Alert
            className="mt-4 rounded-2xl"
            type="error"
            showIcon
            message={usersError}
            action={
              <Button
                size="small"
                onClick={() => void loadUsersForRole(draftFilters.role)}
              >
                Retry
              </Button>
            }
          />
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            className="!h-11 !rounded-xl !px-6 !font-semibold shadow-md shadow-primary/25"
            onClick={() => void handleSearch()}
          >
            Load Permissions
          </Button>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            className="!h-11 !rounded-xl"
            onClick={handleResetFilters}
          >
            Reset
          </Button>
        </div>
      </Modal>

      {!selectedUser ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-primary/25 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur dark:bg-card/60"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4318FF]/15 to-[#05CD99]/15 text-2xl text-primary">
            <SafetyCertificateOutlined />
          </div>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-muted">
                Open <strong className="text-foreground">Find User</strong> to
                select a role and load the permission matrix
              </span>
            }
          >
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              className="!mt-2 !h-11 !rounded-xl !font-semibold"
              onClick={() => setFindUserOpen(true)}
            >
              Find User
            </Button>
          </Empty>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedUser.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* User + coverage */}
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_16px_40px_-28px_rgba(27,37,89,0.5)] dark:bg-card">
                <div
                  className={cn(
                    "h-1.5 w-full bg-gradient-to-r",
                    accent?.gradient || "from-primary to-secondary"
                  )}
                />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div
                      className={cn(
                        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-lg",
                        accent?.gradient || "from-primary to-secondary"
                      )}
                    >
                      {initials(selectedUser.name) || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-bold text-foreground">
                          {selectedUser.name}
                        </h2>
                        <Tag
                          color={accent?.chip || "purple"}
                          className="m-0 rounded-full px-2.5"
                        >
                          {selectedUser.roleLabel}
                        </Tag>
                        <Tag
                          color={
                            (selectedUser.status || "").toUpperCase() ===
                            "ACTIVE"
                              ? "success"
                              : "default"
                          }
                          className="m-0 rounded-full"
                        >
                          {selectedUser.status || "—"}
                        </Tag>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {selectedUser.id}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <MetaChip label="Mobile" value={selectedUser.mobile || "—"} />
                        <MetaChip label="Email" value={selectedUser.email || "—"} />
                        <MetaChip
                          label="Created"
                          value={
                            selectedUser.createdAt
                              ? formatDate(selectedUser.createdAt)
                              : "—"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-gradient-to-br from-white to-[#f4f7fe] p-5 shadow-[0_16px_40px_-28px_rgba(67,24,255,0.35)] dark:from-card dark:to-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Access Coverage
                </p>
                <div className="mt-3 flex items-center gap-5">
                  <Progress
                    type="dashboard"
                    percent={coverage}
                    size={108}
                    strokeColor={{
                      "0%": "#4318FF",
                      "100%": "#05CD99",
                    }}
                    format={(percent) => (
                      <span className="text-lg font-bold text-foreground">
                        {percent}%
                      </span>
                    )}
                  />
                  <div className="space-y-2">
                    <StatLine
                      label="Enabled"
                      value={String(enabledCount)}
                      tone="success"
                    />
                    <StatLine
                      label="Disabled"
                      value={String(Math.max(totalCount - enabledCount, 0))}
                      tone="muted"
                    />
                    <StatLine
                      label="Total"
                      value={String(totalCount)}
                      tone="primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-3xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur dark:bg-card">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">Quick Actions</p>
                <span className="text-[11px] text-muted">
                  Bulk controls for {roleTitle}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionChip
                  icon={<SearchOutlined />}
                  label="Change User"
                  onClick={() => setFindUserOpen(true)}
                  highlight
                />
                <ActionChip
                  icon={<CheckSquareOutlined />}
                  label="Enable All"
                  onClick={enableAll}
                />
                <ActionChip
                  icon={<BorderOutlined />}
                  label="Disable All"
                  onClick={disableAll}
                />
                <ActionChip
                  icon={<ExpandAltOutlined />}
                  label="Expand All"
                  onClick={expandAll}
                />
                <ActionChip
                  icon={<ShrinkOutlined />}
                  label="Collapse All"
                  onClick={collapseAll}
                />
                <ActionChip
                  icon={<CopyOutlined />}
                  label="Copy"
                  onClick={() => void handleCopy()}
                />
                <ActionChip
                  icon={<SnippetsOutlined />}
                  label="Paste"
                  onClick={() => void handlePaste()}
                />
                <ActionChip
                  icon={<UserSwitchOutlined />}
                  label="Clone From User"
                  onClick={() => setCloneOpen(true)}
                  highlight
                />
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              {permissionsLoading ? (
                <div className="space-y-4 rounded-3xl border border-border bg-white p-6 dark:bg-card">
                  <Skeleton active paragraph={{ rows: 4 }} />
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ) : permissionsError ? (
                <Alert
                  className="rounded-3xl"
                  type="error"
                  showIcon
                  message={permissionsError}
                  action={
                    <Button
                      size="small"
                      onClick={() => void loadUserPermissions(selectedUser)}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : filteredModules.length === 0 ? (
                <div className="rounded-3xl border border-border bg-white py-12 dark:bg-card">
                  <Empty description="No permissions match the selected filters" />
                </div>
              ) : (
                <>
                  {filteredCommonModules.length > 0 ? (
                    <ModuleSection
                      title="Common Permissions"
                      subtitle="Shared across roles — still role-aware where needed"
                      badge="COMMON"
                      badgeClass="bg-primary/10 text-primary border-primary/20"
                      modules={filteredCommonModules}
                      enabledSlugs={enabledSlugs}
                      expandedKeys={expandedKeys}
                      onToggleExpand={toggleExpanded}
                      onToggleSlug={toggleSlug}
                      onSetModuleEnabled={setModuleEnabled}
                    />
                  ) : null}

                  {filteredRoleModules.length > 0 ? (
                    <ModuleSection
                      title={`${roleTitle} Specific`}
                      subtitle={`Exclusive fintech controls for ${roleTitle}`}
                      badge={roleTitle.toUpperCase()}
                      badgeClass={
                        accent?.soft ||
                        "bg-primary/10 text-primary border-primary/20"
                      }
                      modules={filteredRoleModules}
                      enabledSlugs={enabledSlugs}
                      expandedKeys={expandedKeys}
                      onToggleExpand={toggleExpanded}
                      onToggleSlug={toggleSlug}
                      onSetModuleEnabled={setModuleEnabled}
                    />
                  ) : null}
                </>
              )}
            </div>

            {/* Sticky footer — stays in page flow so modules never hide underneath */}
            <div className="sticky bottom-0 z-40 mt-2 rounded-3xl border border-border/80 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(27,37,89,0.28)] backdrop-blur-xl dark:bg-card/95 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isDirty
                      ? "You have unsaved permission changes"
                      : "All permissions synced"}
                  </p>
                  <p className="text-[11px] text-muted">
                    {enabledCount} enabled · {totalCount - enabledCount}{" "}
                    disabled · {coverage}% coverage
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={saving}
                    disabled={!isDirty || permissionsLoading}
                    className="!h-11 !rounded-xl !px-6 !font-semibold shadow-md shadow-primary/25"
                    onClick={handleSave}
                  >
                    Save Permissions
                  </Button>
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    disabled={!isDirty || saving}
                    className="!h-11 !rounded-xl"
                    onClick={handleResetPermissions}
                  >
                    Reset
                  </Button>
                  <Button
                    size="large"
                    icon={<CloseOutlined />}
                    disabled={saving}
                    className="!h-11 !rounded-xl"
                    onClick={handleResetFilters}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <Modal
        title={
          <span className="flex items-center gap-2">
            <UserSwitchOutlined className="text-primary" />
            Clone From Another User
          </span>
        }
        open={cloneOpen}
        onCancel={() => {
          setCloneOpen(false);
          setCloneRole("");
          setCloneUserId("");
        }}
        onOk={() => void handleCloneApply()}
        okText="Clone Permissions"
        centered
        destroyOnClose
        okButtonProps={{ className: "!rounded-xl" }}
        cancelButtonProps={{ className: "!rounded-xl" }}
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted">
            Copy enabled permissions from another user into the current editor.
            Only permissions valid for <strong>{roleTitle}</strong> will apply.
          </p>
          <FilterField label="Source Role">
            <Select
              className="w-full"
              size="large"
              placeholder="Select role"
              options={PERMISSION_ROLE_OPTIONS}
              value={cloneRole || undefined}
              onChange={(value) => {
                setCloneRole(value as PermissionRoleType);
                setCloneUserId("");
              }}
            />
          </FilterField>
          <FilterField label="Source User">
            <Select
              className="w-full"
              size="large"
              showSearch
              optionFilterProp="label"
              loading={cloneLoading}
              disabled={!cloneRole}
              placeholder="Select source user"
              value={cloneUserId || undefined}
              options={cloneUsers.map((user) => ({
                value: user.id,
                label: `${user.name}${user.mobile ? ` — ${user.mobile}` : ""}`,
              }))}
              onChange={(value) => setCloneUserId(value || "")}
            />
          </FilterField>
        </div>
      </Modal>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/80 bg-[#f8fafc] px-3 py-2.5 dark:bg-background/50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "muted" | "primary";
}) {
  const color =
    tone === "success"
      ? "text-[#05CD99]"
      : tone === "primary"
        ? "text-primary"
        : "text-muted";
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("text-lg font-bold", color)}>{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition",
        highlight
          ? "border-primary/30 bg-primary text-white shadow-md shadow-primary/25 hover:brightness-110"
          : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5 dark:bg-card"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ModuleSection({
  title,
  subtitle,
  badge,
  badgeClass,
  modules,
  enabledSlugs,
  expandedKeys,
  onToggleExpand,
  onToggleSlug,
  onSetModuleEnabled,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  modules: PermissionModuleDef[];
  enabledSlugs: string[];
  expandedKeys: string[];
  onToggleExpand: (key: string) => void;
  onToggleSlug: (slug: string, checked: boolean) => void;
  onSetModuleEnabled: (module: PermissionModuleDef, enabled: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                badgeClass
              )}
            >
              {badge}
            </span>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
          </div>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((module, index) => {
          const open = expandedKeys.includes(module.key);
          const moduleSlugs = module.permissions.map((item) => item.slug);
          const enabledInModule = moduleSlugs.filter((slug) =>
            enabledSlugs.includes(slug)
          ).length;
          const allEnabled =
            moduleSlugs.length > 0 && enabledInModule === moduleSlugs.length;
          const someEnabled = enabledInModule > 0 && !allEnabled;
          const icon = MODULE_ICON[module.key] || <AppstoreOutlined />;

          return (
            <motion.div
              key={module.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.2) }}
              className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_10px_30px_-24px_rgba(27,37,89,0.55)] dark:bg-card"
            >
              <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <button
                  type="button"
                  onClick={() => onToggleExpand(module.key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4318FF]/12 to-[#05CD99]/10 text-base text-primary">
                    {icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">
                        {module.label}
                      </span>
                      <span className="rounded-full bg-[#f4f7fe] px-2 py-0.5 text-[10px] font-semibold text-muted dark:bg-background">
                        {enabledInModule}/{moduleSlugs.length}
                      </span>
                    </span>
                    {module.description ? (
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {module.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="ml-auto text-muted sm:hidden">
                    {open ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>

                <div className="flex items-center gap-3 sm:pl-2">
                  <label
                    className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={allEnabled}
                      indeterminate={someEnabled}
                      onChange={(event) =>
                        onSetModuleEnabled(module, event.target.checked)
                      }
                    />
                    Entire module
                  </label>
                  <button
                    type="button"
                    className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-primary/5 sm:inline-flex"
                    onClick={() => onToggleExpand(module.key)}
                  >
                    {open ? <DownOutlined /> : <RightOutlined />}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    key="body"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="grid gap-2.5 border-t border-border/60 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                      {module.permissions.map((permission) => {
                        const checked = enabledSlugs.includes(permission.slug);
                        return (
                          <button
                            key={permission.slug}
                            type="button"
                            onClick={() =>
                              onToggleSlug(permission.slug, !checked)
                            }
                            className={cn(
                              "group flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200",
                              checked
                                ? "border-primary/35 bg-gradient-to-br from-primary/8 to-[#05CD99]/5 shadow-[0_8px_20px_-14px_rgba(67,24,255,0.55)]"
                                : "border-border bg-[#fbfcff] hover:border-primary/25 hover:bg-white dark:bg-background/40"
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-foreground">
                                {permission.label}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                                    checked
                                      ? "bg-[#05CD99]/15 text-[#04966f]"
                                      : "bg-muted/20 text-muted"
                                  )}
                                >
                                  {checked ? "TRUE" : "FALSE"}
                                </span>
                                <span className="truncate font-mono text-[10px] text-muted">
                                  {permission.slug}
                                </span>
                              </span>
                            </span>
                            <Switch
                              size="small"
                              checked={checked}
                              onClick={(_, event) => event.stopPropagation()}
                              onChange={(value) =>
                                onToggleSlug(permission.slug, value)
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function PermissionManagementView() {
  return (
    <CommissionAntdProvider>
      <PermissionManagementContent />
    </CommissionAntdProvider>
  );
}
