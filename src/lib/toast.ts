import { toast } from "sonner";
import {
  getApiSuccessMessage,
  getThrownErrorMessage,
} from "@/lib/api/messages";

/** Show exact backend error message when available. */
export function toastBackendError(
  error: unknown,
  fallback = "Something went wrong"
) {
  toast.error(getThrownErrorMessage(error, fallback));
}

/** Show exact backend success message when available. */
export function toastBackendSuccess(
  responseOrMessage: unknown,
  fallback: string
) {
  if (typeof responseOrMessage === "string") {
    toast.success(responseOrMessage.trim() || fallback);
    return;
  }
  toast.success(getApiSuccessMessage(responseOrMessage, fallback));
}
