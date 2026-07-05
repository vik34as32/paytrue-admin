"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { NetworkUserRecord } from "@/types/superAdmin";
import {
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserOutletField,
  getUserOutletName,
  getUserPanNumber,
} from "@/lib/normalizeUser";

interface NetworkUserColumnActions {
  onView: (user: NetworkUserRecord) => void;
  onEdit: (user: NetworkUserRecord) => void;
  onDelete: (user: NetworkUserRecord) => void;
  disabled?: boolean;
}

export function createNetworkUserColumns(
  actions: NetworkUserColumnActions
): ColumnDef<NetworkUserRecord, unknown>[] {
  return [
    {
      id: "profileImage",
      header: "Profile",
      cell: ({ row }) => <NetworkUserAvatar user={row.original} size="sm" />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getNetworkUserName(row.original),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      id: "outletName",
      header: "Outlet Name",
      cell: ({ row }) => getUserOutletName(row.original),
    },
    {
      id: "state",
      header: "State",
      cell: ({ row }) => getUserOutletField(row.original, "state"),
    },
    {
      id: "city",
      header: "City",
      cell: ({ row }) => getUserOutletField(row.original, "city"),
    },
    {
      id: "aadhaarNumber",
      header: "Aadhaar Number",
      cell: ({ row }) => getUserAadhaarNumber(row.original),
    },
    {
      id: "panNumber",
      header: "PAN Number",
      cell: ({ row }) => getUserPanNumber(row.original),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="View user"
            disabled={actions.disabled}
            onClick={() => actions.onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit user"
            disabled={actions.disabled}
            onClick={() => actions.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete user"
            disabled={actions.disabled}
            onClick={() => actions.onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-accent-red" />
          </Button>
        </div>
      ),
    },
  ];
}
