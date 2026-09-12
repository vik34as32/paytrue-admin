/** Allowed hierarchy list page sizes — never request huge limits like 200. */
export const HIERARCHY_PAGE_SIZES = [10, 20, 30] as const;
export type HierarchyPageSize = (typeof HIERARCHY_PAGE_SIZES)[number];

/** Default page size for hierarchy list / dropdown APIs */
export const HIERARCHY_DEFAULT_LIMIT: HierarchyPageSize = 20;
