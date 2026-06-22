"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useRoleAccess } from "@/hooks/useAuth";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import Link from "next/link";

export default function SuperAdminPage() {
  const { isSuperAdmin } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isSuperAdmin) router.replace(ROUTES.dashboard);
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Super Admin Panel</h1>
        <p className="text-sm text-muted">
          Full system control — create and manage all user types
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Create Admin", desc: "Add new admin users", href: ROUTES.users },
          { title: "Create Master Distributor", desc: "Add master distributors", href: ROUTES.users },
          { title: "Create Distributor", desc: "Add distributors", href: ROUTES.users },
          { title: "Create Retailer", desc: "Add retailers", href: ROUTES.users },
          { title: "User Hierarchy", desc: "View organization tree", href: ROUTES.hierarchy },
          { title: "System Reports", desc: "Export financial reports", href: ROUTES.reports },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} subtitle={item.desc} />
            <Link href={item.href}>
              <Button size="sm">Manage</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
