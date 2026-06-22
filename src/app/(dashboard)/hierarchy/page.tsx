"use client";

import { useEffect, useState } from "react";
import { mockApi } from "@/services/mockApi";
import { HierarchyNode } from "@/types";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { ROLES } from "@/constants";
import { cn } from "@/lib/utils";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";

function TreeNode({ node, depth = 0 }: { node: HierarchyNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn("ml-0", depth > 0 && "ml-6 border-l-2 border-border pl-4")}>
      <div
        className="mb-2 flex cursor-pointer items-start gap-2 rounded-xl bg-background/50 p-3 hover:bg-background transition-colors"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <HiChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          ) : (
            <HiChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          )
        ) : (
          <span className="w-4" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{node.name}</span>
            <Badge variant="default">{ROLES[node.role]}</Badge>
            <Badge variant={node.status as "active" | "suspended" | "inactive"}>
              {node.status}
            </Badge>
          </div>
          {node.createdByName && (
            <p className="mt-1 text-xs text-muted">
              Created by <span className="font-medium text-foreground">{node.createdByName}</span>
            </p>
          )}
        </div>
      </div>
      {expanded &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function HierarchyPage() {
  const [tree, setTree] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getHierarchy().then((data) => {
      setTree(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Hierarchy</h1>
        <p className="text-sm text-muted">
          Organizational tree showing who created whom
        </p>
      </div>

      <Card>
        <CardHeader
          title="Organization Tree"
          subtitle="Super Admin → Admin → Master Distributor → Distributor → Retailer"
        />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
