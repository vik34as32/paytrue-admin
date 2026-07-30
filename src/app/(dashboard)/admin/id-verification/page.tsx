"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

/** ID verification is now on Retailers / Master Distributors pages. */
export default function AdminIdVerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.adminRetailers);
  }, [router]);

  return null;
}
