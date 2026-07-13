import { AxiosError } from "axios";

type BackendErrorBody = {
  message?: string;
  error?: string;
  errors?:
    | Array<string | { field?: string; message?: string; msg?: string }>
    | Record<string, string[] | string>;
};

function extractFieldErrorMessages(
  errors: BackendErrorBody["errors"]
): string | null {
  if (!errors) return null;

  if (Array.isArray(errors)) {
    const messages = errors
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return item.message || item.msg || null;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value?.trim()));

    return messages.length ? messages.join(", ") : null;
  }

  const fieldMessages = Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));

  return fieldMessages.length ? fieldMessages.join(", ") : null;
}

/** Prefer backend `message` exactly as returned by the API. */
export function getErrorMessage(
  error: AxiosError | unknown,
  fallback = "An unexpected error occurred"
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  // Already normalized Error from our interceptors
  if (error instanceof Error && !(error as AxiosError).isAxiosError) {
    if (
      error.message &&
      error.message !== "Network Error" &&
      !error.message.startsWith("Request failed with status code")
    ) {
      return error.message;
    }
  }

  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data as BackendErrorBody | undefined;

  if (data?.message?.trim()) {
    return data.message.trim();
  }

  const fieldMessages = extractFieldErrorMessages(data?.errors);
  if (fieldMessages) return fieldMessages;

  if (data?.error?.trim()) return data.error.trim();

  if (status === 403) return "You do not have permission to perform this action";
  if (status === 404) return "The requested resource was not found";
  if (status === 422) return "Validation failed. Please check your input";
  if (status === 500) return "Server error. Please try again later";
  if (!axiosError.response) return "Network error. Please check your connection";

  return axiosError.message || fallback;
}

export function getApiSuccessMessage(
  response: unknown,
  fallback: string
): string {
  if (response && typeof response === "object") {
    const message = (response as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return fallback;
}

export function getThrownErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return fallback;
}
