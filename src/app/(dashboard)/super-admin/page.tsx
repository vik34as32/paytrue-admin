"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

/** Redirect legacy /super-admin → /super-admin/dashboard */
export default function SuperAdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.superAdminDashboard);
  }, [router]);

  return null;
}
