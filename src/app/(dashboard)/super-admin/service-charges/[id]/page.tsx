"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceChargeDetailView } from "@/components/service-charges/ServiceChargeDetailView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminServiceChargeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const id = params?.id;

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess || !id) return null;

  return <ServiceChargeDetailView planId={id} />;
}
