"use client";

import { Card, CardHeader } from "@/components/common/Card";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { formatCurrency } from "@/lib/utils";

export default function DistributorPage() {
  const { user } = useRoleAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Distributor Panel</h1>
        <p className="text-sm text-muted">Manage retailers and balance distribution</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Your Balance" />
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(user?.balance || 0)}
          </p>
        </Card>
        <Card>
          <CardHeader title="Actions" />
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.balanceTransfer}><Button size="sm">Transfer to Retailer</Button></Link>
            <Link href={ROUTES.requests}><Button size="sm" variant="outline">Approve Requests</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
