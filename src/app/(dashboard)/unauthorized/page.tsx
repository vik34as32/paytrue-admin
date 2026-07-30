"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ROUTES } from "@/constants";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-red/10 text-accent-red">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted">
          You do not have permission to access this resource. This area is
          restricted to Super Admin.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={ROUTES.superAdminDashboard}>
            <Button type="button">Go to Super Admin Dashboard</Button>
          </Link>
          <Link href={ROUTES.login}>
            <Button type="button" variant="outline">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
