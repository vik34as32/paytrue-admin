export type ServiceStatus = "ACTIVE" | "INACTIVE";

export type ServiceType = "MAIN" | "SUB";

export interface ServiceMaster {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  displayOrder: number;
  status: ServiceStatus;
  type: ServiceType;
  createdAt?: string;
  updatedAt?: string;
  children?: ServiceMaster[];
}

export interface ServiceListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  parentId?: string;
}

export interface PaginatedServices {
  data: ServiceMaster[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServiceFormPayload {
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
  status: ServiceStatus;
}

export interface ServiceSummaryStats {
  totalServices: number;
  mainServices: number;
  subServices: number;
  activeServices: number;
  inactiveServices: number;
}
