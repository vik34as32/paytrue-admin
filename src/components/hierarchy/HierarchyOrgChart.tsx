"use client";

import { HierarchyNetworkUser } from "@/types/hierarchy";
import { cn, getInitials } from "@/lib/utils";

function roleShort(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "MD";
  if (value.includes("DISTRIBUTOR")) return "DD";
  if (value.includes("RETAIL")) return "RT";
  return "U";
}

function roleLabel(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "Master Distributor";
  if (value.includes("DISTRIBUTOR")) return "Distributor";
  if (value.includes("RETAIL")) return "Retailer";
  return value.replace(/_/g, " ") || "User";
}

function nodeTone(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "hierarchy-node--md";
  if (value.includes("DISTRIBUTOR")) return "hierarchy-node--dd";
  return "hierarchy-node--rt";
}

interface HierarchyOrgChartProps {
  nodes: HierarchyNetworkUser[];
  selectedId?: string | null;
  onSelect?: (node: HierarchyNetworkUser) => void;
}

function OrgBranch({
  node,
  selectedId,
  onSelect,
}: {
  node: HierarchyNetworkUser;
  selectedId?: string | null;
  onSelect?: (node: HierarchyNetworkUser) => void;
}) {
  const hasChildren = node.children.length > 0;
  const selected = selectedId === node.id;

  return (
    <li>
      <button
        type="button"
        className={cn(
          "hierarchy-node",
          nodeTone(node.userType),
          selected && "hierarchy-node--selected"
        )}
        onClick={() => onSelect?.(node)}
        title={`${node.name} · ${roleLabel(node.userType)}`}
      >
        <span className="hierarchy-node__ring">
          <span className="hierarchy-node__avatar">
            {getInitials(node.name || "U")}
          </span>
        </span>
        <span className="hierarchy-node__role">{roleShort(node.userType)}</span>
        <span className="hierarchy-node__name">{node.name}</span>
        {node.userCode ? (
          <span className="hierarchy-node__code">{node.userCode}</span>
        ) : null}
      </button>

      {hasChildren ? (
        <ul>
          {node.children.map((child) => (
            <OrgBranch
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function HierarchyOrgChart({
  nodes,
  selectedId,
  onSelect,
}: HierarchyOrgChartProps) {
  if (!nodes.length) return null;

  return (
    <div className="hierarchy-orgchart">
      <ul className="hierarchy-orgchart__root">
        {nodes.map((node) => (
          <OrgBranch
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}
