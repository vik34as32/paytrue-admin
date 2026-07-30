"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

/** ID verification is now on Retailers / Master Distributors pages. */
export default function SuperAdminIdVerificationPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    router.replace(ROUTES.superAdminRetailers);
  }, [hasSuperAdminWalletAccess, router]);

  return null;
}
