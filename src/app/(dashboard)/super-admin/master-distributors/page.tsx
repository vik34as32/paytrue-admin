"use client";

import { Suspense } from "react";
import { SuperAdminNetworkUsersView } from "@/components/super-admin/SuperAdminNetworkUsersView";

function PageFallback() {
  return (
    <div className="page-container flex min-h-[320px] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function SuperAdminMasterDistributorsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SuperAdminNetworkUsersView kind="MASTER_DISTRIBUTOR" />
    </Suspense>
  );
}
