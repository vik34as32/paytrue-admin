"use client";

import { useMemo, useState } from "react";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "sonner";
import { ServiceSummaryCards } from "@/components/service-master/ServiceSummaryCards";
import {
  ServiceFilters,
  ServiceFiltersValue,
} from "@/components/service-master/ServiceFilters";
import { ServiceTable } from "@/components/service-master/ServiceTable";
import { ServiceTree } from "@/components/service-master/ServiceTree";
import { ServiceDialog } from "@/components/service-master/ServiceDialog";
import { ServiceViewDialog } from "@/components/service-master/ServiceViewDialog";
import {
  ConfirmDialog,
  DeleteDialog,
} from "@/components/service-master/DeleteDialog";
import {
  useActiveServices,
  useServiceDetail,
  useServiceMasterMutations,
  useServicesList,
  useServiceTree,
} from "@/hooks/service-master/useServiceMaster";
import { computeServiceSummary } from "@/services/serviceMasterApi";
import {
  flattenServices,
  getParentServices,
} from "@/lib/serviceMasterSuggestions";
import type { ServiceMaster, ServiceStatus } from "@/types/serviceMaster";
import type { ServiceMasterFormValues } from "@/validations/serviceMaster";

const EMPTY_FILTERS: ServiceFiltersValue = {
  search: "",
  status: "ALL",
  parentId: "",
};

function toPayload(values: ServiceMasterFormValues) {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description?.trim() || undefined,
    parentId: values.parentId || null,
    displayOrder: values.displayOrder ?? 0,
    status: values.status,
  };
}

export function ServiceMasterPage() {
  const [tab, setTab] = useState(0);
  const [draftFilters, setDraftFilters] =
    useState<ServiceFiltersValue>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ServiceFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingService, setEditingService] = useState<ServiceMaster | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewServiceId, setViewServiceId] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<ServiceMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceMaster | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: appliedFilters.search.trim() || undefined,
      status: appliedFilters.status,
      parentId: appliedFilters.parentId || undefined,
    }),
    [page, pageSize, appliedFilters]
  );

  const { data: listData, isLoading: isListLoading, isFetching } =
    useServicesList(listParams, tab === 0);
  const { data: treeData = [], isLoading: isTreeLoading } = useServiceTree(
    tab === 1 || tab === 0
  );
  const { data: activeServices = [], isLoading: isLoadingParents } =
    useActiveServices();

  const existingServices = useMemo(() => {
    const fromTree = flattenServices(treeData);
    if (fromTree.length) return fromTree;
    const merged = [
      ...(listData?.data || []),
      ...activeServices,
    ];
    const byId = new Map(merged.map((service) => [service.id, service]));
    return Array.from(byId.values());
  }, [treeData, listData?.data, activeServices]);

  const parentFilterOptions = useMemo(
    () => getParentServices(activeServices),
    [activeServices]
  );

  const parentFormOptions = useMemo(
    () => getParentServices(activeServices),
    [activeServices]
  );

  const { data: editDetail, isLoading: isEditLoading } = useServiceDetail(
    dialogMode === "edit" ? editingService?.id ?? null : null,
    dialogOpen && dialogMode === "edit"
  );

  const { data: viewDetail, isLoading: isViewLoading } = useServiceDetail(
    viewServiceId,
    viewOpen
  );

  const {
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
  } = useServiceMasterMutations();

  const summaryStats = useMemo(() => {
    const flat = flattenServices(treeData);
    if (flat.length) return computeServiceSummary(flat);
    return computeServiceSummary(listData?.data || []);
  }, [treeData, listData?.data]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingService(null);
    setDialogOpen(true);
  };

  const openEditDialog = (service: ServiceMaster) => {
    setDialogMode("edit");
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleSave = async (values: ServiceMasterFormValues) => {
    try {
      const payload = toPayload(values);
      if (dialogMode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success("Service created successfully");
      } else if (editingService) {
        await updateMutation.mutateAsync({
          id: editingService.id,
          payload,
        });
        toast.success("Service updated successfully");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save service"
      );
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    const nextStatus: ServiceStatus =
      statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await statusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextStatus,
      });
      toast.success("Service status updated");
      setStatusTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Service deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete service"
      );
    }
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters(draftFilters);
  };

  const handleReset = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <Box className="page-container" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
        }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Service Master
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage all fintech services and sub-services.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Service
        </Button>
      </Stack>

      <ServiceSummaryCards
        stats={summaryStats}
        isLoading={isTreeLoading && !treeData.length}
      />

      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab label="Service List" />
        <Tab label="Service Tree" />
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={2}>
          <ServiceFilters
            value={draftFilters}
            parentOptions={parentFilterOptions}
            isLoadingParents={isLoadingParents}
            onChange={setDraftFilters}
            onSearch={handleSearch}
            onReset={handleReset}
          />
          <ServiceTable
            rows={listData?.data || []}
            total={listData?.total || 0}
            page={page}
            pageSize={pageSize}
            isLoading={isListLoading || isFetching}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onView={(service) => {
              setViewServiceId(service.id);
              setViewOpen(true);
            }}
            onEdit={openEditDialog}
            onToggleStatus={setStatusTarget}
            onDelete={setDeleteTarget}
          />
        </Stack>
      ) : (
        <ServiceTree tree={treeData} isLoading={isTreeLoading} />
      )}

      <ServiceDialog
        open={dialogOpen}
        mode={dialogMode}
        serviceId={editingService?.id}
        initialData={dialogMode === "edit" ? editDetail ?? editingService : null}
        parentOptions={parentFormOptions}
        existingServices={existingServices}
        isLoadingDetail={dialogMode === "edit" && isEditLoading}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      />

      <ServiceViewDialog
        open={viewOpen}
        service={viewDetail ?? null}
        isLoading={isViewLoading}
        onClose={() => {
          setViewOpen(false);
          setViewServiceId(null);
        }}
      />

      <ConfirmDialog
        open={!!statusTarget}
        title="Change Status"
        message="Are you sure you want to change the status?"
        confirmLabel="Yes, Change"
        isLoading={statusMutation.isPending}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />

      <DeleteDialog
        open={!!deleteTarget}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
