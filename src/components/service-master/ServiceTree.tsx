"use client";

import type { ReactNode } from "react";
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import type { ServiceMaster } from "@/types/serviceMaster";

interface ServiceTreeProps {
  tree: ServiceMaster[];
  isLoading?: boolean;
}

function renderTreeNodes(nodes: ServiceMaster[]): ReactNode {
  return nodes.map((node) => (
    <TreeItem key={node.id} itemId={node.id} label={node.name}>
      {node.children?.length ? renderTreeNodes(node.children) : null}
    </TreeItem>
  ));
}

export function ServiceTree({ tree, isLoading }: ServiceTreeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={28} sx={{ mb: 1.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!tree.length) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">No services found in tree.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Service Hierarchy
        </Typography>
        <Box sx={{ maxHeight: 560, overflow: "auto" }}>
          <SimpleTreeView defaultExpandedItems={tree.map((node) => node.id)}>
            {renderTreeNodes(tree)}
          </SimpleTreeView>
        </Box>
      </CardContent>
    </Card>
  );
}
