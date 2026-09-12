"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { HierarchyListUser } from "@/types/hierarchyManagement";
import { statusBadgeVariant } from "@/lib/hierarchy/display";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

interface BaseTabProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  total: number;
  totalPages: number;
  rows: HierarchyListUser[];
}

interface MasterDistributorsTabProps extends BaseTabProps {
  onViewHierarchy: (user: HierarchyListUser) => void;
}

export function MasterDistributorsTab({
  search,
  onSearchChange,
  status,
  onStatusChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  total,
  totalPages,
  rows,
  onViewHierarchy,
}: MasterDistributorsTabProps) {
  const columns: ColumnDef<HierarchyListUser>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (page - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted">{row.original.email || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "userCode",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.userCode || row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "distributors",
      header: "Distributors",
      cell: ({ row }) => row.original.distributorCount ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status ? (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewHierarchy(row.original)}
        >
          View Hierarchy
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder="Search name, ID, mobile..."
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          label=""
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        isLoading={isLoading}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        pageSize={pageSize}
        totalRows={total}
        onPageChange={(idx) => onPageChange(idx + 1)}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 30]}
      />
    </div>
  );
}

interface DistributorsTabProps extends BaseTabProps {
  masterDistributorId: string;
  onMasterDistributorChange: (value: string) => void;
  masterOptions: { value: string; label: string }[];
  onViewHierarchy: (user: HierarchyListUser) => void;
  onReassign: (user: HierarchyListUser) => void;
  canReassign: boolean;
}

export function DistributorsTab({
  search,
  onSearchChange,
  status,
  onStatusChange,
  masterDistributorId,
  onMasterDistributorChange,
  masterOptions,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  total,
  totalPages,
  rows,
  onViewHierarchy,
  onReassign,
  canReassign,
}: DistributorsTabProps) {
  const columns: ColumnDef<HierarchyListUser>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (page - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Distributor",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted">{row.original.mobile || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "userCode",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.userCode || row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "md",
      header: "Master Distributor",
      cell: ({ row }) =>
        row.original.masterDistributor?.name ||
        row.original.masterDistributor?.userCode ||
        "—",
    },
    {
      id: "retailers",
      header: "Retailers",
      cell: ({ row }) => row.original.retailerCount ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status ? (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewHierarchy(row.original)}
          >
            View Hierarchy
          </Button>
          {canReassign ? (
            <Button size="sm" onClick={() => onReassign(row.original)}>
              Reassign Distributor
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder="Search name, ID, mobile..."
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          value={masterDistributorId}
          onChange={(e) => onMasterDistributorChange(e.target.value)}
          options={[
            { value: "", label: "All master distributors" },
            ...masterOptions,
          ]}
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        isLoading={isLoading}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        pageSize={pageSize}
        totalRows={total}
        onPageChange={(idx) => onPageChange(idx + 1)}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 30]}
      />
    </div>
  );
}

interface RetailersTabProps extends BaseTabProps {
  masterDistributorId: string;
  onMasterDistributorChange: (value: string) => void;
  distributorId: string;
  onDistributorChange: (value: string) => void;
  masterOptions: { value: string; label: string }[];
  distributorOptions: { value: string; label: string }[];
  onViewHierarchy: (user: HierarchyListUser) => void;
  onReassign: (user: HierarchyListUser) => void;
  canReassign: boolean;
}

export function RetailersTab({
  search,
  onSearchChange,
  status,
  onStatusChange,
  masterDistributorId,
  onMasterDistributorChange,
  distributorId,
  onDistributorChange,
  masterOptions,
  distributorOptions,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  total,
  totalPages,
  rows,
  onViewHierarchy,
  onReassign,
  canReassign,
}: RetailersTabProps) {
  const columns: ColumnDef<HierarchyListUser>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (page - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Retailer",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted">{row.original.mobile || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "userCode",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.userCode || row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "dd",
      header: "Distributor",
      cell: ({ row }) =>
        row.original.distributor?.name ||
        row.original.distributor?.userCode ||
        "—",
    },
    {
      id: "md",
      header: "Master Distributor",
      cell: ({ row }) =>
        row.original.masterDistributor?.name ||
        row.original.masterDistributor?.userCode ||
        "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status ? (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewHierarchy(row.original)}
          >
            View Hierarchy
          </Button>
          {canReassign ? (
            <Button size="sm" onClick={() => onReassign(row.original)}>
              Reassign Retailer
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search name, ID, mobile..."
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          value={masterDistributorId}
          onChange={(e) => onMasterDistributorChange(e.target.value)}
          options={[
            { value: "", label: "All master distributors" },
            ...masterOptions,
          ]}
        />
        <Select
          value={distributorId}
          onChange={(e) => onDistributorChange(e.target.value)}
          options={[
            { value: "", label: "All distributors" },
            ...distributorOptions,
          ]}
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        isLoading={isLoading}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        pageSize={pageSize}
        totalRows={total}
        onPageChange={(idx) => onPageChange(idx + 1)}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 30]}
      />
    </div>
  );
}
