"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceChargeEditView } from "@/components/service-charges/ServiceChargeEditView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminServiceChargeEditPage() {
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

  return <ServiceChargeEditView planId={id} />;
}
