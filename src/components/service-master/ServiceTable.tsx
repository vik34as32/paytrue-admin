"use client";

import { useMemo } from "react";
import { Card, Box, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { StatusChip } from "@/components/service-master/StatusChip";
import { formatDate } from "@/lib/utils";
import type { ServiceMaster } from "@/types/serviceMaster";

interface ServiceTableProps {
  rows: ServiceMaster[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (service: ServiceMaster) => void;
  onEdit: (service: ServiceMaster) => void;
  onToggleStatus: (service: ServiceMaster) => void;
  onDelete: (service: ServiceMaster) => void;
}

export function ServiceTable({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ServiceTableProps) {
  const columns = useMemo<GridColDef<ServiceMaster>[]>(
    () => [
      {
        field: "rowNumber",
        headerName: "#",
        width: 70,
        sortable: false,
        valueGetter: (_, row) => {
          const index = rows.findIndex((item) => item.id === row.id);
          return index >= 0 ? (page - 1) * pageSize + index + 1 : "";
        },
      },
      { field: "name", headerName: "Service Name", flex: 1.2, minWidth: 160 },
      { field: "code", headerName: "Service Code", flex: 1, minWidth: 130 },
      {
        field: "parentName",
        headerName: "Parent Service",
        flex: 1,
        minWidth: 140,
        valueGetter: (_, row) => row.parentName || "—",
      },
      {
        field: "type",
        headerName: "Type",
        width: 130,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.type === "MAIN" ? "Main Service" : "Sub Service"}
            color={row.type === "MAIN" ? "primary" : "secondary"}
            variant="outlined"
          />
        ),
      },
      {
        field: "displayOrder",
        headerName: "Display Order",
        width: 120,
        type: "number",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: ({ row }) => <StatusChip status={row.status} />,
      },
      {
        field: "createdAt",
        headerName: "Created Date",
        flex: 1,
        minWidth: 140,
        valueGetter: (_, row) =>
          row.createdAt ? formatDate(row.createdAt) : "—",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => onView(row)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.status === "ACTIVE" ? "Deactivate" : "Activate"}>
              <IconButton size="small" onClick={() => onToggleStatus(row)}>
                {row.status === "ACTIVE" ? (
                  <ToggleOffOutlinedIcon fontSize="small" />
                ) : (
                  <ToggleOnOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [rows, page, pageSize, onView, onEdit, onToggleStatus, onDelete]
  );

  return (
    <Card sx={{ overflow: "hidden" }}>
      <Box sx={{ width: "100%", minHeight: 480 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page: page - 1, pageSize }}
          onPaginationModelChange={(model) => {
            if (model.pageSize !== pageSize) {
              onPageSizeChange(model.pageSize);
            }
            onPageChange(model.page + 1);
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              zIndex: 1,
            },
          }}
        />
      </Box>
    </Card>
  );
}
