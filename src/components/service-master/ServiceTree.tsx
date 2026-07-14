"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import type { ServiceMaster } from "@/types/serviceMaster";
import { cn, getInitials } from "@/lib/utils";

interface ServiceTreeProps {
  tree: ServiceMaster[];
  isLoading?: boolean;
}

function countNodes(node: ServiceMaster): number {
  return (
    1 +
    (node.children || []).reduce((sum, child) => sum + countNodes(child), 0)
  );
}

function nodeTone(depth: number): string {
  if (depth === 0) return "service-tree-node--root";
  if (depth === 1) return "service-tree-node--child";
  return "service-tree-node--leaf";
}

function OrgBranch({
  node,
  depth = 0,
}: {
  node: ServiceMaster;
  depth?: number;
}) {
  const children = node.children || [];

  return (
    <li>
      <div
        className={cn("service-tree-node", nodeTone(depth))}
        title={`${node.name}${node.code ? ` · ${node.code}` : ""}`}
      >
        <span className="service-tree-node__ring">
          <span className="service-tree-node__avatar">
            {getInitials(node.name || "S")}
          </span>
        </span>
        <span className="service-tree-node__badge">
          {depth === 0 ? "PARENT" : depth === 1 ? "CHILD" : "NODE"}
        </span>
        <span className="service-tree-node__name">{node.name}</span>
        {node.code ? (
          <span className="service-tree-node__code">{node.code}</span>
        ) : null}
      </div>

      {children.length ? (
        <ul>
          {children.map((child) => (
            <OrgBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ServiceOrgChart({ root }: { root: ServiceMaster }) {
  return (
    <div className="hierarchy-orgchart service-tree-orgchart">
      <ul className="hierarchy-orgchart__root">
        <OrgBranch node={root} depth={0} />
      </ul>
    </div>
  );
}

export function ServiceTree({ tree, isLoading }: ServiceTreeProps) {
  const roots = useMemo(
    () =>
      [...tree]
        .filter((node) => !node.parentId)
        .sort(
          (a, b) =>
            (a.displayOrder || 0) - (b.displayOrder || 0) ||
            a.name.localeCompare(b.name)
        ),
    [tree]
  );

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

  useEffect(() => {
    if (!roots.length) {
      setSelectedRootId(null);
      return;
    }
    setSelectedRootId((current) => {
      if (current && roots.some((root) => root.id === current)) return current;
      return roots[0].id;
    });
  }, [roots]);

  const selectedRoot = useMemo(
    () => roots.find((root) => root.id === selectedRootId) || null,
    [roots, selectedRootId]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: "wrap" }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                width={140}
                height={40}
                sx={{ borderRadius: 999 }}
              />
            ))}
          </Stack>
          <Skeleton variant="rounded" height={320} />
        </CardContent>
      </Card>
    );
  }

  if (!roots.length) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No parent services found in tree.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            mb: 2.5,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Service Hierarchy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click a parent node (AEPS / DMT / UPI ATM) to view its tree
            </Typography>
          </Box>
          {selectedRoot ? (
            <Chip
              icon={<AccountTreeOutlinedIcon />}
              label={`${selectedRoot.name} · ${countNodes(selectedRoot)} nodes`}
              color="primary"
              variant="outlined"
            />
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={1.25}
          useFlexGap
          sx={{ flexWrap: "wrap", mb: 3 }}
        >
          {roots.map((root) => {
            const selected = root.id === selectedRootId;
            const childCount = root.children?.length || 0;
            return (
              <Chip
                key={root.id}
                clickable
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                onClick={() => setSelectedRootId(root.id)}
                label={`${root.name}${childCount ? ` (${childCount})` : ""}`}
                sx={{
                  fontWeight: 700,
                  px: 0.5,
                  height: 40,
                  borderRadius: 999,
                }}
              />
            );
          })}
        </Stack>

        {selectedRoot ? (
          <Box
            sx={{
              overflowX: "auto",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              minHeight: 360,
            }}
          >
            <ServiceOrgChart root={selectedRoot} />
          </Box>
        ) : (
          <Typography color="text.secondary">
            Select a parent service to view its tree structure.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
