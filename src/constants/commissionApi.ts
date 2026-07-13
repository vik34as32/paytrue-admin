/** Commissions module — prefix `/api/v1` */
export const COMMISSION_API = {
  base: "/commissions",
  retailer: (retailerId: string) => `/commissions/retailer/${retailerId}`,
  byId: (id: string) => `/commissions/${id}`,
  slabs: "/commissions/slabs",
} as const;
