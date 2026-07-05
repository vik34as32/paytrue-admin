import { RootState } from "@/store";

export function selectIsAuthRestoring(state: RootState) {
  const { auth, superAdminAuth } = state;
  return (
    !auth.isInitialized ||
    auth.isLoading ||
    !superAdminAuth.isInitialized ||
    superAdminAuth.isLoading
  );
}

export function selectIsAuthReady(state: RootState) {
  return !selectIsAuthRestoring(state);
}
