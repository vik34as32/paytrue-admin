export class ApiClientError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiClientError) return error.status;
  return undefined;
}

export function getApiErrorData<T = unknown>(error: unknown): T | undefined {
  if (error instanceof ApiClientError) return error.data as T;
  return undefined;
}

export function isAccountLockedError(error: unknown): boolean {
  return getApiErrorStatus(error) === 423;
}

export function isOtpExpiredMessage(message: string): boolean {
  return /otp\s*expired/i.test(message);
}
