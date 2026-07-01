"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

/** Redirect legacy virtual-balance route to live add-balance page */
export default function VirtualBalancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.superAdminAddBalance);
  }, [router]);

  return null;
}
