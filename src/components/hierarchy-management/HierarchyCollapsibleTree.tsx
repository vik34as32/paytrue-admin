"use client";

import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { HierarchyNetworkUser } from "@/types/hierarchy";
import { Badge } from "@/components/common/Badge";
import { cn, getInitials } from "@/lib/utils";
import {
  countDescendants,
  roleFullLabel,
  roleShortLabel,
  statusBadgeVariant,
} from "@/lib/hierarchy/display";

interface HierarchyCollapsibleTreeProps {
  nodes: HierarchyNetworkUser[];
  expandedIds: Set<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: HierarchyNetworkUser) => void;
  onReassignRetailer?: (node: HierarchyNetworkUser) => void;
  onReassignDistributor?: (node: HierarchyNetworkUser) => void;
  canReassignRetailer?: boolean;
  canReassignDistributor?: boolean;
}

function NodeCard({
  node,
  expanded,
  selected,
  onToggle,
  onSelect,
  onReassignRetailer,
  onReassignDistributor,
  canReassignRetailer,
  canReassignDistributor,
}: {
  node: HierarchyNetworkUser;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onReassignRetailer?: () => void;
  onReassignDistributor?: () => void;
  canReassignRetailer?: boolean;
  canReassignDistributor?: boolean;
}) {
  const type = String(node.userType || "").toUpperCase();
  const isMd = type.includes("MASTER");
  const isDd = type.includes("DISTRIBUTOR") && !isMd;
  const isRt = type.includes("RETAIL");
  const hasChildren = node.children.length > 0;
  const downline = countDescendants(node);

  return (
    <div
      className={cn(
        "group relative w-[200px] rounded-2xl border bg-white p-3 text-left shadow-sm transition-all dark:bg-card",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:shadow-md",
        isMd && "border-violet-200",
        isDd && "border-sky-200",
        isRt && "border-emerald-200"
      )}
    >
      <div className="flex items-start gap-2">
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mt-1 rounded-lg border border-border p-1 text-muted hover:bg-muted/50"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="mt-1 h-6 w-6" />
        )}

        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                isMd && "bg-violet-600",
                isDd && "bg-sky-600",
                isRt && "bg-emerald-600",
                !isMd && !isDd && !isRt && "bg-slate-500"
              )}
            >
              {getInitials(node.name || "U")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {node.name}
              </p>
              <p className="truncate text-[11px] font-medium text-muted">
                {node.userCode || node.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                isMd && "bg-violet-100 text-violet-700",
                isDd && "bg-sky-100 text-sky-700",
                isRt && "bg-emerald-100 text-emerald-700"
              )}
            >
              {roleShortLabel(node.userType)}
            </span>
            {node.status ? (
              <Badge variant={statusBadgeVariant(node.status)}>
                {node.status}
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {roleFullLabel(node.userType)}
          </p>

          {hasChildren ? (
            <p className="mt-1 text-xs text-muted">
              {isMd
                ? `${node.children.length} distributors · ${downline} downline`
                : `${node.children.length} retailers · ${downline} downline`}
            </p>
          ) : null}
        </button>

        {(isDd && canReassignDistributor) || (isRt && canReassignRetailer) ? (
          <div className="relative">
            <details className="group/menu">
              <summary
                className="list-none cursor-pointer rounded-lg p-1 text-muted hover:bg-muted/50 [&::-webkit-details-marker]:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                {isDd && canReassignDistributor ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                    onClick={(e) => {
                      e.preventDefault();
                      onReassignDistributor?.();
                    }}
                  >
                    Reassign Distributor
                  </button>
                ) : null}
                {isRt && canReassignRetailer ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                    onClick={(e) => {
                      e.preventDefault();
                      onReassignRetailer?.();
                    }}
                  >
                    Reassign Retailer
                  </button>
                ) : null}
              </div>
            </details>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TreeBranch({
  nodes,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onReassignRetailer,
  onReassignDistributor,
  canReassignRetailer,
  canReassignDistributor,
}: HierarchyCollapsibleTreeProps) {
  return (
    <ul className="hm-org__list">
      {nodes.map((node) => {
        const expanded = expandedIds.has(node.id);
        const hasChildren = node.children.length > 0;
        return (
          <li key={node.id} className="hm-org__item">
            <NodeCard
              node={node}
              expanded={expanded}
              selected={selectedId === node.id}
              onToggle={() => onToggle(node.id)}
              onSelect={() => onSelect(node)}
              onReassignRetailer={() => onReassignRetailer?.(node)}
              onReassignDistributor={() => onReassignDistributor?.(node)}
              canReassignRetailer={canReassignRetailer}
              canReassignDistributor={canReassignDistributor}
            />
            {hasChildren && expanded ? (
              <TreeBranch
                nodes={node.children}
                expandedIds={expandedIds}
                selectedId={selectedId}
                onToggle={onToggle}
                onSelect={onSelect}
                onReassignRetailer={onReassignRetailer}
                onReassignDistributor={onReassignDistributor}
                canReassignRetailer={canReassignRetailer}
                canReassignDistributor={canReassignDistributor}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function HierarchyCollapsibleTree(props: HierarchyCollapsibleTreeProps) {
  if (!props.nodes.length) return null;

  return (
    <div className="hm-org">
      <TreeBranch {...props} />
    </div>
  );
}
