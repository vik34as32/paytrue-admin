import type { FintechService } from "@/types/commission";
import type { ServiceMaster } from "@/types/serviceMaster";

export type CommissionServiceKind = "dmt" | "aeps" | "upi_atm" | "other";

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Classify parent services for commission dropdown rules. */
export function classifyCommissionService(
  service: Pick<ServiceMaster, "name" | "code">
): CommissionServiceKind {
  const key = normalizeKey(`${service.code} ${service.name}`);

  if (
    key === "upiatm" ||
    key.includes("upiatm") ||
    (key.includes("upi") && key.includes("atm"))
  ) {
    return "upi_atm";
  }

  // Exact parent codes / names only — don't treat "AEPS Cash Withdrawal" as a parent kind when mis-parented
  if (key === "aeps") return "aeps";
  if (key === "dmt") return "dmt";

  if (key.startsWith("aeps") && !key.includes("cash") && !key.includes("balance")) {
    return "aeps";
  }
  if (key.startsWith("dmt") && key.length <= 5) {
    return "dmt";
  }

  return "other";
}

function toFintechService(
  service: ServiceMaster,
  overrides?: Partial<FintechService>
): FintechService {
  return {
    id: service.id,
    name: service.name,
    code: service.code,
    parentId: service.parentId ?? null,
    parentName: service.parentName ?? null,
    category: service.parentName ?? undefined,
    ...overrides,
  };
}

function isActive(service: ServiceMaster): boolean {
  return String(service.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
}

function childLabel(parentName: string, childName: string): string {
  return `${parentName} · ${childName}`;
}

function getActiveChildren(
  parent: ServiceMaster,
  byParent: Map<string, ServiceMaster[]>
): ServiceMaster[] {
  const children = (
    parent.children?.filter(isActive) ??
    byParent.get(parent.id) ??
    []
  ).slice();

  children.sort(
    (a, b) =>
      (a.displayOrder || 0) - (b.displayOrder || 0) ||
      a.name.localeCompare(b.name)
  );
  return children;
}

function buildParentChildIndex(treeOrFlat: ServiceMaster[]) {
  const parents = treeOrFlat.filter(
    (service) => !service.parentId && isActive(service)
  );

  const byParent = new Map<string, ServiceMaster[]>();
  const byId = new Map<string, ServiceMaster>();

  for (const service of treeOrFlat) {
    byId.set(service.id, service);
    if (!service.parentId || !isActive(service)) continue;
    const list = byParent.get(service.parentId) ?? [];
    list.push(service);
    byParent.set(service.parentId, list);
  }

  return { parents, byParent, byId };
}

/**
 * Full lookup catalog (id + code → display label).
 * Used so Saved rows never show raw codes like SVC008.
 */
export function buildCommissionServiceCatalog(
  treeOrFlat: ServiceMaster[]
): FintechService[] {
  const { parents, byParent, byId } = buildParentChildIndex(treeOrFlat);
  const result: FintechService[] = [];
  const seen = new Set<string>();

  const push = (service: FintechService) => {
    if (!service.id || seen.has(service.id)) return;
    seen.add(service.id);
    result.push(service);
  };

  for (const parent of parents) {
    const children = getActiveChildren(parent, byParent);
    push(
      toFintechService(parent, {
        group: parent.name,
        label: parent.name,
        name: parent.name,
      })
    );

    for (const child of children) {
      const label = childLabel(parent.name, child.name);
      push(
        toFintechService(child, {
          group: parent.name,
          parentId: parent.id,
          parentName: parent.name,
          label,
          name: label,
        })
      );
    }
  }

  // Orphans / any remaining active nodes
  for (const service of treeOrFlat) {
    if (!isActive(service) || seen.has(service.id)) continue;
    const parent = service.parentId ? byId.get(service.parentId) : undefined;
    const label = parent
      ? childLabel(parent.name, service.name)
      : service.name;
    push(
      toFintechService(service, {
        label,
        name: label,
        parentName: parent?.name ?? service.parentName,
        group: parent?.name ?? service.name,
      })
    );
  }

  return result;
}

/**
 * Dropdown options for Add Service / New rows.
 *
 * Rules:
 * - DMT / AEPS with sub-services → ONLY "DMT · IMPS" style entries (parent alone hidden)
 * - UPI ATM → parent only (no sub-services)
 * - Other parents with children → only children labeled "Parent · Child"
 * - Parents without children → parent alone
 */
export function buildCommissionSelectableServices(
  treeOrFlat: ServiceMaster[]
): FintechService[] {
  const { parents, byParent } = buildParentChildIndex(treeOrFlat);
  const result: FintechService[] = [];
  const seen = new Set<string>();

  const push = (service: FintechService) => {
    if (!service.id || seen.has(service.id)) return;
    seen.add(service.id);
    result.push(service);
  };

  for (const parent of parents) {
    const kind = classifyCommissionService(parent);
    const children = getActiveChildren(parent, byParent);

    if (kind === "upi_atm") {
      push(
        toFintechService(parent, {
          group: parent.name,
          label: parent.name,
          name: parent.name,
        })
      );
      continue;
    }

    // DMT / AEPS / other: if sub-services exist, NEVER show parent alone
    if (children.length > 0) {
      for (const child of children) {
        const label = childLabel(parent.name, child.name);
        push(
          toFintechService(child, {
            group: parent.name,
            parentId: parent.id,
            parentName: parent.name,
            label,
            name: label,
          })
        );
      }
      continue;
    }

    // No children → parent is selectable (e.g. stand-alone service)
    push(
      toFintechService(parent, {
        group: parent.name,
        label: parent.name,
        name: parent.name,
      })
    );
  }

  return result;
}

export function resolveCommissionServiceLabel(
  serviceId: string | undefined,
  serviceName: string | undefined,
  catalog: FintechService[]
): string {
  if (!serviceId && !serviceName) return "Unknown service";

  const byId = catalog.find((item) => item.id === serviceId);
  if (byId) return byId.label ?? byId.name;

  const byCode = catalog.find(
    (item) =>
      item.code &&
      (item.code === serviceId ||
        item.code === serviceName ||
        normalizeKey(item.code) === normalizeKey(serviceName || ""))
  );
  if (byCode) return byCode.label ?? byCode.name;

  const byName = catalog.find(
    (item) =>
      item.name === serviceName ||
      item.label === serviceName ||
      normalizeKey(item.name) === normalizeKey(serviceName || "")
  );
  if (byName) return byName.label ?? byName.name;

  // Avoid showing bare codes like SVC008 when we have nothing better
  if (serviceName && !/^svc\d+$/i.test(serviceName.trim())) {
    return serviceName;
  }

  return serviceName || serviceId || "Unknown service";
}

/** Flat select options — labels already include parent prefix for children. */
export function toCommissionServiceSelectOptions(
  services: FintechService[]
): { value: string; label: string }[] {
  return services.map((service) => ({
    value: service.id,
    label: service.label ?? service.name,
  }));
}
