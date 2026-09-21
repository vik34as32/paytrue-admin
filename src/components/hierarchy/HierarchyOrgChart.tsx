"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { HierarchyNetworkUser } from "@/types/hierarchy";
import { cn, getInitials } from "@/lib/utils";

const METRICS = {
  default: { nodeW: 148, nodeH: 112, hGap: 28, vGap: 72 },
  compact: { nodeW: 118, nodeH: 92, hGap: 14, vGap: 46 },
} as const;

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

function tone(userType?: string): "md" | "dd" | "rt" {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "md";
  if (value.includes("DISTRIBUTOR")) return "dd";
  return "rt";
}

interface LaidOutNode {
  node: HierarchyNetworkUser;
  x: number;
  y: number;
  depth: number;
}

interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midY: number;
}

function layoutTree(
  roots: HierarchyNetworkUser[],
  metrics: (typeof METRICS)[keyof typeof METRICS]
): {
  nodes: LaidOutNode[];
  edges: Edge[];
  width: number;
  height: number;
} {
  const { nodeW, nodeH, hGap, vGap } = metrics;
  const laid: LaidOutNode[] = [];
  const edges: Edge[] = [];
  let nextLeafX = 0;

  const measure = (node: HierarchyNetworkUser, depth: number): number => {
    if (!node.children.length) {
      const x = nextLeafX;
      nextLeafX += nodeW + hGap;
      laid.push({ node, x, y: depth * (nodeH + vGap), depth });
      return x;
    }

    const childXs = node.children.map((child) => measure(child, depth + 1));
    const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    const y = depth * (nodeH + vGap);
    laid.push({ node, x, y, depth });

    for (const child of node.children) {
      const childLaid = laid.find((item) => item.node.id === child.id);
      if (!childLaid) continue;
      edges.push({
        x1: x + nodeW / 2,
        y1: y + nodeH,
        x2: childLaid.x + nodeW / 2,
        y2: childLaid.y,
        midY: y + nodeH + vGap / 2,
      });
    }

    return x;
  };

  for (const root of roots) {
    measure(root, 0);
    nextLeafX += hGap;
  }

  const maxX = laid.reduce((m, n) => Math.max(m, n.x + nodeW), nodeW);
  const maxY = laid.reduce((m, n) => Math.max(m, n.y + nodeH), nodeH);

  return {
    nodes: laid,
    edges,
    width: Math.max(maxX + 16, 280),
    height: Math.max(maxY + 16, 200),
  };
}

interface HierarchyOrgChartProps {
  nodes: HierarchyNetworkUser[];
  selectedId?: string | null;
  onSelect?: (node: HierarchyNetworkUser) => void;
  /** Fit entire tree width into the visible canvas */
  fitToView?: boolean;
  /** contain = width + height on one screen */
  fitMode?: "width" | "contain";
  compact?: boolean;
  className?: string;
}

export function HierarchyOrgChart({
  nodes,
  selectedId,
  onSelect,
  fitToView = true,
  fitMode,
  compact = false,
  className,
}: HierarchyOrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const metrics = compact ? METRICS.compact : METRICS.default;
  const layout = useMemo(() => layoutTree(nodes, metrics), [nodes, metrics]);
  const mode = fitMode ?? (fitToView ? "width" : undefined);

  useEffect(() => {
    if (!mode || !containerRef.current) {
      setScale(1);
      return;
    }

    const el = containerRef.current;
    const update = () => {
      const pad = 12;
      const availW = Math.max(el.clientWidth - pad, 120);
      const availH = Math.max(el.clientHeight - pad, 120);
      const byW = availW / layout.width;
      const byH = availH / layout.height;
      const next =
        mode === "contain"
          ? Math.min(1, byW, byH)
          : Math.min(1, byW);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout.width, layout.height, mode, nodes]);

  if (!nodes.length) return null;

  const toneClass = {
    md: "dsa-tree__node--md",
    dd: "dsa-tree__node--dd",
    rt: "dsa-tree__node--rt",
  } as const;

  const stageW = layout.width * scale;
  const stageH = layout.height * scale;

  return (
    <div
      ref={containerRef}
      className={cn(
        "dsa-tree",
        mode === "contain" && "dsa-tree--contain",
        className
      )}
    >
      <div
        className="dsa-tree__stage"
        style={{
          width: stageW,
          height: stageH,
        }}
      >
        <div
          className="dsa-tree__canvas"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <svg
            className="dsa-tree__edges"
            width={layout.width}
            height={layout.height}
            aria-hidden
          >
            {layout.edges.map((edge, index) => {
              const path = `M ${edge.x1} ${edge.y1} V ${edge.midY} H ${edge.x2} V ${edge.y2}`;
              return (
                <path
                  key={`${edge.x1}-${edge.x2}-${index}`}
                  d={path}
                  className="dsa-tree__edge"
                  fill="none"
                />
              );
            })}
          </svg>

          {layout.nodes.map(({ node, x, y }) => {
            const selected = selectedId === node.id;
            const kind = tone(node.userType);
            return (
              <button
                key={node.id}
                type="button"
                className={cn(
                  "dsa-tree__node",
                  compact && "dsa-tree__node--compact",
                  toneClass[kind],
                  selected && "dsa-tree__node--selected"
                )}
                style={{
                  left: x,
                  top: y,
                  width: metrics.nodeW,
                  height: metrics.nodeH,
                }}
                onClick={() => onSelect?.(node)}
                title={`${node.name} · ${roleLabel(node.userType)}`}
              >
                <span className="dsa-tree__avatar">
                  {getInitials(node.name || "U")}
                </span>
                <span className="dsa-tree__role">{roleShort(node.userType)}</span>
                <span className="dsa-tree__name">{node.name}</span>
                {node.userCode ? (
                  <span className="dsa-tree__code">{node.userCode}</span>
                ) : null}
                {node.children.length ? (
                  <span className="dsa-tree__kids">
                    {node.children.length} downline
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
