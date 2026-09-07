export type ProviderErrorProvider = "NIFI" | "INSTANTPAY" | "FINZENG";

export type ProviderErrorType =
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP_ERROR"
  | "PROVIDER_FAILURE";

export interface ProviderErrorLogListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  provider?: ProviderErrorProvider | "";
  service?: string;
  endpoint?: string;
  transactionId?: string;
  referenceId?: string;
  statusCode?: number | "";
  errorType?: ProviderErrorType | "";
  dateFrom?: string;
  dateTo?: string;
}

export interface ProviderErrorLogRecord {
  id: string;
  provider?: string;
  service?: string;
  endpoint?: string;
  method?: string;
  httpMethod?: string;
  statusCode?: number | null;
  errorType?: string;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
  transactionId?: string;
  referenceId?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  requestBody?: unknown;
  responseBody?: unknown;
  requestHeaders?: unknown;
  responseHeaders?: unknown;
  durationMs?: number | null;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface ProviderErrorLogListResult {
  data: ProviderErrorLogRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
