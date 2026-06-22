"use client";

import { Card, CardHeader } from "@/components/common/Card";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { formatCurrency } from "@/lib/utils";

export default function MasterDistributorPage() {
  const { user } = useRoleAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Master Distributor Panel</h1>
        <p className="text-sm text-muted">Oversee distributors and balance flows</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Available Balance" />
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(user?.balance || 0)}
          </p>
        </Card>
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.balanceTransfer}><Button size="sm">Transfer</Button></Link>
            <Link href={ROUTES.requests}><Button size="sm" variant="outline">Requests</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
