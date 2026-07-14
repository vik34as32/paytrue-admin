import type { ServiceMaster } from "@/types/serviceMaster";

/** Collect a flat list from tree or mixed list. */
export function flattenServices(services: ServiceMaster[]): ServiceMaster[] {
  return services.flatMap((service) => [
    service,
    ...flattenServices(service.children || []),
  ]);
}

/** Root / main services only (`parentId` null). */
export function getParentServices(services: ServiceMaster[]): ServiceMaster[] {
  return services.filter((service) => !service.parentId);
}

function extractTrailingNumber(code: string): {
  prefix: string;
  number: number;
  width: number;
} | null {
  const match = code.trim().match(/^(.*?)(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    number: Number(match[2]),
    width: match[2].length,
  };
}

/**
 * Suggest next service code from previous rows under the same parent context.
 * - Pure numeric codes → max + 1
 * - Prefixed numeric (DMT001) → same prefix, increment number
 * - Fallback → SVC{displayOrder padded}
 */
export function suggestNextServiceCode(
  services: ServiceMaster[],
  parentId: string | null | undefined,
  nextDisplayOrder: number
): string {
  const siblings = services.filter(
    (service) => (service.parentId || null) === (parentId || null)
  );

  const numericCodes = siblings
    .map((service) => Number(service.code))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (numericCodes.length === siblings.length && numericCodes.length > 0) {
    return String(Math.max(...numericCodes) + 1);
  }

  const parsed = siblings
    .map((service) => extractTrailingNumber(service.code))
    .filter(
      (
        value
      ): value is { prefix: string; number: number; width: number } =>
        value !== null
    );

  if (parsed.length) {
    // Prefer most common prefix among siblings
    const prefixCounts = new Map<string, number>();
    for (const item of parsed) {
      prefixCounts.set(item.prefix, (prefixCounts.get(item.prefix) || 0) + 1);
    }
    const preferredPrefix =
      [...prefixCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      parsed[parsed.length - 1].prefix;

    const samePrefix = parsed.filter((item) => item.prefix === preferredPrefix);
    const maxNum = Math.max(...samePrefix.map((item) => item.number));
    const width = Math.max(...samePrefix.map((item) => item.width));
    return `${preferredPrefix}${String(maxNum + 1).padStart(width, "0")}`;
  }

  return `SVC${String(Math.max(nextDisplayOrder, 1)).padStart(3, "0")}`;
}

/** Next display order among siblings (same parent), falling back to all services. */
export function suggestNextDisplayOrder(
  services: ServiceMaster[],
  parentId: string | null | undefined
): number {
  const siblings = services.filter(
    (service) => (service.parentId || null) === (parentId || null)
  );
  const pool = siblings.length ? siblings : services;
  const maxOrder = pool.reduce(
    (max, service) => Math.max(max, Number(service.displayOrder) || 0),
    0
  );
  return maxOrder + 1;
}

export function suggestCreateDefaults(
  services: ServiceMaster[],
  parentId: string | null | undefined = null
) {
  const displayOrder = suggestNextDisplayOrder(services, parentId);
  const code = suggestNextServiceCode(services, parentId, displayOrder);
  return { code, displayOrder };
}
