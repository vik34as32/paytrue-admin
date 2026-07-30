"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

/** Legacy admin ledger route — redirect to centralized ledger. */
export default function AdminLedgerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ledger/admin");
  }, [router]);

  return null;
}
