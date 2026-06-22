"use client";

import { Card, CardHeader } from "@/components/common/Card";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { Button } from "@/components/common/Button";

export default function AdminPage() {
  const { user } = useRoleAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted">
          Manage distributors, requests and reports under your hierarchy
        </p>
      </div>
      <Card>
        <CardHeader
          title={`Welcome, ${user?.name}`}
          subtitle="Approve requests and monitor your network"
        />
        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.requests}><Button>View Requests</Button></Link>
          <Link href={ROUTES.reports}><Button variant="outline">Reports</Button></Link>
          <Link href={ROUTES.hierarchy}><Button variant="outline">Hierarchy</Button></Link>
        </div>
      </Card>
    </div>
  );
}
